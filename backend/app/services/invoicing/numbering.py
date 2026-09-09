"""Sequential, gap-free invoice numbering.

GST rules require invoice numbers to run in an unbroken series per financial
year, so the counter is derived from the highest number already issued in that
year rather than from a row count (which would reuse a number after a deletion).

India's financial year runs April–March, so FY 2026-27 covers 2026-04-01 to
2027-03-31 and is rendered ``2627``.
"""

from __future__ import annotations

import re
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Invoice


def financial_year(on: date) -> str:
    start = on.year if on.month >= 4 else on.year - 1
    return f"{start % 100:02d}{(start + 1) % 100:02d}"


async def next_invoice_number(db: AsyncSession, *, prefix: str = "NKP", on: date | None = None) -> str:
    """Return the next invoice number, e.g. ``NKP/2627/0007``."""
    on = on or date.today()
    fy = financial_year(on)
    series = f"{prefix}/{fy}/"

    numbers = (
        await db.execute(select(Invoice.number).where(Invoice.number.like(f"{series}%")))
    ).scalars().all()

    highest = 0
    pattern = re.compile(rf"^{re.escape(series)}(\d+)$")
    for number in numbers:
        match = pattern.match(number)
        if match:
            highest = max(highest, int(match.group(1)))

    return f"{series}{highest + 1:04d}"
