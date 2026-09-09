import enum
from datetime import UTC, date, datetime

from sqlalchemy import (
    JSON,
    BigInteger,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class UserRole(enum.StrEnum):
    customer = "customer"
    admin = "admin"
    warehouse = "warehouse"
    driver = "driver"
    superadmin = "superadmin"


class ShipmentType(enum.StrEnum):
    ftl = "ftl"
    ltl = "ltl"
    express = "express"
    last_mile = "last_mile"


class Urgency(enum.StrEnum):
    standard = "standard"
    urgent = "urgent"


class ShipmentStatus(enum.StrEnum):
    booked = "booked"
    picked_up = "picked_up"
    in_transit = "in_transit"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    delayed = "delayed"
    failed = "failed"


class LeadStatus(enum.StrEnum):
    new = "new"
    contacted = "contacted"
    converted = "converted"
    closed = "closed"


class InvoiceStatus(enum.StrEnum):
    draft = "draft"
    sent = "sent"
    paid = "paid"
    overdue = "overdue"
    void = "void"


class PaymentStatus(enum.StrEnum):
    created = "created"
    authorized = "authorized"
    captured = "captured"
    failed = "failed"
    refunded = "refunded"


class TicketStatus(enum.StrEnum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


def utcnow() -> datetime:
    return datetime.now(UTC)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class Company(TimestampMixin, Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    gstin: Mapped[str | None] = mapped_column(String(15))
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(20))

    users: Mapped[list["User"]] = relationship(back_populates="company")
    addresses: Mapped[list["Address"]] = relationship(back_populates="company")
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="company")


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.customer, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    company_id: Mapped[int | None] = mapped_column(ForeignKey("companies.id"))

    company: Mapped[Company | None] = relationship(back_populates="users")


class Address(Base):
    __tablename__ = "addresses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company_id: Mapped[int | None] = mapped_column(ForeignKey("companies.id"))
    label: Mapped[str | None] = mapped_column(String(100))
    line1: Mapped[str] = mapped_column(String(255), nullable=False)
    line2: Mapped[str | None] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str | None] = mapped_column(String(100))
    pincode: Mapped[str | None] = mapped_column(String(10))
    country: Mapped[str] = mapped_column(String(100), default="India", nullable=False)
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)

    company: Mapped[Company | None] = relationship(back_populates="addresses")


class Quote(TimestampMixin, Base):
    __tablename__ = "quotes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    origin_city: Mapped[str] = mapped_column(String(100), nullable=False)
    destination_city: Mapped[str] = mapped_column(String(100), nullable=False)
    distance_km: Mapped[float] = mapped_column(Float, nullable=False)
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    shipment_type: Mapped[ShipmentType] = mapped_column(Enum(ShipmentType), nullable=False)
    urgency: Mapped[Urgency] = mapped_column(Enum(Urgency), default=Urgency.standard, nullable=False)
    price_min: Mapped[float] = mapped_column(Float, nullable=False)
    price_max: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    lead_id: Mapped[int | None] = mapped_column(ForeignKey("leads.id"))


