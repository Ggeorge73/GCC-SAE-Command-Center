"""Opt-in disposable-Mongo verification. Runs in CI, never on a customer database."""
import os
import unittest
import uuid
from types import SimpleNamespace
from unittest.mock import patch
from motor.motor_asyncio import AsyncIOMotorClient
from backend import server

class InterruptingCollection:
    def __init__(self, collection, stop):
        self.collection, self.stop, self.calls = collection, stop, 0
    async def insert_one(self, doc):
        self.calls += 1
        if self.calls == self.stop:
            raise RuntimeError("synthetic interrupted write")
        return await self.collection.insert_one(doc)
    def __getattr__(self, key):
        return getattr(self.collection, key)

@unittest.skipUnless(os.environ.get("RUN_MONGO_RECOVERY_TESTS") == "true", "requires disposable CI MongoDB")
class MongoRecoveryTests(unittest.IsolatedAsyncioTestCase):
    async def test_interrupted_initialization_and_idempotent_retry_on_real_mongo(self):
        name = os.environ.get("DB_NAME", "")
        self.assertTrue(name.startswith("law_suite_ci_"), "Only a disposable CI database may be used")
        client = AsyncIOMotorClient(os.environ['MONGO_URL'], serverSelectionTimeoutMS=5000)
        db = client[name]
        try:
            for stop in range(1, 5):
                key = "recovery-test-" + str(uuid.uuid4())
                matter_id = str(uuid.uuid5(uuid.NAMESPACE_URL, "law-suite:" + key))
                fake = SimpleNamespace(deal_rooms=InterruptingCollection(db.deal_rooms, 1 if stop == 4 else None), compliance_checklists=InterruptingCollection(db.compliance_checklists, stop if stop < 4 else None))
                request = server.DealRoomCreate(name="Synthetic interrupted Mongo initialization")
                try:
                    with patch.object(server, 'db', fake):
                        with self.assertRaises(RuntimeError):
                            await server.initialize_matter(request, key)
                    self.assertEqual(await db.deal_rooms.count_documents({'id': matter_id}), 0)
                    with patch.object(server, 'db', db):
                        first = await server.initialize_matter(request, key)
                        second = await server.initialize_matter(request, key)
                    self.assertEqual(first.id, second.id)
                    self.assertEqual(await db.deal_rooms.count_documents({'id': matter_id}), 1)
                    self.assertEqual(await db.compliance_checklists.count_documents({'deal_room_id': matter_id}), 3)
                finally:
                    await db.deal_rooms.delete_many({'id': matter_id})
                    await db.compliance_checklists.delete_many({'deal_room_id': matter_id})
        finally:
            client.close()
