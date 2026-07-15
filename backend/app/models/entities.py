import enum
from datetime import UTC, datetime

from sqlalchemy import (
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


def utcnow() -> datetime:
    return datetime.now(UTC)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
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
