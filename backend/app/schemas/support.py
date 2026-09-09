from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models import TicketStatus


class TicketCreate(BaseModel):
    category: str = Field(min_length=2, max_length=60)
    subject: str = Field(min_length=4, max_length=255)
    body: str = Field(min_length=10, max_length=5000)
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    tracking_id: str | None = Field(default=None, max_length=20)


class TicketOut(BaseModel):
    id: int
    ticket_id: str
    category: str
    subject: str
    status: TicketStatus
    created_at: datetime
    # Populated by SmartAssist when a Gemini key is configured.
    ai_category: str | None = None
    ai_summary: str | None = None
    ai_suggested_reply: str | None = None

    model_config = {"from_attributes": True}


class TicketListOut(BaseModel):
    items: list[TicketOut]
    total: int
