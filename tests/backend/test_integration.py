"""Integration tests for critical workflows."""

import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker


# These would need to be imported from your actual modules
# from backend.main import app
# from db.postgres import get_db_session


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create async test client."""
    # This would connect to test database
    async with AsyncClient(app=None, base_url="http://test") as client:
        yield client


class TestAuthenticationFlow:
    """Test authentication and authorization workflow."""
    
    @pytest.mark.asyncio
    async def test_user_registration_and_login(self, async_client):
        """Test complete user registration and login flow."""
        # Register user
        register_response = await async_client.post("/api/auth/register", json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "TestPassword123!"
        })
        assert register_response.status_code == 201
        
        # Login with new credentials
        login_response = await async_client.post("/api/auth/login", json={
            "username": "testuser",
            "password": "TestPassword123!"
        })
        assert login_response.status_code == 200
        assert "access_token" in login_response.json()["data"]
    
    @pytest.mark.asyncio
    async def test_token_refresh(self, async_client):
        """Test JWT token refresh."""
        # This would require valid tokens
        refresh_response = await async_client.post("/api/auth/refresh", json={
            "refresh_token": "valid_refresh_token"
        })
        assert refresh_response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_access_control(self, async_client):
        """Test role-based access control."""
        # Viewer should not access admin endpoints
        viewer_token = "viewer_token"
        response = await async_client.get(
            "/api/users",
            headers={"Authorization": f"Bearer {viewer_token}"}
        )
        assert response.status_code == 403


class TestDataExportWorkflow:
    """Test data export approval workflow."""
    
    @pytest.mark.asyncio
    async def test_export_request_creation(self, async_client):
        """Test creating export request."""
        response = await async_client.post("/api/security/export-request", json={
            "resource_ids": ["resource-1", "resource-2"],
            "format": "csv",
            "purpose": "analysis",
            "classification": "confidential"
        }, params={"user_id": "user-1"})
        
        assert response.status_code == 200
        data = response.json()
        assert "request" in data["data"]
        assert data["data"]["request"]["status"] == "pending"
    
    @pytest.mark.asyncio
    async def test_export_approval_workflow(self, async_client):
        """Test complete export approval workflow."""
        # Create export request
        create_response = await async_client.post("/api/security/export-request", json={
            "resource_ids": ["resource-1"],
            "format": "csv",
            "purpose": "analysis",
            "classification": "confidential"
        }, params={"user_id": "user-1"})
        
        request_id = create_response.json()["data"]["request"]["request_id"]
        
        # Approve export
        approve_response = await async_client.post("/api/security/export-approve", json={
            "request_id": request_id,
            "approved": True,
            "reason": "Approved for analysis"
        }, params={"approver_id": "approver-1"})
        
        assert approve_response.status_code == 200
        assert "Export request approved" in approve_response.json()["data"]["message"]


class TestPredictionEndToEnd:
    """Test prediction model workflows."""
    
    @pytest.mark.asyncio
    async def test_conflict_risk_prediction(self, async_client):
        """Test conflict risk prediction."""
        response = await async_client.get("/api/predictions/conflict-risk")
        
        assert response.status_code == 200
        data = response.json()["data"]
        assert "region" in data
        assert "forecast" in data
        assert len(data["forecast"]) > 0
    
    @pytest.mark.asyncio
    async def test_model_performance_tracking(self, async_client):
        """Test model performance metrics."""
        response = await async_client.get("/api/predictions/model-performance")
        
        assert response.status_code == 200
        data = response.json()["data"]
        assert "accuracy" in data
        assert "precision" in data
        assert "recall" in data
    
    @pytest.mark.asyncio
    async def test_training_job_lifecycle(self, async_client):
        """Test training job creation and monitoring."""
        # Create training job
        create_response = await async_client.post("/api/predictions/training-pipeline/jobs", json={
            "model_name": "pyg-conflict-risk",
            "dataset_version": "v1",
            "epochs": 10,
            "learning_rate": 0.001
        })
        
        assert create_response.status_code == 200
        job_id = create_response.json()["data"]["job"]["job_id"]
        
        # Check training status
        status_response = await async_client.get("/api/predictions/training-status")
        assert status_response.status_code == 200


class TestSecurityMonitoring:
    """Test security monitoring and threat detection."""
    
    @pytest.mark.asyncio
    async def test_security_dashboard(self, async_client):
        """Test security monitoring dashboard."""
        response = await async_client.get("/api/security/monitoring-dashboard")
        
        assert response.status_code == 200
        data = response.json()["data"]
        assert "summary" in data
        assert "critical_events" in data
        assert "current_status" in data
    
    @pytest.mark.asyncio
    async def test_audit_log_retrieval(self, async_client):
        """Test audit log retrieval."""
        response = await async_client.get("/api/security/audit-log?limit=50")
        
        assert response.status_code == 200
        data = response.json()["data"]
        assert "logs" in data
        assert isinstance(data["logs"], list)


class TestDataValidation:
    """Test input validation and sanitization."""
    
    @pytest.mark.asyncio
    async def test_sql_injection_prevention(self, async_client):
        """Test SQL injection prevention."""
        malicious_payload = {
            "username": "admin'; DROP TABLE users; --",
            "email": "test@example.com",
            "password": "test"
        }
        
        response = await async_client.post("/api/auth/register", json=malicious_payload)
        # Should either reject or sanitize
        assert response.status_code in [400, 422]
    
    @pytest.mark.asyncio
    async def test_xss_prevention(self, async_client):
        """Test XSS prevention."""
        xss_payload = {
            "username": "<script>alert('XSS')</script>",
            "email": "test@example.com",
            "password": "test"
        }
        
        response = await async_client.post("/api/auth/register", json=xss_payload)
        assert response.status_code in [400, 422]
    
    @pytest.mark.asyncio
    async def test_invalid_email_validation(self, async_client):
        """Test email validation."""
        response = await async_client.post("/api/auth/register", json={
            "username": "testuser",
            "email": "invalid-email",
            "password": "Test123!"
        })
        assert response.status_code in [400, 422]


class TestRateLimiting:
    """Test rate limiting functionality."""
    
    @pytest.mark.asyncio
    async def test_rate_limit_enforcement(self, async_client):
        """Test rate limiting on auth endpoint."""
        # Make multiple requests rapidly
        for i in range(6):
            response = await async_client.post("/api/auth/login", json={
                "username": f"user{i}",
                "password": "wrong"
            })
            
            if i < 5:
                # First 5 should work (or fail auth but not rate limit)
                assert response.status_code != 429
            else:
                # 6th should be rate limited
                assert response.status_code == 429


# Test execution would be done with: pytest backend/testing/test_integration.py
