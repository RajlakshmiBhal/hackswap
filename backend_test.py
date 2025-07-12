#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import uuid

class SkillSwapAPITester:
    def __init__(self, base_url="https://3e8bce30-1a22-410b-b814-61e44190e214.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_users = []
        self.test_requests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            details = f"(Status: {response.status_code})"
            
            if not success:
                details += f" Expected: {expected_status}"
                if response.text:
                    details += f" Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success and response.text:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            return success, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_user_endpoints(self):
        """Test all user-related endpoints"""
        print("\n🔍 Testing User Endpoints...")
        
        # Test 1: Create first user
        user1_data = {
            "name": "Alice Johnson",
            "email": f"alice_{datetime.now().strftime('%H%M%S')}@test.com",
            "location": "New York, NY",
            "profile_photo": "https://example.com/alice.jpg"
        }
        
        success, response = self.run_test(
            "Create User 1",
            "POST",
            "users",
            200,
            data=user1_data
        )
        
        if success:
            self.test_users.append(response)
            user1_id = response['id']
        else:
            return False

        # Test 2: Create second user
        user2_data = {
            "name": "Bob Smith",
            "email": f"bob_{datetime.now().strftime('%H%M%S')}@test.com",
            "location": "San Francisco, CA"
        }
        
        success, response = self.run_test(
            "Create User 2",
            "POST",
            "users",
            200,
            data=user2_data
        )
        
        if success:
            self.test_users.append(response)
            user2_id = response['id']
        else:
            return False

        # Test 3: Try to create user with duplicate email
        success, _ = self.run_test(
            "Create User with Duplicate Email",
            "POST",
            "users",
            400,
            data=user1_data
        )

        # Test 4: Get all users
        success, response = self.run_test(
            "Get All Users",
            "GET",
            "users",
            200
        )
        
        if success and len(response) >= 2:
            self.log_test("Users List Contains Created Users", True, f"Found {len(response)} users")
        else:
            self.log_test("Users List Contains Created Users", False, f"Expected >= 2 users, got {len(response) if success else 0}")

        # Test 5: Get specific user
        success, response = self.run_test(
            "Get User by ID",
            "GET",
            f"users/{user1_id}",
            200
        )
        
        if success and response.get('name') == user1_data['name']:
            self.log_test("User Data Matches", True)
        else:
            self.log_test("User Data Matches", False)

        # Test 6: Update user profile
        update_data = {
            "skills_offered": ["Python", "JavaScript", "React"],
            "skills_wanted": ["Machine Learning", "Data Science"],
            "availability": "Weekends",
            "is_public": True
        }
        
        success, response = self.run_test(
            "Update User Profile",
            "PUT",
            f"users/{user1_id}",
            200,
            data=update_data
        )
        
        if success and response.get('skills_offered') == update_data['skills_offered']:
            self.log_test("User Update Successful", True)
        else:
            self.log_test("User Update Successful", False)

        # Test 7: Search users by skill
        success, response = self.run_test(
            "Search Users by Skill",
            "GET",
            "users",
            200,
            params={"skill": "Python"}
        )
        
        if success and len(response) >= 1:
            self.log_test("Skill Search Works", True, f"Found {len(response)} users with Python")
        else:
            self.log_test("Skill Search Works", False)

        # Test 8: Search users by location
        success, response = self.run_test(
            "Search Users by Location",
            "GET",
            "users",
            200,
            params={"location": "New York"}
        )
        
        if success and len(response) >= 1:
            self.log_test("Location Search Works", True, f"Found {len(response)} users in New York")
        else:
            self.log_test("Location Search Works", False)

        # Test 9: Get non-existent user
        fake_id = str(uuid.uuid4())
        success, _ = self.run_test(
            "Get Non-existent User",
            "GET",
            f"users/{fake_id}",
            404
        )

        return True

    def test_swap_request_endpoints(self):
        """Test swap request functionality"""
        print("\n🔍 Testing Swap Request Endpoints...")
        
        if len(self.test_users) < 2:
            self.log_test("Swap Request Tests", False, "Need at least 2 users")
            return False

        user1 = self.test_users[0]
        user2 = self.test_users[1]

        # Test 1: Create swap request
        request_data = {
            "receiver_id": user2['id'],
            "requester_skill": "Python",
            "receiver_skill": "Design",
            "message": "Hi! I'd like to learn design from you."
        }
        
        success, response = self.run_test(
            "Create Swap Request",
            "POST",
            f"swap-requests?requester_id={user1['id']}",
            200,
            data=request_data
        )
        
        if success:
            self.test_requests.append(response)
            request_id = response['id']
        else:
            return False

        # Test 2: Get all swap requests
        success, response = self.run_test(
            "Get All Swap Requests",
            "GET",
            "swap-requests",
            200
        )
        
        if success and len(response) >= 1:
            self.log_test("Swap Requests List", True, f"Found {len(response)} requests")
        else:
            self.log_test("Swap Requests List", False)

        # Test 3: Get swap requests for specific user
        success, response = self.run_test(
            "Get User's Swap Requests",
            "GET",
            "swap-requests",
            200,
            params={"user_id": user1['id']}
        )
        
        if success and len(response) >= 1:
            self.log_test("User-specific Requests", True, f"Found {len(response)} requests for user")
        else:
            self.log_test("User-specific Requests", False)

        # Test 4: Update swap request status
        success, response = self.run_test(
            "Accept Swap Request",
            "PUT",
            f"swap-requests/{request_id}",
            200,
            data={"status": "accepted"}
        )
        
        if success and response.get('status') == 'accepted':
            self.log_test("Request Status Update", True)
        else:
            self.log_test("Request Status Update", False)

        # Test 5: Try to create request to self
        success, _ = self.run_test(
            "Create Request to Self",
            "POST",
            f"swap-requests?requester_id={user1['id']}",
            400,
            data={
                "receiver_id": user1['id'],
                "requester_skill": "Python",
                "receiver_skill": "JavaScript"
            }
        )

        # Test 6: Create another request for deletion test
        request_data2 = {
            "receiver_id": user2['id'],
            "requester_skill": "JavaScript",
            "receiver_skill": "CSS",
            "message": "Another test request"
        }
        
        success, response = self.run_test(
            "Create Request for Deletion",
            "POST",
            f"swap-requests?requester_id={user1['id']}",
            200,
            data=request_data2
        )
        
        if success:
            delete_request_id = response['id']
            
            # Test 7: Delete swap request
            success, _ = self.run_test(
                "Delete Swap Request",
                "DELETE",
                f"swap-requests/{delete_request_id}",
                200
            )

        return True

    def test_dashboard_endpoint(self):
        """Test dashboard functionality"""
        print("\n🔍 Testing Dashboard Endpoint...")
        
        if not self.test_users:
            self.log_test("Dashboard Test", False, "No test users available")
            return False

        user1 = self.test_users[0]
        
        success, response = self.run_test(
            "Get User Dashboard",
            "GET",
            f"dashboard/{user1['id']}",
            200
        )
        
        if success:
            required_keys = ['user', 'sent_requests', 'received_requests', 'ratings_given', 'ratings_received']
            has_all_keys = all(key in response for key in required_keys)
            
            if has_all_keys:
                self.log_test("Dashboard Structure", True, "All required keys present")
                
                # Check if user data matches
                if response['user']['id'] == user1['id']:
                    self.log_test("Dashboard User Data", True)
                else:
                    self.log_test("Dashboard User Data", False)
                    
            else:
                missing_keys = [key for key in required_keys if key not in response]
                self.log_test("Dashboard Structure", False, f"Missing keys: {missing_keys}")

        return success

    def test_search_endpoints(self):
        """Test search functionality"""
        print("\n🔍 Testing Search Endpoints...")
        
        # Test skills search
        success, response = self.run_test(
            "Search Skills",
            "GET",
            "search/skills",
            200,
            params={"query": "Python"}
        )
        
        if success and 'skills' in response:
            self.log_test("Skills Search Structure", True, f"Found {len(response['skills'])} matching skills")
        else:
            self.log_test("Skills Search Structure", False)

        return success

    def test_rating_endpoints(self):
        """Test rating functionality"""
        print("\n🔍 Testing Rating Endpoints...")
        
        if len(self.test_users) < 2 or not self.test_requests:
            self.log_test("Rating Tests", False, "Need users and completed swap request")
            return False

        # First, update a request to completed status
        request = self.test_requests[0]
        success, _ = self.run_test(
            "Mark Request as Completed",
            "PUT",
            f"swap-requests/{request['id']}",
            200,
            data={"status": "completed"}
        )
        
        if not success:
            return False

        # Test creating a rating
        rating_data = {
            "swap_request_id": request['id'],
            "rated_user_id": self.test_users[1]['id'],
            "rating": 5,
            "feedback": "Great experience learning from them!"
        }
        
        success, response = self.run_test(
            "Create Rating",
            "POST",
            f"ratings?rater_id={self.test_users[0]['id']}",
            200,
            data=rating_data
        )
        
        if success and response.get('rating') == 5:
            self.log_test("Rating Creation", True)
        else:
            self.log_test("Rating Creation", False)

        # Test duplicate rating (should fail)
        success, _ = self.run_test(
            "Create Duplicate Rating",
            "POST",
            f"ratings?rater_id={self.test_users[0]['id']}",
            400,
            data=rating_data
        )

        return True

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Skill Swap Platform API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Run test suites
        self.test_user_endpoints()
        self.test_swap_request_endpoints()
        self.test_dashboard_endpoint()
        self.test_search_endpoints()
        self.test_rating_endpoints()
        
        # Print final results
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = SkillSwapAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())