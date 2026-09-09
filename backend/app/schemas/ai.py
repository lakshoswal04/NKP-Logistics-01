from pydantic import BaseModel, Field

DISCLAIMER = (
    "AI output for decision support, not ground truth. A human confirms every action."
)


class AiStatus(BaseModel):
    mode: str = Field(description="live when a Gemini key is configured, otherwise demo")
    model: str | None = None
    features: list[str]
    suggestions: list[str]
    note: str


class CopilotRequest(BaseModel):
    question: str = Field(min_length=2, max_length=800)


class CopilotResponse(BaseModel):
    answer: str
    mode: str
    model: str | None = None
    tools_used: list[str] = []
    data: dict | None = None
    disclaimer: str = DISCLAIMER


class AddressRequest(BaseModel):
    address: str = Field(min_length=6, max_length=800)


class NormalisedAddress(BaseModel):
    line1: str | None = None
    locality: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    phone: str | None = None


class AddressResponse(BaseModel):
    normalised: NormalisedAddress
    serviceable: bool
    confidence: float = Field(ge=0, le=1)
    rto_risk: float = Field(ge=0, le=1)
    risk_band: str
    issues: list[str]
    reasoning: str
    mode: str = "demo"
    model: str | None = None
    disclaimer: str = DISCLAIMER


class CityVolume(BaseModel):
    city: str = Field(min_length=2, max_length=80)
    orders: int = Field(ge=0, le=10_000_000)


class PlacementRequest(BaseModel):
    distribution: list[CityVolume] = Field(min_length=1, max_length=40)
    notes: str | None = Field(default=None, max_length=600)


class PlacementPick(BaseModel):
    fulfilment_centre: str
    orders: int
    share_pct: float
    rationale: str


class PlacementResponse(BaseModel):
    recommended: list[PlacementPick]
    total_orders: int
    coverage_pct: float
    unmapped_orders: int = 0
    summary: str
    reasoning: str
    mode: str = "demo"
    model: str | None = None
    disclaimer: str = DISCLAIMER


class TriageRequest(BaseModel):
    message: str = Field(min_length=10, max_length=4000)
    email: str | None = Field(default=None, max_length=255)


class TriageResponse(BaseModel):
    category: str
    urgency: str
    summary: str
    suggested_reply: str
    needs_human: bool
    matched_topics: list[str] = []
    mode: str = "demo"
    model: str | None = None
    disclaimer: str = DISCLAIMER


class DelayNarrativeRequest(BaseModel):
    tracking_id: str = Field(min_length=4, max_length=20)


class DelayNarrativeResponse(BaseModel):
    tracking_id: str
    status: str
    headline: str
    explanation: str
    next_step: str
    revised_eta_note: str
    email_subject: str
    email_body: str
    mode: str = "demo"
    model: str | None = None
    disclaimer: str = DISCLAIMER
