"""Support tickets raised from the public support centre."""

from __future__ import annotations

import logging
import secrets

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.db import get_db
from app.models import SupportTicket, TicketStatus, User, UserRole
from app.schemas.support import TicketCreate, TicketListOut, TicketOut
from app.services.email import get_email_provider
from app.services.email.templates import render_ticket_ack_email

logger = logging.getLogger("nkp.support")
settings = get_settings()
router = APIRouter(prefix="/support", tags=["support"])


async def _next_ticket_id(db: AsyncSession) -> str:
    """Generate a ticket reference.

    A random suffix rather than a sequence: ticket numbers are quoted publicly
    in emails, and a strictly sequential reference leaks how many queries the
    business receives. Collisions are retried rather than assumed away.
    """
    for _ in range(8):
        candidate = f"NKPS-{secrets.randbelow(900000) + 100000}"
        exists = await db.scalar(select(SupportTicket.id).where(SupportTicket.ticket_id == candidate))
        if not exists:
            return candidate
    raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Could not allocate a ticket reference")


@router.post("/tickets", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("6/minute")
async def create_ticket(
    request: Request,
    body: TicketCreate,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    ticket = SupportTicket(
        ticket_id=await _next_ticket_id(db),
        category=body.category,
        subject=body.subject,
        body=body.body,
        full_name=body.full_name,
        email=body.email.lower(),
        phone=body.phone,
        tracking_id=body.tracking_id.strip().upper() if body.tracking_id else None,
        status=TicketStatus.open,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    email = get_email_provider()
    subject, html, text = render_ticket_ack_email(ticket)
    background.add_task(email.send, to=ticket.email, subject=subject, body=text, html=html)
    background.add_task(
        email.send,
        to=settings.support_notification_email,
        subject=f"[{ticket.ticket_id}] {ticket.category} — {ticket.subject}",
        body=f"From: {ticket.full_name or '—'} <{ticket.email}>\n"
        f"Tracking: {ticket.tracking_id or '—'}\n\n{ticket.body}",
        reply_to=ticket.email,
    )

    logger.info("Support ticket %s raised by %s", ticket.ticket_id, ticket.email)
    return ticket


@router.get("/tickets", response_model=TicketListOut)
async def list_tickets(
    ticket_status: TicketStatus | None = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Staff-only queue. Customers reach their tickets by reference, not by listing."""
    if user.role not in (UserRole.admin, UserRole.superadmin):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Staff only")

    stmt = select(SupportTicket)
    if ticket_status is not None:
        stmt = stmt.where(SupportTicket.status == ticket_status)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (await db.execute(stmt.order_by(SupportTicket.created_at.desc()).limit(100))).scalars().all()
    return TicketListOut(items=[TicketOut.model_validate(t) for t in rows], total=total)


@router.get("/tickets/{ticket_id}", response_model=TicketOut)
@limiter.limit("20/minute")
async def get_ticket(request: Request, ticket_id: str, db: AsyncSession = Depends(get_db)):
    """Look a ticket up by its reference.

    Public by design — the reference is the capability, which is why it is
    random rather than sequential. Only status-level fields are returned.
    """
    ticket = await db.scalar(
        select(SupportTicket).where(SupportTicket.ticket_id == ticket_id.strip().upper())
    )
    if ticket is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No ticket found with that reference")
    return ticket
