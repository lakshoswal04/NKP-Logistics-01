"""Seed demo data so tracking and portal demos work with zero external services.

Run: python -m app.seed  (idempotent — skips if data already exists)
"""

import asyncio
from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.core.security import hash_password
from app.db import async_session_factory
from app.models import (
    Company,
    Shipment,
    ShipmentEvent,
    ShipmentStatus,
    ShipmentType,
    User,
    UserRole,
)
from app.services.maps.cities import CITY_COORDS

NOW = datetime.now(UTC)

DEMO_USERS = [
    ("customer@demo.nkp", "Priya Sharma", UserRole.customer),
    ("admin@demo.nkp", "Arjun Mehta", UserRole.admin),
    ("warehouse@demo.nkp", "Sunil Kumar", UserRole.warehouse),
    ("driver@demo.nkp", "Ravi Yadav", UserRole.driver),
    ("super@demo.nkp", "Neha Kapoor", UserRole.superadmin),
]

# (tracking_id, origin, destination, type, status, driver, vehicle, hours_since_pickup)
DEMO_SHIPMENTS = [
    ("NKP2026A1B2", "mumbai", "delhi", ShipmentType.ftl, ShipmentStatus.in_transit, "Ravi Yadav", "32-ft Container Truck", 18),
    ("NKP2026C3D4", "bengaluru", "chennai", ShipmentType.express, ShipmentStatus.out_for_delivery, "Mohan Das", "Tata Ace EV", 9),
    ("NKP2026E5F6", "ahmedabad", "pune", ShipmentType.ltl, ShipmentStatus.delivered, "Iqbal Khan", "19-ft Truck", 52),
    ("NKP2026G7H8", "delhi", "jaipur", ShipmentType.last_mile, ShipmentStatus.picked_up, "Suresh Pal", "Pickup Van", 3),
    ("NKP2026J9K1", "kolkata", "guwahati", ShipmentType.ftl, ShipmentStatus.delayed, "Bikram Singh", "32-ft Container Truck", 30),
    ("NKP2026L2M3", "hyderabad", "visakhapatnam", ShipmentType.ltl, ShipmentStatus.in_transit, "Venkat Rao", "24-ft Truck", 12),
    ("NKP2026N4P5", "surat", "mumbai", ShipmentType.express, ShipmentStatus.delivered, "Amit Joshi", "Tempo Traveller", 40),
    ("NKP2026Q6R7", "pune", "bengaluru", ShipmentType.ftl, ShipmentStatus.booked, None, None, 0),
    ("NKP2026S8T9", "chennai", "coimbatore", ShipmentType.last_mile, ShipmentStatus.in_transit, "Karthik S", "Pickup Van", 6),
    ("NKP2026U1V2", "indore", "nagpur", ShipmentType.ltl, ShipmentStatus.failed, "Dinesh Verma", "19-ft Truck", 48),
]

STATUS_FLOW = [
    ShipmentStatus.booked,
    ShipmentStatus.picked_up,
    ShipmentStatus.in_transit,
    ShipmentStatus.out_for_delivery,
    ShipmentStatus.delivered,
]

EVENT_COPY = {
    ShipmentStatus.booked: "Shipment booked and confirmed",
    ShipmentStatus.picked_up: "Package picked up from origin facility",
    ShipmentStatus.in_transit: "In transit on planned route",
    ShipmentStatus.out_for_delivery: "Out for delivery",
    ShipmentStatus.delivered: "Delivered — POD captured",
    ShipmentStatus.delayed: "Delay flagged: heavy traffic on corridor, revised ETA shared",
    ShipmentStatus.failed: "Delivery attempt failed: consignee unavailable, reattempt scheduled",
}


def _midpoint(a: tuple[float, float], b: tuple[float, float], t: float) -> tuple[float, float]:
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def _events_for(shipment: Shipment, origin: str, dest: str, hours: int) -> list[ShipmentEvent]:
    o, d = CITY_COORDS[origin], CITY_COORDS[dest]
    target = shipment.status
    if target in (ShipmentStatus.delayed, ShipmentStatus.failed):
        # Reach in_transit through the normal flow, then append the exception event
        flow = STATUS_FLOW[: STATUS_FLOW.index(ShipmentStatus.in_transit) + 1] + [target]
    else:
        flow = STATUS_FLOW[: STATUS_FLOW.index(target) + 1]

    start = NOW - timedelta(hours=max(hours, len(flow)))
    step = max(hours, len(flow)) / len(flow)
    events = []
    for i, status in enumerate(flow):
        t = i / max(len(flow) - 1, 1)
        lat, lng = _midpoint(o, d, t)
        events.append(
            ShipmentEvent(
                status=status,
                description=EVENT_COPY[status],
                location=origin.title() if i == 0 else (dest.title() if t == 1 else "En route"),
                lat=round(lat, 4),
                lng=round(lng, 4),
                occurred_at=start + timedelta(hours=step * (i + 1)),
            )
        )
    return events


async def seed() -> None:
    async with async_session_factory() as db:
        if await db.scalar(select(Company).limit(1)):
            print("Seed data already present — nothing to do.")
            return

        company = Company(
            name="Demo Traders Pvt Ltd",
            gstin="27AAACD1234F1Z5",
            email="ops@demotraders.example",
            phone="+91 98200 00000",
        )
        db.add(company)
        await db.flush()

        for email, name, role in DEMO_USERS:
            db.add(
                User(
                    email=email,
                    hashed_password=hash_password("demo1234"),
                    full_name=name,
                    role=role,
                    company_id=company.id if role == UserRole.customer else None,
                )
            )

        for tid, origin, dest, stype, status, driver, vehicle, hours in DEMO_SHIPMENTS:
            shipment = Shipment(
                tracking_id=tid,
                company_id=company.id,
                origin_city=origin.title(),
                origin_address=f"NKP Hub, {origin.title()}",
                destination_city=dest.title(),
                destination_address=f"Industrial Area, {dest.title()}",
                status=status,
                shipment_type=stype,
                weight_kg=1200.0 if stype == ShipmentType.ftl else 240.0,
                vehicle_type=vehicle,
                driver_name=driver,
                pickup_date=NOW - timedelta(hours=hours) if hours else None,
                eta=NOW + timedelta(hours=8) if status not in (ShipmentStatus.delivered, ShipmentStatus.failed) else None,
            )
            shipment.events = _events_for(shipment, origin, dest, hours) if hours else [
                ShipmentEvent(
                    status=ShipmentStatus.booked,
                    description=EVENT_COPY[ShipmentStatus.booked],
                    location=origin.title(),
                    lat=CITY_COORDS[origin][0],
                    lng=CITY_COORDS[origin][1],
                    occurred_at=NOW - timedelta(hours=1),
                )
            ]
            db.add(shipment)

        await db.commit()
        print(f"Seeded 1 company, {len(DEMO_USERS)} users, {len(DEMO_SHIPMENTS)} shipments.")
        print("Try tracking ID: NKP2026A1B2")


if __name__ == "__main__":
    asyncio.run(seed())
