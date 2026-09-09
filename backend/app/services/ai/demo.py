"""Deterministic fallback used when no Gemini key is configured.

This is not a mock that returns canned strings. It runs the *same* tools
against the *same* live database as the model-backed path — it just picks the
tool by keyword instead of by reasoning, and formats the answer from a template
instead of generating prose.

The result is that the AI tab is genuinely usable with zero credentials, every
number on screen is real, and the UI can honestly label the mode rather than
pretending a model is in the loop.
"""

from __future__ import annotations

import re
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.services.ai import tools

TRACKING_RE = re.compile(r"\b([A-Z]{3}\d{4}[A-Z0-9]{4})\b", re.IGNORECASE)

SUGGESTIONS = [
    "How many consignments are in transit right now?",
    "Which consignments are delayed?",
    "What is outstanding on receivables?",
    "Where is NKP2026A1B2?",
    "Show me the overdue invoices",
]


async def answer(db: AsyncSession, user: User, question: str) -> dict:
    """Route a question to a tool and format the result."""
    q = question.strip().lower()
    used: list[str] = []

    match = TRACKING_RE.search(question)
    if match:
        used.append("lookup_shipment")
        result = await tools.lookup_shipment(db, user, tracking_id=match.group(1))
        return {"text": _format_shipment(result), "tools_used": used, "data": result}

    if any(word in q for word in ("overdue", "outstanding", "receivable", "owed", "unpaid")):
        used.append("receivables_summary")
        result = await tools.receivables_summary(db, user)
        return {"text": _format_receivables(result), "tools_used": used, "data": result}

    if "invoice" in q or "billing" in q:
        status = next(
            (s for s in ("draft", "sent", "paid", "overdue", "void") if s in q), None
        )
        used.append("list_invoices")
        result = await tools.list_invoices(db, user, status=status, limit=8)
        return {"text": _format_invoices(result, status), "tools_used": used, "data": result}

    if any(word in q for word in ("delayed", "late", "exception", "stuck", "failed")):
        used.append("search_shipments")
        result = await tools.search_shipments(db, user, status="delayed", limit=10)
        return {"text": _format_shipment_list(result, "delayed"), "tools_used": used, "data": result}

    for status, words in (
        ("in_transit", ("in transit", "moving", "on the road")),
        ("out_for_delivery", ("out for delivery", "delivering")),
        ("delivered", ("delivered", "completed")),
        ("booked", ("booked", "not picked")),
    ):
        if any(word in q for word in words):
            used.append("search_shipments")
            result = await tools.search_shipments(db, user, status=status, limit=10)
            return {
                "text": _format_shipment_list(result, status.replace("_", " ")),
                "tools_used": used,
                "data": result,
            }

    if "ticket" in q or "support" in q or "complaint" in q:
        used.append("open_support_tickets")
        result = await tools.open_support_tickets(db, user, limit=8)
        return {"text": _format_tickets(result), "tools_used": used, "data": result}

    used.append("shipment_status_summary")
    result = await tools.shipment_status_summary(db, user)
    return {"text": _format_summary(result), "tools_used": used, "data": result}


# --------------------------------------------------------------------------
# Formatters
# --------------------------------------------------------------------------


def _format_shipment(result: dict) -> str:
    if not result.get("found"):
        return result.get("message", "No consignment found with that reference.")

    lines = [
        f"**{result['tracking_id']}** is **{result['status'].replace('_', ' ')}** "
        f"on the {result['lane']} lane."
    ]
    if result.get("eta"):
        eta = datetime.fromisoformat(result["eta"])
        lines.append(f"Expected {eta.astimezone(UTC):%d %b, %H:%M} UTC.")
    if result.get("driver"):
        lines.append(f"Carried by {result['driver']} on a {result.get('vehicle') or 'vehicle'}.")
    scans = result.get("scans") or []
    if scans:
        latest = scans[-1]
        lines.append(
            f"Latest scan: {latest['description']} at {latest['location'] or 'en route'}."
        )
    return " ".join(lines)


