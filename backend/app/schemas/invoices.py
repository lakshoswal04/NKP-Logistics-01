from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field

from app.models import InvoiceStatus


class LineItemIn(BaseModel):
    description: str = Field(min_length=1, max_length=500)
    unit_price: float = Field(gt=0, description="Unit price in rupees")
    quantity: float = Field(default=1, gt=0, le=1_000_000)
    hsn_sac: str | None = Field(default=None, max_length=10)
    unit: str | None = Field(default=None, max_length=20)
    tax_rate: float = Field(default=18.0, ge=0, le=28)


class LineItemOut(BaseModel):
    id: int
    description: str
    hsn_sac: str | None
    quantity: float
    unit: str | None
    unit_price_paise: int
    tax_rate: float
    amount_paise: int

    model_config = {"from_attributes": True}


class InvoiceCreate(BaseModel):
    company_id: int | None = None
    shipment_id: int | None = None
    bill_to_name: str = Field(min_length=1, max_length=255)
    bill_to_gstin: str | None = Field(default=None, max_length=15)
    bill_to_email: EmailStr | None = None
    bill_to_address: str | None = Field(default=None, max_length=500)
    place_of_supply: str | None = Field(default=None, max_length=100)
    issue_date: date | None = None
    due_date: date | None = None
    notes: str | None = Field(default=None, max_length=2000)
    line_items: list[LineItemIn] = Field(min_length=1, max_length=50)


class InvoiceUpdate(BaseModel):
    bill_to_name: str | None = Field(default=None, min_length=1, max_length=255)
    bill_to_gstin: str | None = Field(default=None, max_length=15)
    bill_to_email: EmailStr | None = None
    bill_to_address: str | None = Field(default=None, max_length=500)
    place_of_supply: str | None = Field(default=None, max_length=100)
    due_date: date | None = None
    notes: str | None = Field(default=None, max_length=2000)
    line_items: list[LineItemIn] | None = Field(default=None, min_length=1, max_length=50)


class PaymentOut(BaseModel):
    id: int
    provider: str
    provider_payment_id: str | None
    amount_paise: int
    status: str
    method: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceSummary(BaseModel):
    """Row shape for the invoice list — no line items, so listing stays one query."""

    id: int
    number: str
    status: InvoiceStatus
    issue_date: date
    due_date: date
    bill_to_name: str
    place_of_supply: str | None
    currency: str
    total_paise: int
    amount_paid_paise: int
    balance_paise: int
    is_overdue: bool

    model_config = {"from_attributes": True}


class InvoiceOut(InvoiceSummary):
    company_id: int | None
    shipment_id: int | None
    bill_to_gstin: str | None
    bill_to_email: str | None
    bill_to_address: str | None
    subtotal_paise: int
    cgst_paise: int
    sgst_paise: int
    igst_paise: int
    notes: str | None
    sent_at: datetime | None
    paid_at: datetime | None
    created_at: datetime
    line_items: list[LineItemOut] = []
    payments: list[PaymentOut] = []


class InvoiceListOut(BaseModel):
    items: list[InvoiceSummary]
    total: int
    page: int
    page_size: int
    # Portfolio-level figures for the dashboard header, computed over the whole
    # filtered set rather than just the current page.
    outstanding_paise: int
    overdue_paise: int


class SendInvoiceRequest(BaseModel):
    to: EmailStr | None = Field(
        default=None, description="Defaults to the invoice's billing email."
    )
    message: str | None = Field(default=None, max_length=2000)


class SendInvoiceResult(BaseModel):
    sent_to: str
    number: str
    status: InvoiceStatus
    provider: str
