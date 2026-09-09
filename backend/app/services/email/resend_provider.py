"""Resend email provider.

Uses httpx directly rather than the ``resend`` SDK: the SDK's calls are
synchronous, and blocking the event loop inside a FastAPI background task would
stall every other request on the worker. The REST surface is a single POST.
"""

from __future__ import annotations

import base64
import logging

import httpx

from app.services.email.base import Attachment, EmailProvider

logger = logging.getLogger("nkp.email")

API_URL = "https://api.resend.com/emails"


class ResendEmailProvider(EmailProvider):
    name = "resend"

    def __init__(self, api_key: str, sender: str) -> None:
        self.api_key = api_key
        self.sender = sender

    async def send(
        self,
        to: str,
        subject: str,
        body: str,
        *,
        html: str | None = None,
        attachments: list[Attachment] | None = None,
        reply_to: str | None = None,
        cc: list[str] | None = None,
    ) -> str | None:
        payload: dict = {
            "from": self.sender,
            "to": [to],
            "subject": subject,
            "text": body,
        }
        if html:
            payload["html"] = html
        if cc:
            payload["cc"] = cc
        if reply_to:
            payload["reply_to"] = reply_to
        if attachments:
            payload["attachments"] = [
                {"filename": name, "content": base64.b64encode(data).decode(), "content_type": mime}
                for name, mime, data in attachments
            ]

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                API_URL,
                json=payload,
                headers={"Authorization": f"Bearer {self.api_key}"},
            )

        if response.status_code >= 400:
            # Deliberately not re-raised: this runs in a background task, where an
            # exception would be swallowed anyway. Log loudly and move on so the
            # invoice's own state change still stands.
            logger.error(
                "Resend rejected message to %s (%s): %s", to, response.status_code, response.text[:400]
            )
            return None

        message_id = response.json().get("id")
        logger.info("Resend accepted message %s to %s", message_id, to)
        return message_id