def _format_shipment_list(result: dict, label: str) -> str:
    rows = result.get("shipments", [])
    total = result.get("total_matching", len(rows))
    if not rows:
        return f"Nothing is currently {label}. The network is running to plan."

    head = f"**{total}** consignment{'s' if total != 1 else ''} {label}:\n\n"
    table = "| Reference | Lane | Driver |\n| --- | --- | --- |\n"
    table += "\n".join(
        f"| {r['tracking_id']} | {r['lane']} | {r.get('driver') or '—'} |" for r in rows
    )
    return head + table


def _format_summary(result: dict) -> str:
    by_status = result.get("by_status", {})
    if not by_status:
        return "There are no consignments on the network yet."
    parts = ", ".join(
        f"{count} {status.replace('_', ' ')}"
        for status, count in sorted(by_status.items(), key=lambda kv: -kv[1])
    )
    return f"**{result['total']}** consignments on the network: {parts}."


def _format_receivables(result: dict) -> str:
    if result["open_invoice_count"] == 0:
        return "Nothing outstanding — every issued invoice has been paid."
    text = (
        f"**{result['outstanding']}** outstanding across "
        f"{result['open_invoice_count']} invoice"
        f"{'s' if result['open_invoice_count'] != 1 else ''}."
    )
    if result["overdue_invoice_count"]:
        text += (
            f" Of that, **{result['overdue']}** is overdue across "
            f"{result['overdue_invoice_count']} invoice"
            f"{'s' if result['overdue_invoice_count'] != 1 else ''}"
        )
        if result.get("oldest_overdue"):
            text += f", the oldest due {result['oldest_overdue']}"
        text += "."
    return text


def _format_invoices(result: dict, status: str | None) -> str:
    rows = result.get("invoices", [])
    if not rows:
        return f"No {status or ''} invoices found.".replace("  ", " ").strip()
    head = f"{len(rows)} {status + ' ' if status else ''}invoice{'s' if len(rows) != 1 else ''}:\n\n"
    table = "| Number | Status | Due | Balance |\n| --- | --- | --- | --- |\n"
    table += "\n".join(
        f"| {r['number']} | {r['status']} | {r['due_date']} | {r['balance_due']} |" for r in rows
    )
    return head + table


def _format_tickets(result: dict) -> str:
    if result.get("error"):
        return result["error"]
    rows = result.get("tickets", [])
    if not rows:
        return "No open support tickets."
    head = f"{len(rows)} open ticket{'s' if len(rows) != 1 else ''}:\n\n"
    table = "| Reference | Category | Subject |\n| --- | --- | --- |\n"
    table += "\n".join(f"| {r['ticket_id']} | {r['category']} | {r['subject']} |" for r in rows)
    return head + table


# --------------------------------------------------------------------------
# Structured features
# --------------------------------------------------------------------------

_PINCODE_CITY = {
    "400": "Mumbai", "401": "Thane", "410": "Navi Mumbai", "411": "Pune",
    "560": "Bengaluru", "562": "Bengaluru Rural", "600": "Chennai", "500": "Hyderabad",
    "110": "New Delhi", "121": "Faridabad", "122": "Gurugram", "201": "Noida",
    "380": "Ahmedabad", "395": "Surat", "700": "Kolkata", "302": "Jaipur",
}

_SERVICEABLE_PREFIXES = tuple(_PINCODE_CITY)


