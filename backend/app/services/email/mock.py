import logging

from app.services.email.base import EmailProvider

logger = logging.getLogger("nkp.email")


class MockEmailProvider(EmailProvider):
    """Logs emails instead of sending them. Used until a real provider key is configured."""

    async def send(self, to: str, subject: str, body: str) -> None:
        logger.info("MOCK EMAIL → to=%s subject=%r\n%s", to, subject, body)
