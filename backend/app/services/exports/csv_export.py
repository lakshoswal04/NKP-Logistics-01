"""CSV export helpers.

Named ``csv_export`` rather than ``csv`` so it cannot shadow the stdlib module
for anything else importing from this package.
"""

from __future__ import annotations

import csv
import io
from collections.abc import Iterable, Sequence
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from fastapi.responses import StreamingResponse

# Excel opens a CSV as the system's legacy encoding unless it sees a UTF-8 BOM,
# which mangles ₹ and any non-ASCII consignee name. Writing the BOM is the only
# reliable way to make these files open correctly for the finance team.
_BOM = "﻿"


def _cell(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "yes" if value else "no"
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Decimal):
        return f"{value:.2f}"
    if hasattr(value, "value") and type(value).__mro__[1].__name__ in {"StrEnum", "Enum", "str"}:
        return str(value.value)
    return str(value)


def rows_to_csv(headers: Sequence[str], rows: Iterable[Sequence[Any]]) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer, lineterminator="\r\n")
    writer.writerow(headers)
    for row in rows:
        writer.writerow([_cell(v) for v in row])
    return _BOM + buffer.getvalue()


def csv_response(filename: str, headers: Sequence[str], rows: Iterable[Sequence[Any]]) -> StreamingResponse:
    body = rows_to_csv(headers, rows)
    return StreamingResponse(
        iter([body]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            # Without this the browser fetch() in the dashboard cannot read the
            # filename back off the response to name the download.
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )
