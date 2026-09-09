"""Invoice CRUD, PDF rendering, emailing and CSV export."""

from __future__ import annotations

import logging
from datetime import UTC, date, datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.db import get_db
from app.models import Invoice, InvoiceLineItem, InvoiceStatus, User, UserRole
from app.schemas.invoices import (
    InvoiceCreate,
    InvoiceListOut,
    InvoiceOut,
    InvoiceSummary,
    InvoiceUpdate,
    SendInvoiceRequest,
    SendInvoiceResult,
)
from app.services.email import get_email_provider
from app.services.email.templates import render_invoice_email
from app.services.exports import csv_response
from app.services.invoicing import LineInput, compute_totals, next_invoice_number, rupees_to_paise
from app.services.invoicing.pdf import render_invoice_pdf

logger = logging.getLogger("nkp.invoices")
router = APIRouter(prefix="/invoices", tags=["invoices"])

STAFF_ROLES = (UserRole.admin, UserRole.superadmin)


def _is_staff(user: User) -> bool:
    return user.role in STAFF_ROLES


def _scope(stmt, user: User):
    """Restrict a query to what this user may see.

    Staff see everything; everyone else sees only their own company's invoices.
    A user with no company sees nothing rather than everything — failing closed
    matters more here than a convenient demo.
    """
    if _is_staff(user):
        return stmt
    if user.company_id is None:
        return stmt.where(False)
    return stmt.where(Invoice.company_id == user.company_id)


async def _load(db: AsyncSession, invoice_id: int, user: User) -> Invoice:
    stmt = _scope(
        select(Invoice)
        .options(selectinload(Invoice.line_items), selectinload(Invoice.payments))
        .where(Invoice.id == invoice_id),
        user,
    )
    invoice = (await db.execute(stmt)).scalar_one_or_none()
    if invoice is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")
    return invoice


def _to_lines(items) -> list[LineInput]:
    return [
        LineInput(
            description=item.description,
            unit_price_paise=rupees_to_paise(item.unit_price),
            quantity=item.quantity,
            hsn_sac=item.hsn_sac,
            unit=item.unit,
            tax_rate=item.tax_rate,
        )
        for item in items
    ]


