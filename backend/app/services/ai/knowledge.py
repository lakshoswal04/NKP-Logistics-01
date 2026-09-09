"""Support knowledge base and the rules-based baselines built on it.

The corpus mirrors the public support centre, so an answer the triage feature
gives is one a customer could already have found themselves. Retrieval is
keyword overlap rather than embeddings: the corpus is a few dozen entries, and
a vector store for that would be machinery without benefit.
"""

from __future__ import annotations

import re
from datetime import UTC, datetime

KNOWLEDGE: list[dict[str, str]] = [
    {
        "topic": "tracking",
        "q": "How do I track my consignment?",
        "a": "Enter the AWB, order ID or LRN on the Track page. Tracking goes live once the "
             "consignment is manifested to the delivery partner, usually within a few hours of "
             "dispatch from the fulfilment centre.",
    },
    {
        "topic": "tracking",
        "q": "Tracking has not updated for two days.",
        "a": "Scans update when a consignment changes hands or location, so a stationary status "
             "usually means line-haul between hubs rather than a lost consignment. Past 48 hours "
             "with no scan, we trace it with the carrier.",
    },
    {
        "topic": "delivery",
        "q": "Why is my delivery delayed?",
        "a": "The usual causes are weather or road closures on the lane, an incomplete or "
             "unreachable delivery address, and seasonal volume peaks. Where the cause is visible "
             "on the consignment it appears on the tracking timeline.",
    },
    {
        "topic": "delivery",
        "q": "Can I change the delivery address after dispatch?",
        "a": "Within the same city, usually yes, provided the consignment has not gone out for "
             "delivery. A different city means it must return to the fulfilment centre first.",
    },
    {
        "topic": "delivery",
        "q": "I missed the delivery.",
        "a": "A failed attempt is re-attempted the next working day. Raise a query with the AWB "
             "if you need a specific date or a different address.",
    },
    {
        "topic": "billing",
        "q": "My GSTIN is missing or wrong on an invoice.",
        "a": "An issued invoice cannot be edited in place. We cancel it and issue a corrected one "
             "against a credit note, which is what GST rules require. Raise a billing query with "
             "the invoice number and the correct GSTIN.",
    },
    {
        "topic": "billing",
        "q": "How is warehousing billed?",
        "a": "Monthly in arrears, itemised into storage on space actually occupied, handling per "
             "order or pallet, and any value-added work. Every line carries its HSN/SAC code.",
    },
    {
        "topic": "billing",
        "q": "What payment methods do you accept and when is payment due?",
        "a": "UPI, net banking, debit or credit card through the payment link on the invoice, or "
             "NEFT/RTGS to the account printed on it. Payment is due fifteen days from the "
             "invoice date unless the contract says otherwise.",
    },
    {
        "topic": "inventory",
        "q": "How quickly is inbound stock available to sell?",
        "a": "Counted, put away and live in the system within 24 hours of unloading for standard "
             "cartons. Items needing inspection, kitting or re-labelling take longer, per the "
             "service schedule.",
    },
    {
        "topic": "inventory",
        "q": "What is the dispatch cut-off?",
        "a": "Orders received at the fulfilment centre before 6:00 pm are picked, packed and "
             "handed to the delivery partner the same day. Later orders go on the next working "
             "day's first manifest.",
    },
    {
        "topic": "inventory",
        "q": "There is a discrepancy between my stock and yours.",
        "a": "Raise an inventory query with the SKU and the quantity you expect. We reconcile "
             "against inbound GRNs, dispatches and returns, and share the cycle-count history "
             "for that location.",
    },
    {
        "topic": "damage",
        "q": "Cartons arrived damaged or short.",
        "a": "Discrepancies found at inbound are photographed and raised the same day. Send the "
             "GRN number and we will share the evidence and raise a damage note.",
    },
    {
        "topic": "account",
        "q": "How long does onboarding take?",
        "a": "Typically two to three weeks from signed agreement to first dispatch: a week for "
             "commercials and space allocation, a week for integration and master data, then a "
             "few days of parallel running.",
    },
    {
        "topic": "account",
        "q": "Do you integrate with my storefront or ERP?",
        "a": "Shopify, WooCommerce and the major Indian marketplaces have prebuilt connectors. "
             "Anything else integrates over our REST API, with orders, inventory and dispatch "
             "status syncing both ways.",
    },
    {
        "topic": "fraud",
        "q": "Someone asked me for an OTP to release a delivery.",
        "a": "That is a scam. NKP never asks for an OTP, UPI PIN or card details to release a "
             "consignment, and never sends payment links over SMS or WhatsApp. Do not share "
             "anything and report it to support@nkplogistics.in.",
    },
]

_STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "my", "i", "we", "you", "your", "to", "for",
    "of", "on", "in", "it", "and", "or", "but", "with", "have", "has", "do", "does", "did",
    "can", "could", "would", "should", "what", "when", "why", "how", "there", "this", "that",
    "not", "no", "please", "am", "be", "been", "get", "got", "any", "from", "at", "as", "by",
}


def _tokens(text: str) -> set[str]:
    return {w for w in re.findall(r"[a-z0-9']+", text.lower()) if w not in _STOPWORDS and len(w) > 2}


def retrieve(query: str, limit: int = 3) -> list[dict]:
    """Rank knowledge entries by token overlap with the query."""
    q = _tokens(query)
    if not q:
        return []
    scored = []
    for entry in KNOWLEDGE:
        overlap = len(q & _tokens(f"{entry['q']} {entry['a']} {entry['topic']}"))
        if overlap:
            scored.append((overlap, entry))
    scored.sort(key=lambda pair: -pair[0])
    return [entry for _score, entry in scored[:limit]]


# "missing" is deliberately absent: it fires on "the GSTIN is missing", which is
# an ordinary billing correction, not an escalation. The phrases below are the
# ones that actually warrant jumping the queue.
_URGENT = ("urgent", "asap", "immediately", "escalate", "complaint", "legal", "refund",
           "lost", "stolen", "damaged", "gone missing", "never arrived", "not received")

# Unambiguous fraud words — one of these alone is enough.
_FRAUD_WORDS = ("otp", "scam", "fraud", "phishing", "impersonat", "upi pin", "payment link")

# The phishing pattern is a *combination*, not a keyword: an unsolicited inbound
# contact, plus a demand for money or a link, in a delivery context. Matching on
# single words misses "I got an SMS saying my delivery failed, pay ₹25 on a link"
# — which is the exact scam customers actually report.
_FRAUD_CHANNEL = ("sms", "whatsapp", "text message", "called", "call from", "message from", "email from")
_FRAUD_LURE = ("link", "pay ", "paid", "₹", "rs.", "rupees", "click", "verify", "confirm your")


def _looks_like_phishing(lower: str) -> bool:
    if any(word in lower for word in _FRAUD_WORDS):
        return True
    return any(c in lower for c in _FRAUD_CHANNEL) and any(x in lower for x in _FRAUD_LURE)


_CATEGORY_HINTS = (
    ("Billing or invoice", ("invoice", "gst", "gstin", "bill", "payment", "paid", "charge", "credit")),
    ("Damaged or short receipt", ("damage", "broken", "crushed", "leak", "short receipt")),
    ("Inventory discrepancy",
     ("stock", "inventory", "sku", "count", "discrepan", "grn", "units", "quantity",
      "does not match", "doesn't match", "mismatch")),
    ("Delivery issue", ("deliver", "address", "attempt", "rto", "return", "reschedul")),
    ("Shipment status", ("track", "awb", "lrn", "consignment", "status", "where", "delay")),
    ("Integration or API", ("api", "integrat", "webhook", "shopify", "woocommerce", "sync")),
    ("New business enquiry", ("quote", "pricing", "onboard", "proposal", "interested", "rates")),
)


