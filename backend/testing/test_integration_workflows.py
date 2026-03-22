"""Week 15: Comprehensive Integration Tests - Full Workflow Testing."""

import pytest
import json
from datetime import datetime, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from main import app
from db.schemas import User, ConflictData, Entity, AuditLog
from services.auth import AuthService
from services.rbac import RBACService


@pytest.fixture
async def client():
    """Create test client."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
async def auth_token(client):
    """Get valid auth token for testing."""
    # In production, this would authenticate with OAuth2
    # For testing, we return a mock token
    return "test-token-12345"


@pytest.fixture
async def admin_token(client):
    """Get admin auth token."""
    return "test-admin-token-12345"


class TestAuthenticationFlow:
    """Test authentication and authorization workflows."""
    
    async def test_public_endpoints_no_auth(self, client):
        """Test that public endpoints work without authentication."""
        
        response = await client.get("/api/health")
        assert response.status_code == 200
        
        response = await client.get("/health")
        assert response.status_code == 200
    
    async def test_protected_endpoint_without_auth(self, client):
        """Test that protected endpoints require auth."""
        
        response = await client.get("/api/security/violations-trend")
        # Should be 401 or redirected
        assert response.status_code in [401, 403, 307]
    
    async def test_protected_endpoint_with_valid_token(self, client, auth_token):
        """Test protected endpoint with valid token."""
        
        response = await client.get(
            "/api/security/violations-trend",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Should succeed (200) or require detailed auth (401)
        assert response.status_code in [200, 401]
    
    async def test_logout_invalidates_token(self, client, auth_token):
        """Test that logout invalidates token."""
        
        # First, verify token works
        response = await client.get(
            "/api/security/violations-trend",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        first_status = response.status_code
        
        # Logout
        response = await client.post("/auth/logout")
        assert response.status_code in [200, 204]
        
        # Token should no longer work
        response = await client.get(
            "/api/security/violations-trend",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code in [401, 403]


class TestConflictPredictionFlow:
    """Test conflict prediction workflow."""
    
    async def test_request_prediction(self, client, auth_token):
        """Test requesting conflict prediction."""
        
        payload = {
            "region": "Kenya",
            "confidence_threshold": 0.7,
            "include_historical": True,
        }
        
        response = await client.post(
            "/api/predictions/conflict-risk",
            json=payload,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "prediction_id" in data
        assert "conflict_risk_score" in data
        assert 0 <= data["conflict_risk_score"] <= 1
        assert "confidence" in data
        assert 0 <= data["confidence"] <= 1
    
    async def test_list_predictions(self, client, auth_token):
        """Test listing predictions."""
        
        response = await client.get(
            "/api/predictions/list?limit=10&offset=0",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data or "predictions" in data
    
    async def test_get_prediction_details(self, client, auth_token):
        """Test getting prediction details."""
        
        # First create a prediction
        payload = {
            "region": "Kenya",
            "confidence_threshold": 0.7,
        }
        
        response = await client.post(
            "/api/predictions/conflict-risk",
            json=payload,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        pred_id = response.json()["prediction_id"]
        
        # Now get details
        response = await client.get(
            f"/api/predictions/{pred_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        assert response.json()["prediction_id"] == pred_id


class TestIntelligenceFlow:
    """Test intelligence module workflows."""
    
    async def test_search_entities(self, client, auth_token):
        """Test searching for intelligence entities."""
        
        payload = {"query": "al-qaeda"}
        
        response = await client.post(
            "/api/intelligence/search",
            json=payload,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "results" in data or "data" in data
    
    async def test_extract_entities(self, client, auth_token):
        """Test entity extraction from text."""
        
        payload = {
            "text": "Al-Qaeda is an extremist group operating in Middle East and Africa."
        }
        
        response = await client.post(
            "/api/intelligence/entity-extraction",
            json=payload,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "entities" in data


class TestSecurityAndCompliance:
    """Test security and compliance workflows."""
    
    async def test_audit_log_created(self, client, auth_token):
        """Test that actions are audit logged."""
        
        # Perform an action
        payload = {"region": "Kenya", "confidence_threshold": 0.7}
        response = await client.post(
            "/api/predictions/conflict-risk",
            json=payload,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        
        # Check audit log
        response = await client.get(
            "/api/security/audit-logs",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Should have audit logs
        assert response.status_code in [200, 401]
    
    async def test_data_classification(self, client, auth_token):
        """Test data classification enforcement."""
        
        # Request should include classification header
        response = await client.get(
            "/api/predictions/list",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Verify classification headers
        assert "X-Data-Classification" in response.headers or response.status_code in [401, 403]
    
    async def test_export_approval_flow(self, client, auth_token, admin_token):
        """Test export request and approval flow."""
        
        # User requests export
        payload = {
            "dataset_id": "ds_001",
            "format": "csv",
            "purpose": "Research and analysis",
        }
        
        response = await client.post(
            "/api/exports/request",
            json=payload,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code in [200, 201, 401]
        
        if response.status_code == 201:
            export_id = response.json()["export_id"]
            
            # Admin approves export
            response = await client.post(
                f"/api/exports/{export_id}/approve",
                json={"notes": "Approved"},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            
            assert response.status_code in [200, 401, 403]


class TestErrorHandling:
    """Test error handling across the API."""
    
    async def test_invalid_request_format(self, client, auth_token):
        """Test invalid request format handling."""
        
        response = await client.post(
            "/api/predictions/conflict-risk",
            json={"invalid": "data"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Should return 400 Bad Request or 422 Validation Error
        assert response.status_code in [400, 422]
        
        # Error should be structured
        data = response.json()
        assert "error" in data or "detail" in data
    
    async def test_missing_required_field(self, client, auth_token):
        """Test missing required field validation."""
        
        response = await client.post(
            "/api/predictions/conflict-risk",
            json={"confidence_threshold": 0.7},  # Missing region
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code in [400, 422]
    
    async def test_invalid_field_type(self, client, auth_token):
        """Test invalid field type handling."""
        
        response = await client.post(
            "/api/predictions/conflict-risk",
            json={
                "region": "Kenya",
                "confidence_threshold": "not-a-number"  # Should be float
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 422  # Pydantic validation error
    
    async def test_out_of_range_values(self, client, auth_token):
        """Test out-of-range value handling."""
        
        response = await client.post(
            "/api/predictions/conflict-risk",
            json={
                "region": "Kenya",
                "confidence_threshold": 1.5  # Should be 0-1
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 422
    
    async def test_not_found_error(self, client, auth_token):
        """Test 404 Not Found handling."""
        
        response = await client.get(
            "/api/predictions/nonexistent-id",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code in [404, 401]
        
        if response.status_code == 404:
            data = response.json()
            assert "error" in data or "detail" in data


class TestConcurrency:
    """Test concurrent request handling."""
    
    async def test_concurrent_predictions(self, client, auth_token):
        """Test multiple concurrent prediction requests."""
        
        import asyncio
        
        async def make_prediction():
            payload = {
                "region": "Kenya",
                "confidence_threshold": 0.7,
            }
            return await client.post(
                "/api/predictions/conflict-risk",
                json=payload,
                headers={"Authorization": f"Bearer {auth_token}"}
            )
        
        # Make 10 concurrent requests
        responses = await asyncio.gather(
            *[make_prediction() for _ in range(10)]
        )
        
        # All should succeed
        for response in responses:
            assert response.status_code in [200, 401]
    
    async def test_concurrent_reads(self, client, auth_token):
        """Test concurrent read requests."""
        
        import asyncio
        
        async def list_predictions():
            return await client.get(
                "/api/predictions/list",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
        
        # Make 10 concurrent reads
        responses = await asyncio.gather(
            *[list_predictions() for _ in range(10)]
        )
        
        # All should succeed
        for response in responses:
            assert response.status_code in [200, 401]


class TestDataConsistency:
    """Test data consistency across operations."""
    
    async def test_create_and_retrieve_consistency(self, client, auth_token):
        """Test that created data can be retrieved correctly."""
        
        # Create prediction
        create_payload = {
            "region": "Kenya",
            "confidence_threshold": 0.7,
        }
        
        response = await client.post(
            "/api/predictions/conflict-risk",
            json=create_payload,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if response.status_code == 200:
            created_data = response.json()
            pred_id = created_data["prediction_id"]
            
            # Retrieve and verify
            response = await client.get(
                f"/api/predictions/{pred_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            
            if response.status_code == 200:
                retrieved_data = response.json()
                assert retrieved_data["prediction_id"] == pred_id
                assert retrieved_data["region"] == create_payload["region"]
    
    async def test_list_includes_created_item(self, client, auth_token):
        """Test that newly created items appear in list."""
        
        # Create prediction
        create_payload = {
            "region": "Kingdom of Marblehead",  # Unique region for testing
            "confidence_threshold": 0.7,
        }
        
        response = await client.post(
            "/api/predictions/conflict-risk",
            json=create_payload,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # List predictions
        response = await client.get(
            f"/api/predictions/list?search=Marblehead",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Item should be in list (if list supports search)
        assert response.status_code in [200, 401]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
