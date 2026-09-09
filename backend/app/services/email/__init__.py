from functools import lru_cache

from app.core.config import get_settings
from app.services.email.base import Attachment, EmailProvider
from app.services.email.mock import MockEmailProvider
from app.services.email.resend_provider import ResendEmailProvider


@lru_cache
def get_email_provider() -> EmailProvider:
    """Return the configured provider, falling back to the mock.

    Cached because providers are stateless and holding one httpx-configured
    instance beats rebuilding it on every request.
    """
    settings = get_settings()
    if settings.email_provider == "resend" and settings.email_api_key:
        return ResendEmailProvider(settings.email_api_key, settings.email_from)
    return MockEmailProvider()


__all__ = ["Attachment", "EmailProvider", "get_email_provider"]
