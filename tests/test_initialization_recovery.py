"""Crash/retry semantics using a deterministic in-memory Mongo boundary."""
import unittest
from unittest.mock import patch
from types import SimpleNamespace
from pymongo.errors import DuplicateKeyError
from backend import server

class Collection:
    def __init__(self, fail_at=None):
        self.rows = {}
        self.calls = 0
        self.fail_at = fail_at
    async def find_one(self, query, projection=None):
        return next((row for row in self.rows.values() if all(row.get(k) == v for k, v in query.items())), None)
    async def insert_one(self, row):
        self.calls += 1
        if self.calls == self.fail_at:
            raise RuntimeError("injected interruption")
        if row['_id'] in self.rows:
            raise DuplicateKeyError("duplicate")
        self.rows[row['_id']] = dict(row)

class InitializationRecovery(unittest.IsolatedAsyncioTestCase):
    async def test_every_failure_point_is_retryable_without_publishing_partial_matter(self):
        for fail_at in [1, 2, 3, 4]:
            db = SimpleNamespace(deal_rooms=Collection(1 if fail_at == 4 else None), compliance_checklists=Collection(fail_at if fail_at < 4 else None))
            request = server.DealRoomCreate(name="Synthetic recovery")
            with patch.object(server, "db", db):
                with self.assertRaises(RuntimeError):
                    await server.initialize_matter(request, "same-request-key")
                self.assertEqual(len(db.deal_rooms.rows), 0)
                db.deal_rooms.fail_at = db.compliance_checklists.fail_at = None
                result = await server.initialize_matter(request, "same-request-key")
                again = await server.initialize_matter(request, "same-request-key")
                self.assertEqual(result.id, again.id)
                self.assertEqual(len(db.deal_rooms.rows), 1)
                self.assertEqual(len(db.compliance_checklists.rows), 3)
                with self.assertRaises(server.HTTPException) as failure:
                    await server.initialize_matter(server.DealRoomCreate(name="Different"), "same-request-key")
                self.assertEqual(failure.exception.status_code, 409)
