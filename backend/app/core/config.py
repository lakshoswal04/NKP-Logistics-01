from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


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

    cors_origins: list[str] = ["http://localhost:5001"]

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


@lru_cache
def get_settings() -> Settings:
    return Settings()
