"""Additional isolated synthetic API acceptance tests. Database boundary is mocked."""
import os, sys, unittest, base64
from pathlib import Path
from unittest.mock import MagicMock, AsyncMock, patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ['MONGO_URL']='mongodb://127.0.0.1:27017'
os.environ['DB_NAME']='law_suite_partner_qa'
os.environ['LAW_SUITE_AI_MODE']='offline'
os.environ['LAW_SUITE_ALLOW_LOCAL_DEMO']='true'
from fastapi.testclient import TestClient
from backend import server

class PartnerApiAcceptance(unittest.TestCase):
 def setUp(self):
  self.db=MagicMock()
  for name in ['deal_rooms','compliance_checklists','advisory_logs','documents']:
   collection=getattr(self.db,name)
   collection.find_one=AsyncMock(return_value=None)
   collection.insert_one=AsyncMock()
  self.patcher=patch.object(server,'db',self.db);self.patcher.start()
  self.client=TestClient(server.app)
 def tearDown(self):
  self.client.close();self.patcher.stop()
 def test_A01_whitespace_matter_name_rejected(self):
  response=self.client.post('/api/deal-rooms',json={'name':'   '})
  self.assertEqual(response.status_code,422,response.text)
 def test_A02_invalid_initial_checklist_status_rejected(self):
  self.db.deal_rooms.find_one.return_value={'id':'sample'}
  response=self.client.post('/api/compliance-checklists',json={'deal_room_id':'sample','name':'Synthetic control','status':'invented'})
  self.assertEqual(response.status_code,422,response.text)
 def test_A03_orphan_checklist_rejected(self):
  response=self.client.post('/api/compliance-checklists',json={'deal_room_id':'missing','name':'Synthetic orphan'})
  self.assertEqual(response.status_code,404,response.text)
 def test_A04_orphan_advisory_rejected(self):
  response=self.client.post('/api/advisory-logs',json={'deal_room_id':'missing','type':'user_query','content':'Synthetic orphan'})
  self.assertEqual(response.status_code,404,response.text)
 def test_A05_roundtrip_synthetic_binary_bytes_preserved(self):
  self.db.deal_rooms.find_one.return_value={'id':'sample'}
  content=b'%PDF-1.4\nQA synthetic only\x00\xff'
  uploaded=self.client.post('/api/documents/upload',files={'file':('qa.pdf',content,'application/pdf')},data={'deal_room_id':'sample'})
  self.assertEqual(uploaded.status_code,200)
  self.db.documents.find_one.return_value=self.db.documents.insert_one.call_args.args[0]
  downloaded=self.client.get('/api/documents/download/'+uploaded.json()['id'])
  self.assertEqual(downloaded.status_code,200)
  self.assertEqual(base64.b64decode(downloaded.json()['content']),content)
 def test_A06_limit_ten_mebibytes_is_accepted(self):
  self.db.deal_rooms.find_one.return_value={'id':'sample'}
  content=b'x'*(10*1024*1024)
  response=self.client.post('/api/documents/upload',files={'file':('qa.txt',content,'text/plain')},data={'deal_room_id':'sample'})
  self.assertEqual(response.status_code,200)
  self.assertEqual(self.db.documents.insert_one.call_args.args[0]['file_size'],len(content))
 def test_A07_unknown_download_returns_404(self):
  self.assertEqual(self.client.get('/api/documents/download/missing').status_code,404)
 def test_A08_create_jurisdiction_checklists_is_atomic_on_failure(self):
  persisted=[]
  async def insert_matter(doc):persisted.append(doc)
  self.db.deal_rooms.insert_one.side_effect=insert_matter
  self.db.compliance_checklists.insert_one.side_effect=RuntimeError('Synthetic persistence failure')
  client=TestClient(server.app,raise_server_exceptions=False)
  response=client.post('/api/deal-rooms',json={'name':'Synthetic interrupted creation'})
  self.assertEqual(response.status_code,500)
  self.assertEqual(persisted,[],'Matter remains inserted after checklist failure; no transaction or rollback is implemented')
  client.close()

if __name__=='__main__':unittest.main(verbosity=2)
