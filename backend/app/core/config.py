from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "NKP Logistics API"
    environment: str = "development"
    debug: bool = True

    database_url: str = "postgresql+asyncpg://localhost:5432/nkp_logistics"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14

    cors_origins: list[str] = ["http://localhost:3000"]

    # Rate limits (slowapi notation)
    tracking_rate_limit: str = "30/minute"
    leads_rate_limit: str = "10/minute"
    auth_rate_limit: str = "20/minute"

    # External providers — empty means the mock implementation is used
    google_maps_api_key: str = ""
    anthropic_api_key: str = ""
    email_provider: str = "mock"  # mock | resend | sendgrid
    email_api_key: str = ""
    email_from: str = "notifications@nkplogistics.example"
    sales_notification_email: str = "sales@nkplogistics.example"


@lru_cache
def get_settings() -> Settings:
    return Settings()