class Lead(TimestampMixin, Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    company_name: Mapped[str | None] = mapped_column(String(255))
    message: Mapped[str | None] = mapped_column(Text)
    service: Mapped[str | None] = mapped_column(String(100))
    industry: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[LeadStatus] = mapped_column(Enum(LeadStatus), default=LeadStatus.new, nullable=False)

    quotes: Mapped[list[Quote]] = relationship()


class Shipment(TimestampMixin, Base):
    __tablename__ = "shipments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tracking_id: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    company_id: Mapped[int | None] = mapped_column(ForeignKey("companies.id"))
    origin_city: Mapped[str] = mapped_column(String(100), nullable=False)
    origin_address: Mapped[str | None] = mapped_column(String(255))
    destination_city: Mapped[str] = mapped_column(String(100), nullable=False)
    destination_address: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[ShipmentStatus] = mapped_column(
        Enum(ShipmentStatus), default=ShipmentStatus.booked, nullable=False
    )
    shipment_type: Mapped[ShipmentType] = mapped_column(Enum(ShipmentType), nullable=False)
    weight_kg: Mapped[float | None] = mapped_column(Float)
    vehicle_type: Mapped[str | None] = mapped_column(String(100))
    driver_name: Mapped[str | None] = mapped_column(String(255))
    pickup_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    eta: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    events: Mapped[list["ShipmentEvent"]] = relationship(
        back_populates="shipment", order_by="ShipmentEvent.occurred_at"
    )


class ShipmentEvent(Base):
    __tablename__ = "shipment_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    shipment_id: Mapped[int] = mapped_column(ForeignKey("shipments.id"), nullable=False)
    status: Mapped[ShipmentStatus] = mapped_column(Enum(ShipmentStatus), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    location: Mapped[str | None] = mapped_column(String(255))
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    shipment: Mapped[Shipment] = relationship(back_populates="events")


class Document(TimestampMixin, Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    shipment_id: Mapped[int | None] = mapped_column(ForeignKey("shipments.id"))
    company_id: Mapped[int | None] = mapped_column(ForeignKey("companies.id"))
    kind: Mapped[str] = mapped_column(String(50), nullable=False)  # pod | eway_bill | invoice | upload
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str | None] = mapped_column(String(1024))


class Invoice(TimestampMixin, Base):
    """A GST invoice raised against a company.

    All monetary values are stored in **paise** (integer minor units), never as
    floats — rupee arithmetic on floats silently loses precision, and Razorpay's
    API takes paise anyway, so this keeps one representation end to end.
    """

    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    number: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    company_id: Mapped[int | None] = mapped_column(ForeignKey("companies.id"))
    shipment_id: Mapped[int | None] = mapped_column(ForeignKey("shipments.id"))
    status: Mapped[InvoiceStatus] = mapped_column(
        Enum(InvoiceStatus), default=InvoiceStatus.draft, nullable=False
    )

    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Billing snapshot — denormalised so a historic invoice never changes when
    # the company record is edited later.
    bill_to_name: Mapped[str] = mapped_column(String(255), nullable=False)
    bill_to_gstin: Mapped[str | None] = mapped_column(String(15))
    bill_to_email: Mapped[str | None] = mapped_column(String(255))
    bill_to_address: Mapped[str | None] = mapped_column(String(500))
    place_of_supply: Mapped[str | None] = mapped_column(String(100))

    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    subtotal_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    # GST splits into CGST+SGST within a state, or a single IGST across states.
    cgst_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    sgst_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    igst_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    total_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    amount_paid_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)

    notes: Mapped[str | None] = mapped_column(Text)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    company: Mapped["Company | None"] = relationship(back_populates="invoices")
    line_items: Mapped[list["InvoiceLineItem"]] = relationship(
        back_populates="invoice", cascade="all, delete-orphan", order_by="InvoiceLineItem.id"
    )
    payments: Mapped[list["Payment"]] = relationship(
        back_populates="invoice", cascade="all, delete-orphan", order_by="Payment.id"
    )

    @property
    def balance_paise(self) -> int:
        return max(self.total_paise - self.amount_paid_paise, 0)


class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    invoice_id: Mapped[int] = mapped_column(ForeignKey("invoices.id"), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    hsn_sac: Mapped[str | None] = mapped_column(String(10))
    quantity: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    unit: Mapped[str | None] = mapped_column(String(20))
    unit_price_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    tax_rate: Mapped[float] = mapped_column(Float, default=18.0, nullable=False)
    amount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)

    invoice: Mapped[Invoice] = relationship(back_populates="line_items")


class Payment(TimestampMixin, Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    invoice_id: Mapped[int] = mapped_column(ForeignKey("invoices.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String(30), nullable=False)  # razorpay | mock
    provider_order_id: Mapped[str | None] = mapped_column(String(120), index=True)
    provider_payment_id: Mapped[str | None] = mapped_column(String(120), index=True)
    provider_signature: Mapped[str | None] = mapped_column(String(255))
    amount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), default=PaymentStatus.created, nullable=False
    )
    method: Mapped[str | None] = mapped_column(String(40))
    error_description: Mapped[str | None] = mapped_column(String(500))
    raw_payload: Mapped[dict | None] = mapped_column(JSON)

    invoice: Mapped[Invoice] = relationship(back_populates="payments")


class SupportTicket(TimestampMixin, Base):
    __tablename__ = "support_tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ticket_id: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    tracking_id: Mapped[str | None] = mapped_column(String(20))
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus), default=TicketStatus.open, nullable=False
    )
    # Populated by SmartAssist when a Gemini key is configured; null otherwise.
    ai_category: Mapped[str | None] = mapped_column(String(60))
    ai_summary: Mapped[str | None] = mapped_column(Text)
    ai_suggested_reply: Mapped[str | None] = mapped_column(Text)