def _apply_lines(invoice: Invoice, lines: list[LineInput]) -> None:
    settings = get_settings()
    totals = compute_totals(
        lines, seller_state=settings.seller_state, place_of_supply=invoice.place_of_supply
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
    invoice.subtotal_paise = totals.subtotal_paise
    invoice.cgst_paise = totals.cgst_paise
    invoice.sgst_paise = totals.sgst_paise
    invoice.igst_paise = totals.igst_paise
    invoice.total_paise = totals.total_paise


@router.get("", response_model=InvoiceListOut)
async def list_invoices(
    status_filter: InvoiceStatus | None = Query(default=None, alias="status"),
    q: str | None = Query(default=None, max_length=100, description="Match number or billed name"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = _scope(select(Invoice), user)
    if status_filter is not None:
        stmt = stmt.where(Invoice.status == status_filter)
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(or_(Invoice.number.ilike(pattern), Invoice.bill_to_name.ilike(pattern)))

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()

    rows = (
        await db.execute(
            stmt.order_by(Invoice.issue_date.desc(), Invoice.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).scalars().all()

    # Portfolio figures span the whole filtered set, not just this page.
    open_rows = (
        await db.execute(
            _scope(
                select(Invoice).where(
                    Invoice.status.in_([InvoiceStatus.sent, InvoiceStatus.overdue])
                ),
                user,
            )
        )
    ).scalars().all()
    outstanding = sum(i.balance_paise for i in open_rows)
    overdue = sum(i.balance_paise for i in open_rows if i.is_overdue)

    return InvoiceListOut(
        items=[InvoiceSummary.model_validate(i) for i in rows],
        total=total,
        page=page,
        page_size=page_size,
        outstanding_paise=outstanding,
        overdue_paise=overdue,
    )


@router.get("/export.csv")
async def export_invoices_csv(
    status_filter: InvoiceStatus | None = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = _scope(select(Invoice), user)
    if status_filter is not None:
        stmt = stmt.where(Invoice.status == status_filter)
    rows = (await db.execute(stmt.order_by(Invoice.issue_date.desc()))).scalars().all()

    # Rupee columns, not paise — this file is opened by humans in Excel.
    return csv_response(
        f"nkp-invoices-{date.today():%Y-%m-%d}.csv",
        [
            "Invoice number", "Status", "Issue date", "Due date", "Billed to", "GSTIN",
            "Place of supply", "Currency", "Subtotal", "CGST", "SGST", "IGST",
            "Total", "Amount paid", "Balance due", "Overdue",
        ],
        [
            [
                i.number, i.status, i.issue_date, i.due_date, i.bill_to_name, i.bill_to_gstin,
                i.place_of_supply, i.currency,
                i.subtotal_paise / 100, i.cgst_paise / 100, i.sgst_paise / 100, i.igst_paise / 100,
                i.total_paise / 100, i.amount_paid_paise / 100, i.balance_paise / 100,
                i.is_overdue,
            ]
            for i in rows
        ],
    )


@router.post("", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    body: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not _is_staff(user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only staff can raise invoices")

    settings = get_settings()
    issue_date = body.issue_date or date.today()
    invoice = Invoice(
        number=await next_invoice_number(db, prefix=settings.invoice_prefix, on=issue_date),
        company_id=body.company_id,
        shipment_id=body.shipment_id,
        status=InvoiceStatus.draft,
        issue_date=issue_date,
        due_date=body.due_date or issue_date + timedelta(days=settings.invoice_terms_days),
        bill_to_name=body.bill_to_name,
        bill_to_gstin=body.bill_to_gstin,
        bill_to_email=body.bill_to_email,
        bill_to_address=body.bill_to_address,
        place_of_supply=body.place_of_supply or settings.seller_state,
        notes=body.notes,
    )
    _apply_lines(invoice, _to_lines(body.line_items))
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice, ["line_items", "payments"])
    return invoice


@router.get("/{invoice_id}", response_model=InvoiceOut)
async def get_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await _load(db, invoice_id, user)


@router.patch("/{invoice_id}", response_model=InvoiceOut)
async def update_invoice(
    invoice_id: int,
    body: InvoiceUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not _is_staff(user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only staff can edit invoices")
    invoice = await _load(db, invoice_id, user)
    if invoice.status != InvoiceStatus.draft:
        # An issued invoice is a legal document; correcting one means a credit
        # note, not an in-place edit.
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Invoice {invoice.number} has been issued and can no longer be edited",
        )

    data = body.model_dump(exclude_unset=True)
    lines = data.pop("line_items", None)
    for field, value in data.items():
        setattr(invoice, field, value)
    if lines is not None:
        _apply_lines(invoice, _to_lines(body.line_items))
    elif "place_of_supply" in data:
        # The CGST/SGST-vs-IGST split depends on it, so totals must be redone.
        _apply_lines(invoice, [
            LineInput(
                description=li.description,
                unit_price_paise=li.unit_price_paise,
                quantity=li.quantity,
                hsn_sac=li.hsn_sac,
                unit=li.unit,
                tax_rate=li.tax_rate,
            )
            for li in invoice.line_items
        ])

    await db.commit()
    await db.refresh(invoice, ["line_items", "payments"])
    return invoice


@router.post("/{invoice_id}/void", response_model=InvoiceOut)
async def void_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not _is_staff(user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only staff can void invoices")
    invoice = await _load(db, invoice_id, user)
    if invoice.status == InvoiceStatus.paid:
        raise HTTPException(status.HTTP_409_CONFLICT, "A paid invoice cannot be voided; refund it instead")
    invoice.status = InvoiceStatus.void
    await db.commit()
    await db.refresh(invoice, ["line_items", "payments"])
    return invoice


@router.get("/{invoice_id}/pdf")
async def invoice_pdf(
    invoice_id: int,
    download: bool = Query(default=True),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    invoice = await _load(db, invoice_id, user)
    pdf = render_invoice_pdf(invoice)
    filename = f"{invoice.number.replace('/', '-')}.pdf"
    disposition = "attachment" if download else "inline"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'{disposition}; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.post("/{invoice_id}/send", response_model=SendInvoiceResult)
@limiter.limit("20/minute")
async def send_invoice(
    request: Request,
    invoice_id: int,
    body: SendInvoiceRequest,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not _is_staff(user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only staff can send invoices")
    invoice = await _load(db, invoice_id, user)

    recipient = (body.to or invoice.bill_to_email or "").strip()
    if not recipient:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "No billing email on this invoice — pass an explicit recipient",
        )
    if invoice.status == InvoiceStatus.void:
        raise HTTPException(status.HTTP_409_CONFLICT, "A voided invoice cannot be sent")

    subject, html, text = render_invoice_email(invoice, message=body.message)
    pdf = render_invoice_pdf(invoice)
    provider = get_email_provider()

    # Rendering happens inline (so a template error surfaces as a 500 the caller
    # sees), but the network send is deferred so a slow SMTP hop never holds the
    # request open.
    background.add_task(
        provider.send,
        to=recipient,
        subject=subject,
        body=text,
        html=html,
        attachments=[(f"{invoice.number.replace('/', '-')}.pdf", "application/pdf", pdf)],
    )

    if invoice.status == InvoiceStatus.draft:
        invoice.status = InvoiceStatus.sent
    invoice.sent_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(invoice)

    logger.info("Invoice %s queued for %s via %s", invoice.number, recipient, provider.name)
    return SendInvoiceResult(
        sent_to=recipient, number=invoice.number, status=invoice.status, provider=provider.name
    )
