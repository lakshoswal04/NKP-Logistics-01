"""Tools the ops copilot can call against live platform data.

Every tool is read-only. The copilot can look things up and summarise them; it
cannot issue an invoice, send an email or change a shipment. Mutations stay
behind the ordinary authenticated REST endpoints where they are logged and
authorised, because a model that can be steered by its own input is the wrong
place to put write access.

Scoping mirrors the REST layer: staff see everything, a customer sees only
their own company's rows, and a user with no company sees nothing.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Invoice,
    InvoiceStatus,
    Shipment,
    ShipmentStatus,
    SupportTicket,
    User,
    UserRole,
)
from app.services.ai.gemini import _tool_declaration
from app.services.invoicing.totals import format_inr

STAFF = (UserRole.admin, UserRole.superadmin)


def _is_staff(user: User) -> bool:
    return user.role in STAFF


def _scope_invoices(stmt, user: User):
    if _is_staff(user):
        return stmt
    if user.company_id is None:
        return stmt.where(False)
    return stmt.where(Invoice.company_id == user.company_id)


def _scope_shipments(stmt, user: User):
    if _is_staff(user):
        return stmt
    if user.company_id is None:
        return stmt.where(False)
    return stmt.where(Shipment.company_id == user.company_id)


# --------------------------------------------------------------------------
# Declarations handed to the model
# --------------------------------------------------------------------------

TOOL_DECLARATIONS = [
    _tool_declaration(
        "lookup_shipment",
        "Look up one consignment by its tracking reference (AWB/LRN) and return its "
        "current status, lane, ETA and recent scan history.",
        {
            "type": "object",
            "properties": {
                "tracking_id": {"type": "string", "description": "e.g. NKP2026A1B2"},
            },
            "required": ["tracking_id"],
        },
    ),
    _tool_declaration(
        "search_shipments",
        "List consignments, optionally filtered by status or city. Use this for "
        "questions like 'what is delayed' or 'how many are in transit'.",
        {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": [s.value for s in ShipmentStatus],
                    "description": "Filter to one status",
                },
                "city": {"type": "string", "description": "Match origin or destination city"},
                "limit": {"type": "integer", "description": "Max rows, 1-25", "default": 10},
            },
        },
    ),
    _tool_declaration(
        "shipment_status_summary",
        "Count consignments grouped by status across the whole network. Use for "
        "'how is the network doing' style questions.",
        {"type": "object", "properties": {}},
    ),
    _tool_declaration(
        "list_invoices",
        "List invoices, optionally filtered by status, with amounts and due dates.",
        {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": [s.value for s in InvoiceStatus],
                },
                "limit": {"type": "integer", "default": 10},
            },
        },
    ),
    _tool_declaration(
        "receivables_summary",
        "Total outstanding and overdue receivables, and the count of invoices in each state.",
        {"type": "object", "properties": {}},
    ),
    _tool_declaration(
        "open_support_tickets",
        "List open or in-progress support tickets with their category and subject.",
        {"type": "object", "properties": {"limit": {"type": "integer", "default": 10}}},
    ),
]


# --------------------------------------------------------------------------
# Implementations
# --------------------------------------------------------------------------


async def lookup_shipment(db: AsyncSession, user: User, *, tracking_id: str) -> dict:
    stmt = _scope_shipments(
        select(Shipment)
        .options(selectinload(Shipment.events))
        .where(Shipment.tracking_id == str(tracking_id).strip().upper()),
        user,
    )
    shipment = (await db.execute(stmt)).scalar_one_or_none()
    if shipment is None:
        return {"found": False, "message": f"No consignment matching {tracking_id}"}

    events = sorted(shipment.events, key=lambda e: e.occurred_at)[-6:]
    return {
        "found": True,
        "tracking_id": shipment.tracking_id,
        "status": shipment.status.value,
        "lane": f"{shipment.origin_city} to {shipment.destination_city}",
        "shipment_type": shipment.shipment_type.value,
        "weight_kg": shipment.weight_kg,
        "vehicle": shipment.vehicle_type,
        "driver": shipment.driver_name,
        "picked_up_at": shipment.pickup_date.isoformat() if shipment.pickup_date else None,
        "eta": shipment.eta.isoformat() if shipment.eta else None,
        "hours_since_pickup": (
            round((datetime.now(UTC) - shipment.pickup_date).total_seconds() / 3600, 1)
            if shipment.pickup_date
            else None
        ),
        "scans": [
            {
                "status": e.status.value,
                "description": e.description,
                "location": e.location,
                "at": e.occurred_at.isoformat(),
            }
            for e in events
        ],
    }


async def search_shipments(
    db: AsyncSession, user: User, *, status: str | None = None, city: str | None = None,
    limit: int = 10,
) -> dict:
    stmt = _scope_shipments(select(Shipment), user)
    if status:
        try:
            stmt = stmt.where(Shipment.status == ShipmentStatus(status))
        except ValueError:
            return {"error": f"Unknown status '{status}'"}
    if city:
        pattern = f"%{city.strip()}%"
        stmt = stmt.where(
            or_(Shipment.origin_city.ilike(pattern), Shipment.destination_city.ilike(pattern))
        )

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (
        await db.execute(stmt.order_by(Shipment.pickup_date.desc().nullslast()).limit(
            max(1, min(int(limit or 10), 25))
        ))
    ).scalars().all()

    return {
        "total_matching": total,
        "shipments": [
            {
                "tracking_id": s.tracking_id,
                "status": s.status.value,
                "lane": f"{s.origin_city} to {s.destination_city}",
                "eta": s.eta.isoformat() if s.eta else None,
                "driver": s.driver_name,
            }
            for s in rows
        ],
    }


async def shipment_status_summary(db: AsyncSession, user: User) -> dict:
    stmt = _scope_shipments(select(Shipment.status, func.count()), user).group_by(Shipment.status)
    rows = (await db.execute(stmt)).all()
    counts = {status.value: count for status, count in rows}
    return {"total": sum(counts.values()), "by_status": counts}


async def list_invoices(
    db: AsyncSession, user: User, *, status: str | None = None, limit: int = 10
) -> dict:
    stmt = _scope_invoices(select(Invoice), user)
    if status:
        try:
            stmt = stmt.where(Invoice.status == InvoiceStatus(status))
        except ValueError:
            return {"error": f"Unknown invoice status '{status}'"}

    rows = (
        await db.execute(
            stmt.order_by(Invoice.issue_date.desc()).limit(max(1, min(int(limit or 10), 25)))
        )
    ).scalars().all()

    return {
        "invoices": [
            {
                "number": i.number,
                "status": i.status.value,
                "billed_to": i.bill_to_name,
                "issue_date": i.issue_date.isoformat(),
                "due_date": i.due_date.isoformat(),
                "total": format_inr(i.total_paise),
                "balance_due": format_inr(i.balance_paise),
                "is_overdue": i.is_overdue,
            }
            for i in rows
        ]
    }


async def receivables_summary(db: AsyncSession, user: User) -> dict:
    rows = (
        await db.execute(
            _scope_invoices(
                select(Invoice).where(
                    Invoice.status.in_([InvoiceStatus.sent, InvoiceStatus.overdue])
                ),
                user,
            )
        )
    ).scalars().all()

    outstanding = sum(i.balance_paise for i in rows)
    overdue_rows = [i for i in rows if i.is_overdue]
    overdue = sum(i.balance_paise for i in overdue_rows)

    paid_count = (
        await db.execute(
            select(func.count()).select_from(
                _scope_invoices(
                    select(Invoice).where(Invoice.status == InvoiceStatus.paid), user
                ).subquery()
            )
        )
    ).scalar_one()

    return {
        "outstanding": format_inr(outstanding),
        "outstanding_paise": outstanding,
        "overdue": format_inr(overdue),
        "overdue_paise": overdue,
        "open_invoice_count": len(rows),
        "overdue_invoice_count": len(overdue_rows),
        "paid_invoice_count": paid_count,
        "oldest_overdue": min((i.due_date.isoformat() for i in overdue_rows), default=None),
    }


async def open_support_tickets(db: AsyncSession, user: User, *, limit: int = 10) -> dict:
    if not _is_staff(user):
        return {"error": "Support ticket queues are staff-only"}
    rows = (
        await db.execute(
            select(SupportTicket)
            .where(SupportTicket.status.in_(["open", "in_progress"]))
            .order_by(SupportTicket.created_at.desc())
            .limit(max(1, min(int(limit or 10), 25)))
        )
    ).scalars().all()
    return {
        "tickets": [
            {
                "ticket_id": t.ticket_id,
                "category": t.category,
                "subject": t.subject,
                "status": t.status.value,
                "raised_at": t.created_at.isoformat(),
                "tracking_id": t.tracking_id,
            }
            for t in rows
        ]
    }


TOOL_IMPLEMENTATIONS = {
    "lookup_shipment": lookup_shipment,
    "search_shipments": search_shipments,
    "shipment_status_summary": shipment_status_summary,
    "list_invoices": list_invoices,
    "receivables_summary": receivables_summary,
    "open_support_tickets": open_support_tickets,
}


def make_executor(db: AsyncSession, user: User):
    """Bind the tool implementations to one request's session and user."""

    async def execute(name: str, arguments: dict):
        impl = TOOL_IMPLEMENTATIONS.get(name)
        if impl is None:
            return {"error": f"Unknown tool '{name}'"}
        clean = {k: v for k, v in (arguments or {}).items() if v is not None}
        return await impl(db, user, **clean)

    return execute


async def snapshot(db: AsyncSession, user: User) -> dict:
    """A compact view of the account, used to ground demo-mode answers."""
    return {
        "shipments": await shipment_status_summary(db, user),
        "receivables": await receivables_summary(db, user),
    }
