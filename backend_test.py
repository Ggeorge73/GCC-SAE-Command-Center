#!/usr/bin/env python3
"""
GCC-SAE Backend API Testing Suite
Tests all backend endpoints for the legal advisory platform
"""

import requests
import json
import os
import sys
from datetime import datetime
import io
from typing import Dict, Any, List, Optional

class GCCSAEAPITester:
    def __init__(self):
        self.base_url = os.environ.get("GCC_SAE_API_URL", "http://127.0.0.1:8001/api")
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
                success = "GCC-SAE API" in data.get("message", "")
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
            test_content = b"This is a test legal document for GCC-SAE testing purposes."
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
                
                if not missing_fields and upload_result.get("indexing_status") == "indexed":
                    self.log_result("Document Upload", True, 
                                    f"Document uploaded and indexed. Hash: {upload_result.get('file_hash', '')[:8]}...")
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
            
    def test_ai_chat_real_gemini(self) -> bool:
        """Test AI chat with real Gemini 2.5 Pro responses (not mocked)"""
        try:
            # Test real AI with specific legal questions that should get real responses
            test_messages = [
                {
                    "message": "What are the key provisions of CAMA 2020 Section 18 regarding minimum share capital?",
                    "expected_in_response": ["Strategic Advisory", "REF:", "CAMA 2020", "Section 18"],
                    "should_not_contain": ["cached advisory response", "AI service temporarily unavailable"]
                },
                {
                    "message": "Explain DGCL Section 141(a) and board authority in Delaware corporations",
                    "expected_in_response": ["Strategic", "REF:", "DGCL", "Section 141"],
                    "should_not_contain": ["cached advisory response", "AI service temporarily unavailable"]
                }
            ]
            
            successful_chats = 0
            real_ai_responses = 0
            
            for i, test_case in enumerate(test_messages):
                chat_data = {
                    "deal_room_id": self.created_deal_room_id,
                    "message": test_case["message"],
                    "jurisdiction": "NIGERIA (CAMA 2020)" if "CAMA" in test_case["message"] else "US (DELAWARE DGCL)"
                }
                
                response = requests.post(f"{self.base_url}/chat", json=chat_data, timeout=30)
                
                if response.status_code == 200:
                    chat_response = response.json()
                    response_text = chat_response.get("response", "")
                    
                    # Check if it's a real AI response (not fallback)
                    is_real_ai = True
                    for fallback_indicator in test_case["should_not_contain"]:
                        if fallback_indicator.lower() in response_text.lower():
                            is_real_ai = False
                            break
                    
                    if is_real_ai:
                        real_ai_responses += 1
                    
                    # Check if response contains expected elements
                    elements_found = sum(1 for element in test_case["expected_in_response"] 
                                        if element in response_text)
                    
                    # Verify response structure
                    has_reference_id = bool(chat_response.get("reference_id"))
                    has_jurisdiction = bool(chat_response.get("jurisdiction"))
                    has_strategic_header = "Strategic" in response_text and "REF:" in response_text
                    
                    if (elements_found >= 2 and has_reference_id and has_jurisdiction and has_strategic_header):
                        successful_chats += 1
                        print(f"   Chat {i+1}: PASS - Elements found: {elements_found}, Real AI: {is_real_ai}, Ref: {chat_response.get('reference_id')}")
                        print(f"      Response preview: {response_text[:100]}...")
                    else:
                        print(f"   Chat {i+1}: FAIL - Elements: {elements_found}, RefID: {has_reference_id}, Jurisdiction: {has_jurisdiction}, Strategic header: {has_strategic_header}")
                        print(f"      Real AI response: {is_real_ai}")
                else:
                    print(f"   Chat {i+1}: FAIL - Status code: {response.status_code}")
            
            success = successful_chats >= 2 and real_ai_responses >= 1
            self.log_result("AI Chat (Real Gemini)", success, 
                           f"{successful_chats}/{len(test_messages)} chats passed, {real_ai_responses} real AI responses")
            return success
            
        except Exception as e:
            self.log_result("AI Chat (Real Gemini)", False, f"Error: {str(e)}")
            return False
            
    def test_multi_turn_conversation(self) -> bool:
        """Test multi-turn conversation context maintenance"""
        try:
            # Test conversation context by asking follow-up questions
            conversation = [
                {
                    "message": "I'm forming a new tech startup in Nigeria. What are the basic CAMA 2020 requirements?",
                    "expected": ["CAMA 2020", "Nigeria", "tech", "startup"]
                },
                {
                    "message": "What about the share capital requirements we just discussed?", 
                    "expected": ["share capital", "NGN", "minimum"]
                },
                {
                    "message": "How does this compare to Delaware incorporation?",
                    "expected": ["Delaware", "compare", "DGCL"]
                }
            ]
            
            successful_turns = 0
            session_responses = []
            
            for i, turn in enumerate(conversation):
                chat_data = {
                    "deal_room_id": self.created_deal_room_id,
                    "message": turn["message"],
                    "jurisdiction": "NIGERIA (CAMA 2020)"
                }
                
                response = requests.post(f"{self.base_url}/chat", json=chat_data, timeout=30)
                
                if response.status_code == 200:
                    chat_response = response.json()
                    response_text = chat_response.get("response", "")
                    session_responses.append(response_text)
                    
                    # Check for expected elements in response
                    elements_found = sum(1 for element in turn["expected"] 
                                        if element.lower() in response_text.lower())
                    
                    # For follow-up questions, check if there's contextual understanding
                    if i > 0 and "just discussed" in turn["message"]:
                        # Should reference previous context
                        has_context = any(prev_keyword in response_text.lower() 
                                         for prev_response in session_responses[:-1]
                                         for prev_keyword in ["capital", "formation", "startup"])
                    else:
                        has_context = True
                    
                    if elements_found >= 1 and has_context:
                        successful_turns += 1
                        print(f"   Turn {i+1}: PASS - Elements: {elements_found}, Context: {has_context}")
                    else:
                        print(f"   Turn {i+1}: FAIL - Elements: {elements_found}, Context: {has_context}")
                else:
                    print(f"   Turn {i+1}: FAIL - Status code: {response.status_code}")
            
            success = successful_turns >= 2
            self.log_result("Multi-turn Conversation", success, f"{successful_turns}/{len(conversation)} turns successful")
            return success
            
        except Exception as e:
            self.log_result("Multi-turn Conversation", False, f"Error: {str(e)}")
            return False
            
    def test_jurisdiction_specific_responses(self) -> bool:
        """Test jurisdiction-specific AI responses"""
        try:
            jurisdiction_tests = [
                {
                    "jurisdiction": "NIGERIA (CAMA 2020)",
                    "message": "What are the key regulatory bodies I need to comply with?",
                    "expected_citations": ["CAMA 2020", "CAC", "SEC Nigeria", "NOTAP"],
                    "expected_sections": ["Section"]
                },
                {
                    "jurisdiction": "US (DELAWARE DGCL)", 
                    "message": "What are the key regulatory requirements for corporations?",
                    "expected_citations": ["DGCL", "Delaware", "SEC", "Rule"],
                    "expected_sections": ["Section"]
                }
            ]
            
            successful_jurisdictions = 0
            
            for test in jurisdiction_tests:
                chat_data = {
                    "deal_room_id": self.created_deal_room_id,
                    "message": test["message"],
                    "jurisdiction": test["jurisdiction"]
                }
                
                response = requests.post(f"{self.base_url}/chat", json=chat_data, timeout=30)
                
                if response.status_code == 200:
                    chat_response = response.json()
                    response_text = chat_response.get("response", "")
                    
                    # Check for jurisdiction-specific citations
                    citations_found = sum(1 for citation in test["expected_citations"] 
                                         if citation in response_text)
                    
                    # Check for legal section references
                    sections_found = sum(1 for section in test["expected_sections"]
                                        if section in response_text)
                    
                    # Verify jurisdiction context matches
                    correct_jurisdiction = chat_response.get("jurisdiction") == test["jurisdiction"]
                    
                    if citations_found >= 2 and sections_found >= 1 and correct_jurisdiction:
                        successful_jurisdictions += 1
                        print(f"   {test['jurisdiction']}: PASS - Citations: {citations_found}, Sections: {sections_found}")
                    else:
                        print(f"   {test['jurisdiction']}: FAIL - Citations: {citations_found}, Sections: {sections_found}, Correct jurisdiction: {correct_jurisdiction}")
                else:
                    print(f"   {test['jurisdiction']}: FAIL - Status code: {response.status_code}")
            
            success = successful_jurisdictions >= 2
            self.log_result("Jurisdiction-Specific Responses", success, f"{successful_jurisdictions}/{len(jurisdiction_tests)} jurisdictions passed")
            return success
            
        except Exception as e:
            self.log_result("Jurisdiction-Specific Responses", False, f"Error: {str(e)}")
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
        print("🔍 Starting GCC-SAE Backend API Tests...")
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
            self.test_ai_chat_real_gemini,
            self.test_multi_turn_conversation,
            self.test_jurisdiction_specific_responses,
            self.test_audit_trail,
            self.test_stats_endpoint
        ]
        
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
    tester = GCCSAEAPITester()
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
