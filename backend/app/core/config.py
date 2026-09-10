import logging
from functools import lru_cache
from typing import Annotated

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

logger = logging.getLogger("nkp.config")

PLACEHOLDER_JWT_SECRET = "change-me-in-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "NKP Logistics API"
    environment: str = "development"
    debug: bool = True

    database_url: str = "postgresql+asyncpg://localhost:5432/nkp_logistics"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14

    # Accepts a JSON array or a plain comma-separated string, because a hosting
    # dashboard only lets you type a string and JSON-in-a-textbox is easy to
    # get subtly wrong.
    #
    # NoDecode is load-bearing: for a complex-typed field, pydantic-settings
    # runs json.loads() on the raw env value *before* any field validator, so a
    # comma-separated string raises a SettingsError at the source layer and the
    # validator below never runs. NoDecode hands the raw string over intact.
    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:5001"]

    # Vercel gives every branch and every commit its own preview hostname, so
    # they cannot be enumerated. Matching them by pattern is the only practical
    # option; it is scoped to one project's preview domains, not all of vercel.app.
    cors_origin_regex: str = ""

    # Rate limits (slowapi notation)
    tracking_rate_limit: str = "30/minute"
    leads_rate_limit: str = "10/minute"
    auth_rate_limit: str = "20/minute"

    ai_rate_limit: str = "30/minute"

    # --- External providers -------------------------------------------------
    # Every key below is optional. Left empty, the matching provider falls back
    # to a mock implementation, so the whole stack runs with zero credentials.
    google_maps_api_key: str = ""

    # Email: mock | resend
    email_provider: str = "mock"
    email_api_key: str = ""
    email_from: str = "NKP Logistics <notifications@nkplogistics.in>"
    sales_notification_email: str = "sales@nkplogistics.in"
    support_notification_email: str = "support@nkplogistics.in"

    # Payments: mock | razorpay
    payment_provider: str = "mock"
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""

    # Gemini (AI Control Tower)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"
    gemini_fast_model: str = "gemini-3.5-flash-lite"

    # --- Invoicing / seller identity ---------------------------------------
    # Printed on every invoice and used to decide CGST+SGST vs IGST.
    invoice_prefix: str = "NKP"
    seller_legal_name: str = "NKP Logistics Pvt Ltd"
    seller_gstin: str = "27AABCN1234K1Z9"
    seller_cin: str = "U63030MH2021PTC356712"
    seller_pan: str = "AABCN1234K"
    seller_state: str = "Maharashtra"
    seller_address: str = "NKP House, Plot 14, MIDC Bhiwandi, Thane 421302, Maharashtra"
    seller_email: str = "billing@nkplogistics.in"
    seller_phone: str = "+91 22 6100 4400"
    seller_bank_name: str = "HDFC Bank, Andheri East Branch"
    seller_bank_account: str = "50200071234567"
    seller_bank_ifsc: str = "HDFC0000123"
    invoice_terms_days: int = 15

    # Public base URL of the web app, used in emailed links.
    web_base_url: str = "http://localhost:5001"

    # Run the demo seeder on boot. The seeder is idempotent — it returns early
    # if any company row exists — so this is safe to leave on, but it is opt-in
    # because automatically writing rows into a production database should be a
    # deliberate choice rather than a default.
    seed_on_start: bool = False

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "prod"}

    @field_validator("database_url", mode="after")
    @classmethod
    def _normalise_database_url(cls, value: str) -> str:
        """Coerce a managed-Postgres URL into the async driver form.

        Render (and Heroku, and most managed Postgres) hand out
        ``postgres://…`` or ``postgresql://…``. SQLAlchemy's async engine needs
        an explicit async driver, so without this the app starts and then fails
        on the first query with a driver error that points nowhere useful.
        """
        if value.startswith("postgres://"):
            value = value.replace("postgres://", "postgresql://", 1)
        if value.startswith("postgresql://"):
            value = value.replace("postgresql://", "postgresql+asyncpg://", 1)

        # asyncpg configures TLS itself and rejects libpq's sslmode parameter.
        if "+asyncpg" in value and "sslmode=" in value:
            from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

            parts = urlsplit(value)
            query = [(k, v) for k, v in parse_qsl(parts.query) if k != "sslmode"]
            value = urlunsplit(parts._replace(query=urlencode(query)))
        return value

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors_origins(cls, value):
        if not isinstance(value, str):
            return value
        text = value.strip()
        if text.startswith("["):
            import json

            return json.loads(text)
        return [origin.strip() for origin in text.split(",") if origin.strip()]

    @model_validator(mode="after")
    def _guard_production(self):
        """Refuse to run in production with development defaults.

        Failing at boot is the point: a placeholder signing key that reaches
        production is a total authentication bypass, and it would otherwise be
        completely silent.
        """
        if not self.is_production:
            return self

        if self.jwt_secret == PLACEHOLDER_JWT_SECRET or len(self.jwt_secret) < 32:
            raise ValueError(
                "JWT_SECRET must be set to a unique value of at least 32 characters in "
                "production. Generate one with: openssl rand -hex 32"
            )
        if self.debug:
            raise ValueError("DEBUG must be false in production (it exposes /docs and tracebacks).")
        # The earlier version of this check tested `not self.cors_origins`,
        # which never fired: the field defaults to ["http://localhost:5001"],
        # so it is never empty. A production deploy therefore booted happily
        # with localhost-only CORS and failed only in the browser, with an
        # error that points at the frontend rather than the missing env var.
        remote_origins = [
            origin
            for origin in self.cors_origins
            if not origin.startswith(("http://localhost", "http://127.0.0.1", "https://localhost"))
        ]
        if not remote_origins and not self.cors_origin_regex:
            raise ValueError(
                "CORS_ORIGINS is unset or contains only localhost, so browsers will block "
                "every request from the deployed frontend. Set it to the web app's exact "
                "origin, e.g. CORS_ORIGINS=https://your-app.vercel.app"
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