def baseline_triage(message: str, matches: list[dict]) -> dict:
    """Rules-based triage used when no model is configured."""
    lower = message.lower()

    # Fraud is decided before anything else: a scam report usually also mentions
    # a delivery or a payment, and filing it as either buries the one message
    # that needs an immediate, specific answer.
    if _looks_like_phishing(lower):
        category = "Suspected fraud or phishing"
    else:
        category = "Something else"
        for label, hints in _CATEGORY_HINTS:
            if any(hint in lower for hint in hints):
                category = label
                break

    urgency = "high" if any(word in lower for word in _URGENT) else "normal"
    # Anything smelling of a phishing attempt is always high: the cost of a slow
    # reply is a customer who has already handed over a credential.
    if category == "Suspected fraud or phishing":
        urgency = "high"

    first = matches[0] if matches else None
    needs_human = first is None

    if first:
        reply = (
            f"Thanks for getting in touch.\n\n{first['a']}\n\n"
            "If that does not resolve it, reply to this email with your AWB or invoice number "
            "and we will pick it up directly."
        )
    else:
        reply = (
            "Thanks for getting in touch. This one needs a person to look at properly — a "
            "specialist from the relevant desk will come back to you within one working day. "
            "If you have an AWB or invoice number to hand, replying with it will speed things up."
        )

    summary = " ".join(message.split())[:160]
    if len(" ".join(message.split())) > 160:
        summary += "…"

    return {
        "category": category,
        "urgency": urgency,
        "summary": summary,
        "suggested_reply": reply,
        "needs_human": needs_human,
        "matched_topics": [m["q"] for m in matches],
    }


def baseline_narrative(shipment, scans: list) -> dict:
    """Rules-based delay communication used when no model is configured."""
    lane = f"{shipment.origin_city} to {shipment.destination_city}"
    latest = scans[-1] if scans else None
    where = (latest.location if latest and latest.location else "in transit") if latest else "in transit"
    status = shipment.status.value

    hours = None
    if shipment.pickup_date:
        hours = round((datetime.now(UTC) - shipment.pickup_date).total_seconds() / 3600)

    if status == "delayed":
        headline = f"{shipment.tracking_id} is running behind on the {lane} lane"
        explanation = (
            f"The consignment was last scanned {where.lower()}"
            + (f", {hours} hours after pickup" if hours else "")
            + ". It has been flagged as delayed, which means it has missed its planned "
            "checkpoint but remains in our network and is moving."
        )
        next_step = (
            "The lane controller is re-planning it onto the next available line-haul departure "
            "and will confirm a revised arrival once it is loaded."
        )
        eta_note = "A revised ETA is confirmed once the consignment is scanned onto its next leg."
    elif status == "failed":
        headline = f"Delivery of {shipment.tracking_id} could not be completed"
        explanation = (
            f"The delivery attempt on the {lane} lane was unsuccessful and the consignment is "
            f"currently held {where.lower()}."
        )
        next_step = (
            "A second attempt is scheduled for the next working day. Confirming the contact "
            "number and a landmark on the address materially improves the odds of it landing."
        )
        eta_note = "The re-attempt date is confirmed once the consignment is back on a delivery run."
    else:
        headline = f"{shipment.tracking_id} is moving normally on the {lane} lane"
        explanation = (
            f"The consignment was last scanned {where.lower()}"
            + (f", {hours} hours after pickup" if hours else "")
            + ", and is currently "
            + status.replace("_", " ")
            + "."
        )
        next_step = "No action is needed — it is running to plan."
        eta_note = (
            f"Expected {shipment.eta:%d %b, %H:%M}."
            if shipment.eta
            else "An ETA is set once it is manifested."
        )

    email_body = (
        f"Hello,\n\n{explanation}\n\n{next_step}\n\n{eta_note}\n\n"
        f"You can follow it live at any time using reference {shipment.tracking_id}.\n\n"
        "NKP Logistics"
    )

    return {
        "tracking_id": shipment.tracking_id,
        "status": status,
        "headline": headline,
        "explanation": explanation,
        "next_step": next_step,
        "revised_eta_note": eta_note,
        "email_subject": f"Update on your consignment {shipment.tracking_id}",
        "email_body": email_body,
    }
