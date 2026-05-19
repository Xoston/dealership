import pytest
from fastapi.testclient import TestClient
from ..main import app
from ..database import get_connection
from ..auth import get_password_hash

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    """Очищаем базу перед каждым тестом и создаём тестового админа."""
    conn = get_connection()
    conn.executescript("""
        DELETE FROM purchases;
        DELETE FROM test_drive_requests;
        DELETE FROM loan_applications;
        DELETE FROM car_images;
        DELETE FROM cars;
        DELETE FROM users;
    """)
    conn.commit()
    hashed = get_password_hash("testpass")
    conn.execute(
        "INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, 'admin', ?)",
        ("admin@test.com", hashed, "Test Admin")
    )
    conn.commit()
    conn.close()
    yield

def get_auth_token(email="admin@test.com", password="testpass"):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]

def test_create_car():
    token = get_auth_token()
    response = client.post(
        "/api/cars/",
        json={
            "brand": "BMW",
            "model": "M5",
            "year": 2023,
            "price": 8000000,
            "description": "Test car",
            "body_type": "sedan",
            "restyling": False
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["brand"] == "BMW"
    assert data["id"] > 0   # вместо жёсткой проверки id == 1

def test_get_cars():
    token = get_auth_token()
    client.post("/api/cars/", json={"brand": "BMW", "model": "M5", "year": 2023, "price": 8000000}, headers={"Authorization": f"Bearer {token}"})
    response = client.get("/api/cars/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["brand"] == "BMW"

def test_calculate_loan():
    token = get_auth_token()
    # Создаём автомобиль и получаем его реальный id
    create_resp = client.post(
        "/api/cars/",
        json={"brand": "BMW", "model": "M5", "year": 2023, "price": 8000000},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert create_resp.status_code == 200
    car_id = create_resp.json()["id"]

    response = client.post(
        "/api/loans/calculate",
        json={
            "car_id": car_id,
            "amount": 5000000,
            "term_months": 36,
            "interest_rate": 12
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "monthly_payment" in data
    assert "overpayment" in data
    assert "schedule" in data
    assert len(data["schedule"]) == 36

def test_unauthorized_access():
    response = client.get("/api/admin/stats")
    assert response.status_code == 401

def test_validation_error():
    token = get_auth_token()
    response = client.post(
        "/api/cars/",
        json={"brand": "", "model": "", "year": 0, "price": -100},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data