"""Email provider interface.

Widened from the original ``send(to, subject, body)`` to carry HTML and
attachments, because the whole point of the invoicing flow is delivering a PDF.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

# (filename, mime type, raw bytes)
Attachment = tuple[str, str, bytes]


class EmailProvider(ABC):
    name: str = "base"

    @abstractmethod
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
        """Deliver one message. Returns a provider message id when there is one."""
