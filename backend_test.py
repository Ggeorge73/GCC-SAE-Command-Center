#!/usr/bin/env python3
"""
Law Suite Backend API Testing Suite
Tests all backend endpoints for the legal advisory platform
"""

import requests
import json
import os
import sys
from datetime import datetime
import io
from typing import Dict, Any, List, Optional

class LawSuiteAPITester:
    def __init__(self):
        self.base_url = os.environ.get("LAW_SUITE_API_URL", "http://127.0.0.1:8001/api")
        self.run_live_ai_tests = os.environ.get("RUN_LIVE_AI_TESTS", "false").lower() in {"1", "true", "yes"}
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_deal_room_id = None
        self.created_document_id = None
        
    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test": test_name,
            "status": "PASS" if success else "FAIL", 
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status_icon = "✅" if success else "❌"
        print(f"{status_icon} {test_name}: {'PASS' if success else 'FAIL'}")
        if details and not success:
            print(f"   Details: {details}")
            
    def test_api_health(self) -> bool:
        """Test API health check endpoint"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                success = "Law Suite API" in data.get("message", "")
                self.log_result("API Health Check", success, f"Response: {data}")
                return success
            else:
                self.log_result("API Health Check", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("API Health Check", False, f"Error: {str(e)}")
            return False
            
    def test_create_deal_room(self) -> bool:
        """Test creating a new deal room"""
        try:
            test_data = {
                "name": f"Test Deal Room {datetime.now().strftime('%H%M%S')}",
                "jurisdiction": "NIGERIA (CAMA 2020)",
                "total_raise": "5M USD",
                "primary_counsel": "Test Counsel"
            }
            
            response = requests.post(
                f"{self.base_url}/deal-rooms",
                json=test_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.created_deal_room_id = data.get("id")
                
                # Verify all fields are present
                required_fields = ["id", "name", "jurisdiction", "status", "created_at"]
                missing_fields = [f for f in required_fields if f not in data]
                
                if not missing_fields and self.created_deal_room_id:
                    self.log_result("Create Deal Room", True, f"Created deal room ID: {self.created_deal_room_id}")
                    return True
                else:
                    self.log_result("Create Deal Room", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_result("Create Deal Room", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Create Deal Room", False, f"Error: {str(e)}")
            return False
            
    def test_get_deal_rooms(self) -> bool:
        """Test retrieving all deal rooms"""
        try:
            response = requests.get(f"{self.base_url}/deal-rooms", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if our created deal room is in the list
                    found_our_room = False
                    if self.created_deal_room_id:
                        found_our_room = any(room.get("id") == self.created_deal_room_id for room in data)
                    
                    self.log_result("Get Deal Rooms", True, f"Retrieved {len(data)} deal rooms, Found our room: {found_our_room}")
                    return True
                else:
                    self.log_result("Get Deal Rooms", False, "Response is not a list")
                    return False
            else:
                self.log_result("Get Deal Rooms", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Deal Rooms", False, f"Error: {str(e)}")
            return False
            
    def test_compliance_checklists_auto_creation(self) -> bool:
        """Test that compliance checklists are auto-created for Nigeria deals"""
        if not self.created_deal_room_id:
            self.log_result("Compliance Auto-Creation", False, "No deal room to test with")
            return False
            
        try:
            response = requests.get(f"{self.base_url}/compliance-checklists/{self.created_deal_room_id}", timeout=10)
            
            if response.status_code == 200:
                checklists = response.json()
                if isinstance(checklists, list) and len(checklists) >= 3:
                    # Check for expected Nigeria compliance items
                    expected_items = ["CAMA 2020", "NOTAP", "SEC Nigeria"]
                    found_items = []
                    
                    for checklist in checklists:
                        for expected in expected_items:
                            if expected in checklist.get("name", ""):
                                found_items.append(expected)
                                
                    success = len(found_items) >= 2  # At least 2 out of 3 expected items
                    self.log_result("Compliance Auto-Creation", success, 
                                    f"Found {len(checklists)} checklists, Expected items found: {found_items}")
                    return success
                else:
                    self.log_result("Compliance Auto-Creation", False, f"Expected at least 3 checklists, got {len(checklists) if isinstance(checklists, list) else 0}")
                    return False
            else:
                self.log_result("Compliance Auto-Creation", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Compliance Auto-Creation", False, f"Error: {str(e)}")
            return False
            
    def test_document_upload(self) -> bool:
        """Test document upload functionality"""
        if not self.created_deal_room_id:
            self.log_result("Document Upload", False, "No deal room to test with")
            return False
            
        try:
            # Create a test file
            test_content = b"This is a test legal document for Law Suite testing purposes."
            test_file = io.BytesIO(test_content)
            test_file.name = "test_legal_document.txt"
            
            files = {
                'file': ('test_legal_document.txt', test_file, 'text/plain')
            }
            
            data = {
                'deal_room_id': self.created_deal_room_id,
                'folder': 'Legal_Drafts',
                'access_level': 'Team'
            }
            
            response = requests.post(
                f"{self.base_url}/documents/upload",
                files=files,
                data=data,
                timeout=10
            )
            
            if response.status_code == 200:
                upload_result = response.json()
                self.created_document_id = upload_result.get("id")
                
                # Verify upload result contains expected fields
                expected_fields = ["id", "file_name", "file_hash", "storage_path", "indexing_status"]
                missing_fields = [f for f in expected_fields if f not in upload_result]
                
                if not missing_fields and upload_result.get("indexing_status") == "stored":
                    self.log_result("Document Upload", True, 
                                    f"Document stored without claiming analysis. Hash: {upload_result.get('file_hash', '')[:8]}...")
                    return True
                else:
                    self.log_result("Document Upload", False, 
                                    f"Missing fields: {missing_fields}, Indexing status: {upload_result.get('indexing_status')}")
                    return False
            else:
                self.log_result("Document Upload", False, f"Status code: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Document Upload", False, f"Error: {str(e)}")
            return False
            
    def test_get_documents(self) -> bool:
        """Test retrieving documents for a deal room"""
        if not self.created_deal_room_id:
            self.log_result("Get Documents", False, "No deal room to test with")
            return False
            
        try:
            response = requests.get(f"{self.base_url}/documents/{self.created_deal_room_id}", timeout=10)
            
            if response.status_code == 200:
                documents = response.json()
                if isinstance(documents, list):
                    # Check if our uploaded document is in the list
                    found_our_doc = False
                    if self.created_document_id:
                        found_our_doc = any(doc.get("id") == self.created_document_id for doc in documents)
                    
                    self.log_result("Get Documents", True, 
                                    f"Retrieved {len(documents)} documents, Found our document: {found_our_doc}")
                    return True
                else:
                    self.log_result("Get Documents", False, "Response is not a list")
                    return False
            else:
                self.log_result("Get Documents", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Documents", False, f"Error: {str(e)}")
            return False

    def test_ai_fallback_contract(self) -> bool:
        """Offline HTTP responses must be service notices, never substituted legal opinions."""
        response = requests.post(f"{self.base_url}/chat", json={"deal_room_id": self.created_deal_room_id, "message": "Synthetic research question", "jurisdiction": "US (DELAWARE DGCL)"}, timeout=10)
        body = response.json()
        success = response.status_code == 200 and body.get("status") == "unavailable" and body.get("sources_verified") is False and "No legal answer was generated" in body.get("response", "")
        self.log_result("AI Unavailable Contract", success, "HTTP contract is explicit; no canned legal opinion")
        return success

    def test_ai_chat_real_gemini(self) -> bool:
        """Provider contract smoke test only; does not evaluate legal correctness."""
        try:
            response = requests.post(f"{self.base_url}/chat", json={
                "deal_room_id": self.created_deal_room_id,
                "message": "For a fictional Delaware acquisition, list the facts and source checks needed before researching a consent issue. Do not provide a legal conclusion.",
                "jurisdiction": "US (DELAWARE DGCL)",
            }, timeout=60)
            body = response.json()
            success = response.status_code == 200 and body.get("status") == "unverified_draft" and body.get("sources_verified") is False and bool(body.get("reference_id")) and "UNVERIFIED RESEARCH DRAFT" in body.get("response", "")
            self.log_result("Live provider draft contract", success, "Provider availability and draft labeling only; no accuracy claim")
            return success
        except Exception as error:
            self.log_result("Live provider draft contract", False, type(error).__name__)
            return False

    def test_audit_trail(self) -> bool:
        """Test audit trail endpoint"""
        if not self.created_deal_room_id:
            self.log_result("Audit Trail", False, "No deal room to test with")
            return False
            
        try:
            response = requests.get(f"{self.base_url}/audit-trail/{self.created_deal_room_id}", timeout=10)
            
            if response.status_code == 200:
                audit_data = response.json()
                
                # Check for expected structure
                expected_keys = ["advisory_logs", "document_uploads", "compliance_updates"]
                missing_keys = [k for k in expected_keys if k not in audit_data]
                
                if not missing_keys:
                    # Count total events
                    total_events = (
                        len(audit_data.get("advisory_logs", [])) +
                        len(audit_data.get("document_uploads", [])) +
                        len(audit_data.get("compliance_updates", []))
                    )
                    
                    self.log_result("Audit Trail", True, f"Audit trail retrieved with {total_events} total events")
                    return True
                else:
                    self.log_result("Audit Trail", False, f"Missing keys in audit data: {missing_keys}")
                    return False
            else:
                self.log_result("Audit Trail", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Audit Trail", False, f"Error: {str(e)}")
            return False
            
    def test_stats_endpoint(self) -> bool:
        """Test system statistics endpoint"""
        try:
            response = requests.get(f"{self.base_url}/stats", timeout=10)
            
            if response.status_code == 200:
                stats = response.json()
                
                # Check for expected statistics
                expected_stats = ["deal_rooms", "documents", "advisory_logs", "compliance"]
                missing_stats = [s for s in expected_stats if s not in stats]
                
                if not missing_stats:
                    # Check compliance sub-stats
                    compliance_stats = stats.get("compliance", {})
                    compliance_keys = ["compliant", "pending", "overdue"]
                    missing_compliance = [k for k in compliance_keys if k not in compliance_stats]
                    
                    if not missing_compliance:
                        self.log_result("Stats Endpoint", True, f"Stats retrieved: {stats}")
                        return True
                    else:
                        self.log_result("Stats Endpoint", False, f"Missing compliance stats: {missing_compliance}")
                        return False
                else:
                    self.log_result("Stats Endpoint", False, f"Missing stats: {missing_stats}")
                    return False
            else:
                self.log_result("Stats Endpoint", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Stats Endpoint", False, f"Error: {str(e)}")
            return False

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete created document
        if self.created_document_id:
            try:
                response = requests.delete(f"{self.base_url}/documents/{self.created_document_id}", timeout=10)
                if response.status_code == 200:
                    print(f"✅ Deleted test document: {self.created_document_id}")
                else:
                    print(f"⚠️ Failed to delete document: {response.status_code}")
            except Exception as e:
                print(f"⚠️ Error deleting document: {e}")
        
        # Delete created deal room (this will cascade delete related data)
        if self.created_deal_room_id:
            try:
                response = requests.delete(f"{self.base_url}/deal-rooms/{self.created_deal_room_id}", timeout=10)
                if response.status_code == 200:
                    print(f"✅ Deleted test deal room: {self.created_deal_room_id}")
                else:
                    print(f"⚠️ Failed to delete deal room: {response.status_code}")
            except Exception as e:
                print(f"⚠️ Error deleting deal room: {e}")

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🔍 Starting Law Suite Backend API Tests...")
        print(f"🌐 Testing API at: {self.base_url}")
        print("=" * 60)
        
        # Run tests in logical order
        test_sequence = [
            self.test_api_health,
            self.test_create_deal_room,
            self.test_get_deal_rooms,
            self.test_compliance_checklists_auto_creation,
            self.test_document_upload,
            self.test_get_documents,
        ]

        if self.run_live_ai_tests:
            test_sequence.extend([
                self.test_ai_chat_real_gemini,
            ])
        else:
            test_sequence.append(self.test_ai_fallback_contract)

        test_sequence.extend([
            self.test_audit_trail,
            self.test_stats_endpoint,
        ])
        
        for test_func in test_sequence:
            try:
                test_func()
            except Exception as e:
                print(f"❌ CRITICAL ERROR in {test_func.__name__}: {e}")
                self.tests_run += 1
                self.test_results.append({
                    "test": test_func.__name__,
                    "status": "ERROR",
                    "details": str(e),
                    "timestamp": datetime.now().isoformat()
                })
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print results summary
        print("\n" + "=" * 60)
        print(f"📊 TEST RESULTS SUMMARY")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "N/A")
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if r["status"] != "PASS"]
        if failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        return self.tests_passed, self.tests_run, self.test_results

def main():
    """Main function to run backend tests"""
    tester = LawSuiteAPITester()
    passed, total, results = tester.run_all_tests()
    
    # Return appropriate exit code
    if passed == total and total > 0:
        print("\n🎉 All backend tests passed!")
        return 0
    else:
        print(f"\n⚠️ {total - passed} backend tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
