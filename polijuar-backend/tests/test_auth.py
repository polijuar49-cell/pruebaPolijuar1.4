import uuid

import pytest
from fastapi.testclient import TestClient
from polijuar_backend.main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def test_user():
    # Generate a unique username for each test run
    username = f"user_{uuid.uuid4().hex[:8]}"
    password = "testpass123"
    return {"username": username, "password": password}

def test_register(test_user):
    response = client.post("/auth/register", json=test_user)
    assert response.status_code == 201, f"Unexpected status: {response.status_code}"
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    # Store token for later use
    test_user["token"] = data["access_token"]

def test_login(test_user):
    # Ensure registration first
    client.post("/auth/register", json=test_user)
    response = client.post("/auth/login", json={"username": test_user["username"], "password": test_user["password"]})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    token = data["access_token"]
    # Test protected endpoint with token
    protected_response = client.get("/categorias", headers={"Authorization": f"Bearer {token}"})
    # Should return 200 even if no categories exist (empty list)
    assert protected_response.status_code == 200
    assert isinstance(protected_response.json(), list)