def address_intelligence(raw: str) -> dict:
    """Rules-based address parse: pincode extraction plus completeness heuristics."""
    text = " ".join(raw.split())
    pin_match = re.search(r"\b(\d{6})\b", text)
    pincode = pin_match.group(1) if pin_match else None
    phone_match = re.search(r"\b((?:\+?91[\s-]?)?[6-9]\d{9})\b", text)

    issues: list[str] = []
    inferred_city = None
    if pincode:
        inferred_city = _PINCODE_CITY.get(pincode[:3])
        if inferred_city is None:
            issues.append(f"Pincode {pincode} is outside our mapped delivery regions.")
    else:
        issues.append("No 6-digit pincode found — this is the single biggest cause of RTO.")

    has_unit = bool(re.search(r"\b(flat|plot|shop|unit|no\.?|house|#)\s*[\w/-]+", text, re.I))
    if not has_unit:
        issues.append("No flat, plot or unit number — the rider will have nothing to ask for.")
    if not phone_match:
        issues.append("No contact number — a failed attempt cannot be re-attempted the same day.")
    if len(text) < 25:
        issues.append("Address is very short; it is unlikely to be locatable on the ground.")

    risk = min(0.05 + 0.22 * len(issues), 0.95)
    confidence = max(0.95 - 0.2 * len(issues), 0.2)

    return {
        "normalised": {
            "line1": text.split(",")[0].strip() or None,
            "locality": (text.split(",")[1].strip() if text.count(",") >= 1 else None),
            "city": inferred_city,
            "state": None,
            "pincode": pincode,
            "phone": phone_match.group(1) if phone_match else None,
        },
        "serviceable": bool(pincode and pincode.startswith(_SERVICEABLE_PREFIXES)),
        "confidence": round(confidence, 2),
        "rto_risk": round(risk, 2),
        "risk_band": "high" if risk >= 0.5 else "medium" if risk >= 0.28 else "low",
        "issues": issues or ["No structural problems found in this address."],
        "reasoning": (
            "Scored from address completeness: pincode presence and mapping, a unit or plot "
            "number, and a reachable phone number. Each missing element materially raises the "
            "chance of a failed first attempt."
        ),
    }


_FCS = [
    ("Bhiwandi (Mumbai)", "west", {"mumbai", "pune", "thane", "surat", "ahmedabad", "nagpur", "indore"}),
    ("Hoskote (Bengaluru)", "south",
     {"bengaluru", "bangalore", "hyderabad", "coimbatore", "kochi", "mysuru"}),
    ("Gurugram (Delhi NCR)", "north",
     {"delhi", "new delhi", "gurugram", "noida", "jaipur", "lucknow", "chandigarh"}),
    ("Sriperumbudur (Chennai)", "south-east", {"chennai", "coimbatore", "visakhapatnam", "madurai"}),
    ("Kolkata", "east", {"kolkata", "guwahati", "patna", "bhubaneswar", "ranchi"}),
]


def placement_advice(distribution: list[dict]) -> dict:
    """Allocate order volume to the nearest FC and recommend a split."""
    totals: dict[str, int] = {}
    unmapped = 0
    grand = 0

    for row in distribution:
        city = str(row.get("city", "")).strip().lower()
        orders = int(row.get("orders", 0) or 0)
        grand += orders
        placed = False
        for name, _region, cities in _FCS:
            if city in cities:
                totals[name] = totals.get(name, 0) + orders
                placed = True
                break
        if not placed:
            unmapped += orders

    if grand == 0:
        return {"error": "No order volume supplied."}

    ranked = sorted(totals.items(), key=lambda kv: -kv[1])
    # Recommend the fewest FCs covering ~85% of volume — beyond that the marginal
    # FC costs more in fixed rent and split safety stock than it saves in freight.
    recommended: list[dict] = []
    running = 0
    for name, orders in ranked:
        share = orders / grand
        recommended.append(
            {
                "fulfilment_centre": name,
                "orders": orders,
                "share_pct": round(share * 100, 1),
                "rationale": f"Serves {orders:,} of {grand:,} monthly orders ({share * 100:.0f}%).",
            }
        )
        running += orders
        if running / grand >= 0.85:
            break

    return {
        "recommended": recommended,
        "total_orders": grand,
        "coverage_pct": round(running / grand * 100, 1),
        "unmapped_orders": unmapped,
        "summary": (
            f"{len(recommended)} fulfilment centre{'s' if len(recommended) != 1 else ''} covers "
            f"{running / grand * 100:.0f}% of your {grand:,} monthly orders. "
            + (
                f"{unmapped:,} orders fall outside our mapped city list and would ship long-haul."
                if unmapped
                else "Every city in your distribution maps to a centre."
            )
        ),
        "reasoning": (
            "Volume is assigned to the nearest operating centre, then centres are added in "
            "descending order until 85% of orders are covered. Past that point an additional "
            "centre usually costs more in fixed rent and duplicated safety stock than it saves "
            "in freight and transit time."
        ),
    }
