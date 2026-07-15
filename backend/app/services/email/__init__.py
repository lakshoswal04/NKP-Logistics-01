from app.core.config import get_settings
from app.services.email.base import EmailProvider
from app.services.email.mock import MockEmailProvider


def get_email_provider() -> EmailProvider:
    settings = get_settings()
    # Resend/SendGrid implementations land with real API keys (iteration 2)
    if settings.email_provider != "mock" and settings.email_api_key:
        pass
    return MockEmailProvider()
