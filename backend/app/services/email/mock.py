"""Mock email provider — writes to a local outbox instead of sending.

Every message is logged and also written to ``var/outbox/`` as a viewable HTML
file plus a JSON sidecar, with attachments saved alongside. That makes the
no-credentials path genuinely inspectable: you can open the exact invoice email
the customer would have received, rather than trusting a log line.
"""

from __future__ import annotations

import json
import logging
import re
from datetime import UTC, datetime
from pathlib import Path

from app.services.email.base import Attachment, EmailProvider

logger = logging.getLogger("nkp.email")

OUTBOX = Path(__file__).resolve().parents[3] / "var" / "outbox"


def _slug(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]+", "-", value).strip("-")[:60] or "message"


class MockEmailProvider(EmailProvider):
    name = "mock"

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
        stamp = datetime.now(UTC)
        message_id = f"mock-{stamp:%Y%m%d-%H%M%S-%f}"
        folder = OUTBOX / f"{stamp:%Y%m%d-%H%M%S}-{_slug(subject)}"

        try:
            folder.mkdir(parents=True, exist_ok=True)
            (folder / "message.html").write_text(
                html or f"<pre>{body}</pre>", encoding="utf-8"
            )
            (folder / "message.txt").write_text(body, encoding="utf-8")
            (folder / "meta.json").write_text(
                json.dumps(
                    {
                        "to": to,
                        "cc": cc or [],
                        "subject": subject,
                        "reply_to": reply_to,
                        "sent_at": stamp.isoformat(),
                        "attachments": [name for name, _, _ in (attachments or [])],
                    },
                    indent=2,
                ),
                encoding="utf-8",
            )
            for name, _mime, data in attachments or []:
                (folder / _slug(name)).write_bytes(data)
        except OSError as exc:
            # A read-only filesystem must not break the request the email came from.
            logger.warning("Could not write mock outbox: %s", exc)

        logger.info(
            "MOCK EMAIL → to=%s subject=%r attachments=%s (saved to %s)",
            to,
            subject,
            [name for name, _, _ in (attachments or [])],
            folder,
        )
        return message_id
