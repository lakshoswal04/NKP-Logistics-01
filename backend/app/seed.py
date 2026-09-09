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
    Invoice,
    InvoiceLineItem,
    InvoiceStatus,
    Payment,
    PaymentStatus,
    Shipment,
    ShipmentEvent,
    ShipmentStatus,
    ShipmentType,
    SupportTicket,
    TicketStatus,
    User,
    UserRole,
)
from app.services.invoicing import LineInput, compute_totals, rupees_to_paise
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

    # A shipment still moving should sit mid-route, not at the destination
    reached_destination = flow[-1] == ShipmentStatus.delivered
    max_progress = 1.0 if reached_destination else 0.62

    start = NOW - timedelta(hours=max(hours, len(flow)))
    step = max(hours, len(flow)) / len(flow)
    events = []
    for i, status in enumerate(flow):
        t = (i / max(len(flow) - 1, 1)) * max_progress
        lat, lng = _midpoint(o, d, t)
        events.append(
            ShipmentEvent(
                status=status,
                description=EVENT_COPY[status],
                # Booking and pickup both happen at the origin facility; only the
                # legs in between are genuinely "en route".
                location=origin.title() if i <= 1 else (dest.title() if t == 1 else "En route"),
                lat=round(lat, 4),
                lng=round(lng, 4),
                occurred_at=start + timedelta(hours=step * (i + 1)),
            )
        )
    return events


SELLER_STATE = "Maharashtra"

# (offset_days, status, place_of_supply, [(description, sac, unit, qty, unit_rupees)])
DEMO_INVOICES = [
    (
        95, InvoiceStatus.paid, "Maharashtra",
        [("Warehousing — Bhiwandi FC, 1,200 sq ft dedicated racking", "997212", "month", 1, "45000"),
         ("Pick, pack & label — B2C orders", "996729", "order", 3200, "12.50"),
         ("Inbound GRN handling — 18 pallets", "996729", "pallet", 18, "450")],
    ),
    (
        64, InvoiceStatus.paid, "Maharashtra",
        [("Warehousing — Bhiwandi FC, 1,200 sq ft dedicated racking", "997212", "month", 1, "45000"),
         ("Pick, pack & label — B2C orders", "996729", "order", 4180, "12.50"),
         ("Cold-chain storage surcharge", "997212", "month", 1, "8500")],
    ),
    (
        33, InvoiceStatus.paid, "Karnataka",
        [("Warehousing — Hoskote FC, 800 sq ft shared", "997212", "month", 1, "28000"),
         ("Pick, pack & label — B2C orders", "996729", "order", 2650, "12.50")],
    ),
    (
        12, InvoiceStatus.sent, "Maharashtra",
        [("Warehousing — Bhiwandi FC, 1,200 sq ft dedicated racking", "997212", "month", 1, "45000"),
         ("Pick, pack & label — B2C orders", "996729", "order", 3910, "12.50"),
         ("Reverse logistics — QC & putaway", "996729", "return", 214, "65")],
    ),
    (
        6, InvoiceStatus.sent, "Karnataka",
        [("Warehousing — Hoskote FC, 800 sq ft shared", "997212", "month", 1, "28000"),
         ("Value-added services — kitting & bundling", "996729", "unit", 900, "22")],
    ),
    (
        47, InvoiceStatus.overdue, "Maharashtra",
        [("Warehousing — Bhiwandi FC, peak-season overflow bay", "997212", "month", 1, "31500"),
         ("Manpower — dedicated pickers (2 FTE)", "998519", "month", 2, "24000")],
    ),
    (
        1, InvoiceStatus.draft, "Maharashtra",
        [("Warehousing — Bhiwandi FC, 1,200 sq ft dedicated racking", "997212", "month", 1, "45000"),
         ("Pick, pack & label — B2C orders", "996729", "order", 1180, "12.50")],
    ),
]

