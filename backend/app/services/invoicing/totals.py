"""Money and GST arithmetic for invoices.

Two rules hold everywhere in this codebase:

1. Money is an ``int`` count of **paise**. Rupee floats are only ever produced at
   the very edge, for display. ``0.1 + 0.2 != 0.3`` is not an acceptable failure
   mode for an invoice, and Razorpay's API takes paise regardless.
2. Tax is computed **per line item** and then summed, not applied to a rounded
   subtotal. Lines can legitimately carry different GST rates, and rounding the
   subtotal first shifts the total by a paisa or two on mixed-rate invoices.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import ROUND_HALF_UP, Decimal


def rupees_to_paise(rupees: float | int | str | Decimal) -> int:
    """Convert a rupee amount to integer paise, rounding half-up."""
    return int((Decimal(str(rupees)) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def paise_to_rupees(paise: int) -> Decimal:
    """Exact rupee value of a paise amount, as a Decimal (never a float)."""
    return (Decimal(paise) / 100).quantize(Decimal("0.01"))


def format_inr(paise: int) -> str:
    """Format paise using the Indian digit grouping: 1,23,45,678.90.

    Python's ``format(n, ',')`` groups in thousands, which is wrong for INR past
    five digits — Indian grouping is 2,2,3 from the right after the first three.
    """
    negative = paise < 0
    value = paise_to_rupees(abs(paise))
    whole, _, frac = f"{value:.2f}".partition(".")

    if len(whole) > 3:
        head, tail = whole[:-3], whole[-3:]
        groups = []
        while len(head) > 2:
            groups.insert(0, head[-2:])
            head = head[:-2]
        if head:
            groups.insert(0, head)
        whole = ",".join([*groups, tail])

    return f"{'-' if negative else ''}₹{whole}.{frac}"


@dataclass(frozen=True)
class LineInput:
    """One invoice line, before persistence."""

    description: str
    unit_price_paise: int
    quantity: float = 1.0
    hsn_sac: str | None = None
    unit: str | None = None
    tax_rate: float = 18.0

    @property
    def amount_paise(self) -> int:
        return int(
            (Decimal(self.unit_price_paise) * Decimal(str(self.quantity))).quantize(
                Decimal("1"), rounding=ROUND_HALF_UP
            )
        )


@dataclass(frozen=True)
class Totals:
    subtotal_paise: int = 0
    cgst_paise: int = 0
    sgst_paise: int = 0
    igst_paise: int = 0
    total_paise: int = 0
    is_interstate: bool = False
    line_amounts_paise: list[int] = field(default_factory=list)

    @property
    def tax_paise(self) -> int:
        return self.cgst_paise + self.sgst_paise + self.igst_paise


def _normalise_state(state: str | None) -> str:
    return (state or "").strip().lower()


def compute_totals(
    lines: list[LineInput],
    *,
    seller_state: str,
    place_of_supply: str | None,
) -> Totals:
    """Sum line amounts and apply GST.

    Within one state GST splits into CGST + SGST at half the rate each; across
    states it is a single IGST at the full rate. When the buyer's state is
    unknown we fall back to intra-state, which is the conservative choice for a
    seller registered in ``seller_state``.
    """
    interstate = bool(place_of_supply) and _normalise_state(place_of_supply) != _normalise_state(
        seller_state
    )

    subtotal = 0
    cgst = sgst = igst = 0
    amounts: list[int] = []

    for line in lines:
        amount = line.amount_paise
        amounts.append(amount)
        subtotal += amount

        tax = int(
            (Decimal(amount) * Decimal(str(line.tax_rate)) / 100).quantize(
                Decimal("1"), rounding=ROUND_HALF_UP
            )
        )
        if interstate:
            igst += tax
        else:
            # Halve the line's tax, giving any odd paisa to CGST so the two
            # halves still sum to exactly the line's tax.
            half = tax // 2
            cgst += tax - half
            sgst += half

    return Totals(
        subtotal_paise=subtotal,
        cgst_paise=cgst,
        sgst_paise=sgst,
        igst_paise=igst,
        total_paise=subtotal + cgst + sgst + igst,
        is_interstate=interstate,
        line_amounts_paise=amounts,
    )
