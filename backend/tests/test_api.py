from datetime import UTC, datetime

from app.models import Shipment, ShipmentEvent, ShipmentStatus, ShipmentType


async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


async def test_tracking_found(client, db_session):
    shipment = Shipment(
        tracking_id="NKPTEST00001",
        origin_city="Mumbai",
        destination_city="Delhi",
        status=ShipmentStatus.in_transit,
        shipment_type=ShipmentType.ftl,
        driver_name="Test Driver",
    )
    shipment.events = [
        ShipmentEvent(
            status=ShipmentStatus.booked,
            description="Booked",
            location="Mumbai",
            occurred_at=datetime.now(UTC),
        )
    ]
    db_session.add(shipment)
    await db_session.commit()

    resp = await client.get("/api/v1/tracking/nkptest00001")  # case-insensitive lookup
    assert resp.status_code == 200
    body = resp.json()
    assert body["tracking_id"] == "NKPTEST00001"
    assert body["status"] == "in_transit"
    assert len(body["events"]) == 1
    # Public payload must never leak contact details
    assert "driver_phone" not in body


async def test_tracking_not_found(client):
    resp = await client.get("/api/v1/tracking/NKPNOPE99999")
    assert resp.status_code == 404


async def test_quote_estimate(client):
    resp = await client.post(
        "/api/v1/quotes/estimate",
        json={"origin_city": "bengaluru", "destination_city": "chennai", "weight_kg": 250},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["price_min"] < body["price_max"]


async def test_quote_unknown_city_422(client):
    resp = await client.post(
        "/api/v1/quotes/estimate",
        json={"origin_city": "gotham", "destination_city": "chennai", "weight_kg": 250},
    )
    assert resp.status_code == 422


async def test_lead_with_quote(client):
    resp = await client.post(
        "/api/v1/leads",
        json={
            "full_name": "Asha Patel",
            "email": "asha@example.com",
            "message": "Weekly FTL Mumbai-Delhi",
            "origin_city": "mumbai",
            "destination_city": "delhi",
            "weight_kg": 1000,
            "shipment_type": "ftl",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "new"
    assert body["quote"] is not None


async def test_lead_without_shipment_params(client):
    resp = await client.post(
        "/api/v1/leads",
        json={"full_name": "No Quote", "email": "nq@example.com", "message": "Just info"},
    )
    assert resp.status_code == 201
    assert resp.json()["quote"] is None


async def test_register_login_me(client):
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "new@example.com",
            "password": "password123",
            "full_name": "New User",
            "company_name": "Acme Freight",
        },
    )
    assert reg.status_code == 201
    tokens = reg.json()

    me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    assert me.status_code == 200
    assert me.json()["role"] == "customer"

    login = await client.post(
        "/api/v1/auth/login", json={"email": "new@example.com", "password": "password123"}
    )
    assert login.status_code == 200

    bad = await client.post(
        "/api/v1/auth/login", json={"email": "new@example.com", "password": "wrongpass"}
    )
    assert bad.status_code == 401