DEMO_TICKETS = [
    ("Shipment Status", "Where is my consignment NKP2026J9K1?",
     "The tracking page has shown 'delay flagged' since yesterday morning. This is a "
     "priority restock for our Guwahati store — can someone confirm the revised ETA?",
     "priya@demotraders.example", "NKP2026J9K1", TicketStatus.in_progress),
    ("Businesses / Payments", "GST number missing on invoice",
     "Our finance team cannot claim input credit because the last invoice does not show "
     "our GSTIN. Please reissue with 27AAACD1234F1Z5 on it.",
     "accounts@demotraders.example", None, TicketStatus.open),
    ("International & Fulfillment", "Adding a second fulfilment centre",
     "We are opening a south-India channel and want to split inventory between Bhiwandi "
     "and Hoskote. What is the lead time to onboard a second FC?",
     "ops@demotraders.example", None, TicketStatus.open),
    ("Report Issues", "Two cartons damaged on inbound",
     "GRN 4471 — two cartons arrived crushed. Photos attached in the original email. "
     "Requesting a damage note so we can raise it with the vendor.",
     "warehouse@demotraders.example", None, TicketStatus.resolved),
]


async def _seed_commerce(db, company: Company) -> dict[str, int]:
    """Seed invoices, payments and support tickets for the demo company."""
    today = NOW.date()
    invoices = 0
    payments = 0

    for seq, (offset_days, status, place_of_supply, rows) in enumerate(DEMO_INVOICES, start=1):
        issue_date = today - timedelta(days=offset_days)
        lines = [
            LineInput(
                description=desc,
                unit_price_paise=rupees_to_paise(rate),
                quantity=qty,
                hsn_sac=sac,
                unit=unit,
                tax_rate=18.0,
            )
            for desc, sac, unit, qty, rate in rows
        ]
        totals = compute_totals(lines, seller_state=SELLER_STATE, place_of_supply=place_of_supply)

        paid = status == InvoiceStatus.paid
        invoice = Invoice(
            number=f"NKP/2627/{seq:04d}",
            company_id=company.id,
            status=status,
            issue_date=issue_date,
            due_date=issue_date + timedelta(days=15),
            bill_to_name=company.name,
            bill_to_gstin=company.gstin,
            bill_to_email=company.email,
            bill_to_address="Unit 4, Sunrise Industrial Estate, Andheri East, Mumbai 400093",
            place_of_supply=place_of_supply,
            subtotal_paise=totals.subtotal_paise,
            cgst_paise=totals.cgst_paise,
            sgst_paise=totals.sgst_paise,
            igst_paise=totals.igst_paise,
            total_paise=totals.total_paise,
            amount_paid_paise=totals.total_paise if paid else 0,
            notes="Payment due within 15 days. Warehousing services billed monthly in arrears.",
            sent_at=None if status == InvoiceStatus.draft else NOW - timedelta(days=offset_days - 1),
            paid_at=NOW - timedelta(days=offset_days - 9) if paid else None,
        )
        invoice.line_items = [
            InvoiceLineItem(
                description=line.description,
                hsn_sac=line.hsn_sac,
                quantity=line.quantity,
                unit=line.unit,
                unit_price_paise=line.unit_price_paise,
                tax_rate=line.tax_rate,
                amount_paise=line.amount_paise,
            )
            for line in lines
        ]
        if paid:
            invoice.payments = [
                Payment(
                    provider="razorpay",
                    provider_order_id=f"order_DemoSeed{seq:04d}",
                    provider_payment_id=f"pay_DemoSeed{seq:04d}",
                    amount_paise=totals.total_paise,
                    status=PaymentStatus.captured,
                    method="netbanking" if seq % 2 else "upi",
                )
            ]
            payments += 1

        db.add(invoice)
        invoices += 1

    for seq, (category, subject, body, email, tracking_id, status) in enumerate(DEMO_TICKETS, start=1):
        db.add(
            SupportTicket(
                ticket_id=f"NKPS-{4100 + seq}",
                category=category,
                subject=subject,
                body=body,
                full_name="Priya Sharma",
                email=email,
                phone="+91 98200 00000",
                tracking_id=tracking_id,
                status=status,
            )
        )

    return {"invoices": invoices, "payments": payments, "tickets": len(DEMO_TICKETS)}


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

        await db.flush()
        counts = await _seed_commerce(db, company)

        await db.commit()
        print(f"Seeded 1 company, {len(DEMO_USERS)} users, {len(DEMO_SHIPMENTS)} shipments.")
        print(
            f"Seeded {counts['invoices']} invoices, {counts['payments']} payments, "
            f"{counts['tickets']} support tickets."
        )
        print("Try tracking ID: NKP2026A1B2")


if __name__ == "__main__":
    asyncio.run(seed())
