"""API regression tests with an isolated fake persistence boundary; no Mongo service."""
import os
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("DB_NAME", "law_suite_test_boundaries")
os.environ["LAW_SUITE_AI_MODE"] = "offline"

from fastapi.testclient import TestClient
from backend import server


class ApiBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.environment = patch.dict(os.environ, {"LAW_SUITE_ALLOW_LOCAL_DEMO": "true"})
        self.environment.start()
        self.client = TestClient(server.app)
        self.db = MagicMock()
        self.db.deal_rooms.find_one = AsyncMock(return_value={"id": "sample-matter"})
        self.db.documents.insert_one = AsyncMock()
        self.db.advisory_logs.insert_one = AsyncMock()
        self.database = patch.object(server, "db", self.db)
        self.database.start()

    def tearDown(self):
        self.client.close()
        self.database.stop()
        self.environment.stop()

    def upload(self, content=b"synthetic sample text", **extra):
        return self.client.post("/api/documents/upload", files={"file": ("sample.txt", content, "text/plain")}, data={"deal_room_id": "sample-matter", **extra})

    def test_data_endpoints_fail_closed_without_opt_in(self):
        with patch.dict(os.environ, {"LAW_SUITE_ALLOW_LOCAL_DEMO": "false"}):
            for method, path in [("get", "/api/deal-rooms"), ("post", "/api/chat"), ("delete", "/api/documents/example")]:
                self.assertEqual(getattr(self.client, method)(path).status_code, 503)
            self.assertEqual(self.client.get("/api/").status_code, 200)
        self.db.deal_rooms.find.assert_not_called()

    def test_remote_clients_are_rejected_even_with_demo_opt_in(self):
        import asyncio
        from starlette.requests import Request
        scope = {"type": "http", "path": "/api/deal-rooms", "headers": [], "query_string": b"", "scheme": "http", "server": ("example.test", 80), "client": ("203.0.113.10", 1000)}
        next_handler = AsyncMock()
        response = asyncio.run(server.require_local_demo_opt_in(Request(scope), next_handler))
        self.assertEqual(response.status_code, 403)
        next_handler.assert_not_called()

    def test_uploaded_bytes_are_hashed_but_not_claimed_indexed(self):
        response = self.upload()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["indexing_status"], "stored")
        self.assertEqual(response.json()["file_hash"], server.compute_file_hash(b"synthetic sample text"))
        stored = self.db.documents.insert_one.call_args.args[0]
        self.assertIsNone(stored["indexed_at"])

    def test_rejects_forged_integrity_hash(self):
        self.assertEqual(self.upload(file_hash="forged").status_code, 422)
        self.db.documents.insert_one.assert_not_called()

    def test_rejects_empty_oversize_public_and_external_uploads(self):
        self.assertEqual(self.upload(b"").status_code, 422)
        self.assertEqual(self.upload(b"x" * (10 * 1024 * 1024 + 1)).status_code, 413)
        self.assertEqual(self.upload(access_level="Public").status_code, 422)
        self.assertEqual(self.upload(download_url="https://example.test/untrusted").status_code, 422)
        self.assertEqual(self.upload(folder="../outside").status_code, 422)
        self.db.documents.insert_one.assert_not_called()

    def test_rejects_unknown_matter(self):
        self.db.deal_rooms.find_one.return_value = None
        self.assertEqual(self.upload().status_code, 404)
        self.assertEqual(self.client.post("/api/chat", json={"deal_room_id": "missing", "message": "Test"}).status_code, 404)

    def test_invalid_matter_name_returns_validation_error(self):
        self.assertEqual(self.client.post("/api/deal-rooms", json={"name": ""}).status_code, 422)
        self.assertEqual(self.client.post("/api/deal-rooms", json={"name": "x" * 251}).status_code, 422)

    def test_offline_chat_is_explicitly_unavailable(self):
        response = self.client.post("/api/chat", json={"message": "What does Delaware law require?"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "unavailable")
        self.assertFalse(response.json()["sources_verified"])
        self.assertIn("No legal answer was generated", response.json()["response"])

    def test_status_validation_and_idempotence(self):
        self.db.compliance_checklists.update_one = AsyncMock(return_value=SimpleNamespace(matched_count=1, modified_count=0))
        self.assertEqual(self.client.put("/api/compliance-checklists/item", data={"status": "invented"}).status_code, 422)
        self.assertEqual(self.client.put("/api/compliance-checklists/item", data={"status": "pending"}).status_code, 200)


if __name__ == "__main__":
    unittest.main()
