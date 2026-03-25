"""Test Phase 4 Week 13 Authentication & RBAC endpoints."""

import time
import requests
import json

time.sleep(3)

BASE_URL = "http://localhost:8000"

print("Testing Phase 4 Week 13 - Authentication & RBAC:\n")
print("=" * 60)

# Test 1: Register new user
print("\n1. Testing User Registration:")
register_payload = {
    "username": "testuser",
    "email": "testuser@ontora.local",
    "password": "Test@123",
    "clearance_level": "FOUO"
}

r = requests.post(f"{BASE_URL}/auth/register", json=register_payload)
if r.status_code == 200:
    data = r.json()
    token = data.get('data', {}).get('access_token')
    print(f"  ✓ Registration successful")
    print(f"  ✓ Access token received: {token[:20]}...")
else:
    print(f"  ✗ Registration failed: {r.status_code}")
    print(f"  Response: {r.text[:200]}")

# Test 2: Login with admin user
print("\n2. Testing Admin Login:")
login_payload = {
    "username": "admin",
    "password": "Admin@123"
}

r = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
if r.status_code == 200:
    data = r.json()
    admin_token = data.get('data', {}).get('access_token')
    print(f"  ✓ Login successful")
    print(f"  ✓ Admin token: {admin_token[:20]}...")
else:
    print(f"  ✗ Login failed: {r.status_code}")
    print(f"  Response: {r.text[:200]}")

# Test 3: Get current user info
print("\n3. Testing Get Current User Info:")
if admin_token:
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    if r.status_code == 200:
        data = r.json()
        user = data.get('data', {})
        print(f"  ✓ Current user retrieved: {user.get('username')}")
        print(f"  ✓ Roles: {user.get('roles')}")
        print(f"  ✓ Clearance: {user.get('clearance')}")
    else:
        print(f"  ✗ Failed: {r.status_code}")

# Test 4: Get user permissions
print("\n4. Testing Get User Permissions:")
if admin_token:
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = requests.get(f"{BASE_URL}/auth/permissions", headers=headers)
    if r.status_code == 200:
        data = r.json()
        user = data.get('data', {})
        resources = user.get('accessible_resources', [])
        print(f"  ✓ Permissions retrieved")
        print(f"  ✓ Accessible resources: {len(resources)}")
        if resources:
            print(f"    Resources: {', '.join(resources[:5])}")
    else:
        print(f"  ✗ Failed: {r.status_code}")

# Test 5: List all users (admin only)
print("\n5. Testing List Users (Admin Only):")
if admin_token:
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = requests.get(f"{BASE_URL}/users", headers=headers)
    if r.status_code == 200:
        data = r.json()
        users = data.get('data', {}).get('users', [])
        print(f"  ✓ Users retrieved: {len(users)} total")
        for u in users[:3]:
            print(f"    - {u.get('username')} ({u.get('clearance_level')})")
    else:
        print(f"  ✗ Failed: {r.status_code}")

# Test 6: Health check
print("\n6. Testing Health Check:")
r = requests.get(f"{BASE_URL}/health")
if r.status_code == 200:
    print(f"  ✓ Health check passed")
else:
    print(f"  ✗ Health check failed")

print("\n" + "=" * 60)
print("✅ Phase 4 Week 13 testing complete!")
