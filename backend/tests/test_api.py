from fastapi.testclient import TestClient
from datetime import date, timedelta

from backend.app.config import Settings
from backend.app.main import create_app


def make_client(tmp_path):
    db_path = tmp_path / "styletrim-test.db"
    settings = Settings(
        database_url=f"sqlite+pysqlite:///{db_path}",
        jwt_secret="test-secret-test-secret-test-secret",
        seed_demo_data=True,
    )
    app = create_app(settings)
    return TestClient(app)


def login(client, account="sakura@example.com", password="customer123"):
    response = client.post(
        "/auth/login",
        json={"account": account, "password": password, "rememberMe": True},
    )
    assert response.status_code == 200
    return response.json()


def next_bookable_date():
    candidate = date.today() + timedelta(days=1)
    while candidate.weekday() == 6:
        candidate += timedelta(days=1)
    return candidate.isoformat()


def test_health_endpoint_returns_ok(tmp_path):
    client = make_client(tmp_path)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_customer_can_login_and_create_appointment(tmp_path):
    client = make_client(tmp_path)
    login_payload = login(client)
    access_token = login_payload["data"]["accessToken"]

    services = client.get("/services")
    assert services.status_code == 200
    service_id = services.json()["data"]["items"][0]["id"]

    barbers = client.get("/barbers")
    assert barbers.status_code == 200
    barber_id = barbers.json()["data"]["items"][0]["id"]

    appointment_payload = {
        "serviceId": service_id,
        "barberId": barber_id,
        "appointmentDate": next_bookable_date(),
        "startTime": "10:00",
        "addonIds": [],
        "notes": "請修短一點",
    }

    response = client.post(
        "/appointments",
        headers={"Authorization": f"Bearer {access_token}"},
        json=appointment_payload,
    )
    assert response.status_code == 201
    assert response.json()["data"]["appointment"]["serviceId"] == service_id


def test_appointment_conflict_is_rejected(tmp_path):
    client = make_client(tmp_path)
    login_payload = login(client)
    access_token = login_payload["data"]["accessToken"]

    services = client.get("/services")
    service_id = services.json()["data"]["items"][0]["id"]
    barbers = client.get("/barbers")
    barber_id = barbers.json()["data"]["items"][0]["id"]

    appointment_payload = {
        "serviceId": service_id,
        "barberId": barber_id,
        "appointmentDate": next_bookable_date(),
        "startTime": "10:00",
        "addonIds": [],
        "notes": "第一次預約",
    }

    first = client.post(
        "/appointments",
        headers={"Authorization": f"Bearer {access_token}"},
        json=appointment_payload,
    )
    assert first.status_code == 201

    second = client.post(
        "/appointments",
        headers={"Authorization": f"Bearer {access_token}"},
        json=appointment_payload,
    )
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "APPOINTMENT_CONFLICT"
