"""GST invoice PDF rendering.

ReportLab rather than an HTML-to-PDF engine: WeasyPrint and wkhtmltopdf both
need native Cairo/Pango/Qt libraries, which turns "pip install" into a per-OS
support problem. ReportLab is pure Python and ships a wheel everywhere.

Layout follows the fields a compliant Indian tax invoice must show: both GSTINs,
place of supply, HSN/SAC per line, the tax split, and the amount in words.
"""

from __future__ import annotations

import io
from decimal import Decimal
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont as _TTFont
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.core.config import get_settings
from app.models import Invoice
from app.services.invoicing.totals import format_inr

# Helvetica and the rest of the PDF standard-14 fonts have no U+20B9 glyph, so
# a rupee sign renders as a hollow box. Noto Sans (OFL) is embedded instead —
# committed to the repo rather than taken from the OS, so a Linux container
# produces byte-identical output to a developer's Mac.
_FONT_DIR = Path(__file__).parent / "fonts"
FONT_REGULAR = "NotoSans"
FONT_BOLD = "NotoSans-Bold"


def _register_fonts() -> None:
    if FONT_REGULAR in pdfmetrics.getRegisteredFontNames():
        return
    pdfmetrics.registerFont(_TTFont(FONT_REGULAR, str(_FONT_DIR / "NotoSans-Regular.ttf")))
    pdfmetrics.registerFont(_TTFont(FONT_BOLD, str(_FONT_DIR / "NotoSans-Bold.ttf")))
    pdfmetrics.registerFontFamily(FONT_REGULAR, normal=FONT_REGULAR, bold=FONT_BOLD)


INK = colors.HexColor("#101014")
BRAND = colors.HexColor("#E1252B")
MIST = colors.HexColor("#F4F5F7")
MUTED = colors.HexColor("#7A7A88")
LINE = colors.HexColor("#DDDDE3")

_ONES = [
    "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
    "eighteen", "nineteen",
]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]


def _two_digits(n: int) -> str:
    if n < 20:
        return _ONES[n]
    tens, ones = divmod(n, 10)
    return _TENS[tens] + (f"-{_ONES[ones]}" if ones else "")


def _three_digits(n: int) -> str:
    hundreds, rest = divmod(n, 100)
    parts = []
    if hundreds:
        parts.append(f"{_ONES[hundreds]} hundred")
    if rest:
        parts.append(_two_digits(rest))
    return " ".join(parts)


def amount_in_words(paise: int) -> str:
    """Render paise in the Indian scale — crore / lakh / thousand.

    A tax invoice has to state the amount in words, and the Indian scale is not
    the same as the short scale, so this cannot be delegated to a generic
    num2words call with default settings.
    """
    rupees = int(paise // 100)
    remainder = int(paise % 100)

    if rupees == 0:
        words = "zero"
    else:
        chunks: list[str] = []
        crore, rupees_rest = divmod(rupees, 10_000_000)
        lakh, rupees_rest = divmod(rupees_rest, 100_000)
        thousand, hundreds = divmod(rupees_rest, 1_000)
        if crore:
            chunks.append(f"{_three_digits(crore) if crore >= 100 else _two_digits(crore)} crore")
        if lakh:
            chunks.append(f"{_two_digits(lakh)} lakh")
        if thousand:
            chunks.append(f"{_two_digits(thousand)} thousand")
        if hundreds:
            chunks.append(_three_digits(hundreds))
        words = " ".join(chunks)

    text = f"Rupees {words}"
    if remainder:
        text += f" and {_two_digits(remainder)} paise"
    return text.strip().capitalize() + " only"


def _styles() -> dict[str, ParagraphStyle]:
    _register_fonts()
    base = getSampleStyleSheet()
    return {
        "h1": ParagraphStyle(
            "h1", parent=base["Normal"], fontName=FONT_BOLD, fontSize=18,
            textColor=INK, leading=22,
        ),
        "label": ParagraphStyle(
            "label", parent=base["Normal"], fontName=FONT_BOLD, fontSize=7,
            textColor=MUTED, leading=10, spaceAfter=2,
        ),
        "body": ParagraphStyle(
            "body", parent=base["Normal"], fontName=FONT_REGULAR, fontSize=8.5,
            textColor=INK, leading=12,
        ),
        "bodyBold": ParagraphStyle(
            "bodyBold", parent=base["Normal"], fontName=FONT_BOLD, fontSize=8.5,
            textColor=INK, leading=12,
        ),
        "small": ParagraphStyle(
            "small", parent=base["Normal"], fontName=FONT_REGULAR, fontSize=7.5,
            textColor=MUTED, leading=10,
        ),
        "cell": ParagraphStyle(
            "cell", parent=base["Normal"], fontName=FONT_REGULAR, fontSize=8,
            textColor=INK, leading=11,
        ),
        "cellRight": ParagraphStyle(
            "cellRight", parent=base["Normal"], fontName=FONT_REGULAR, fontSize=8,
            textColor=INK, leading=11, alignment=TA_RIGHT,
        ),
        # A TableStyle TEXTCOLOR does not reach inside a Paragraph — the
        # Paragraph's own style wins — so header cells need their own white style
        # or they render black-on-black.
        "th": ParagraphStyle(
            "th", parent=base["Normal"], fontName=FONT_BOLD, fontSize=8,
            textColor=colors.white, leading=11,
        ),
        "thRight": ParagraphStyle(
            "thRight", parent=base["Normal"], fontName=FONT_BOLD, fontSize=8,
            textColor=colors.white, leading=11, alignment=TA_RIGHT,
        ),
    }


def render_invoice_pdf(invoice: Invoice) -> bytes:
    """Render an invoice to PDF bytes.

    The invoice must have ``line_items`` already loaded — this function does no
    I/O of its own so it stays safe to call from a background task.
    """
    settings = get_settings()
    st = _styles()
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=14 * mm,
        bottomMargin=16 * mm,
        title=f"Invoice {invoice.number}",
        author=settings.seller_legal_name,
        subject=f"Tax invoice {invoice.number}",
    )

    story: list = []

    # --- Masthead --------------------------------------------------------
    is_draft = invoice.status.value == "draft"
    heading = "TAX INVOICE" if not is_draft else "PROFORMA / DRAFT"
    masthead = Table(
        [[
            Paragraph('<font color="#E1252B">NKP</font> LOGISTICS', st["h1"]),
            Paragraph(
                f'<font size="13"><b>{heading}</b></font><br/>'
                f'<font size="8" color="#7A7A88">{invoice.number}</font>',
                ParagraphStyle("r", parent=st["body"], alignment=TA_RIGHT, leading=16),
            ),
        ]],
        colWidths=[95 * mm, 83 * mm],
    )
    masthead.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("LINEBELOW", (0, 0), (-1, 0), 2, BRAND),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
    ]))
    story += [masthead, Spacer(1, 8)]

    # --- Seller / buyer / meta ------------------------------------------
    seller = (
        f'<b>{settings.seller_legal_name}</b><br/>{settings.seller_address}<br/>'
        f'GSTIN: {settings.seller_gstin}<br/>PAN: {settings.seller_pan}<br/>'
        f'{settings.seller_email} · {settings.seller_phone}'
    )
    buyer_bits = [f"<b>{invoice.bill_to_name}</b>"]
    if invoice.bill_to_address:
        buyer_bits.append(invoice.bill_to_address)
    if invoice.bill_to_gstin:
        buyer_bits.append(f"GSTIN: {invoice.bill_to_gstin}")
    if invoice.bill_to_email:
        buyer_bits.append(invoice.bill_to_email)
    buyer = "<br/>".join(buyer_bits)

    meta = (
        f'<b>Invoice date</b>  {invoice.issue_date:%d %b %Y}<br/>'
        f'<b>Due date</b>  {invoice.due_date:%d %b %Y}<br/>'
        f'<b>Place of supply</b>  {invoice.place_of_supply or settings.seller_state}<br/>'
        f'<b>Status</b>  {invoice.status.value.upper()}'
    )

    parties = Table(
        [[
            Paragraph("FROM", st["label"]),
            Paragraph("BILL TO", st["label"]),
            Paragraph("DETAILS", st["label"]),
        ], [
            Paragraph(seller, st["body"]),
            Paragraph(buyer, st["body"]),
            Paragraph(meta, st["body"]),
        ]],
        colWidths=[62 * mm, 58 * mm, 58 * mm],
    )
    parties.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 1), (-1, 1), 2),
    ]))
    story += [parties, Spacer(1, 12)]

    # --- Line items ------------------------------------------------------
    header = ["#", "Description", "HSN/SAC", "Qty", "Rate", "Amount"]
    rows: list[list] = [
        [Paragraph(h, st["th"] if i < 3 else st["thRight"]) for i, h in enumerate(header)]
    ]

    for i, item in enumerate(invoice.line_items, start=1):
        qty = Decimal(str(item.quantity))
        qty_text = f"{qty.normalize():f}" + (f" {item.unit}" if item.unit else "")
        rows.append([
            Paragraph(str(i), st["cell"]),
            Paragraph(item.description, st["cell"]),
            Paragraph(item.hsn_sac or "—", st["cell"]),
            Paragraph(qty_text, st["cellRight"]),
            Paragraph(format_inr(item.unit_price_paise), st["cellRight"]),
            Paragraph(format_inr(item.amount_paise), st["cellRight"]),
        ])

    table = Table(rows, colWidths=[8 * mm, 74 * mm, 20 * mm, 22 * mm, 27 * mm, 27 * mm], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 1), (-1, -1), 0.4, LINE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, MIST]),
    ]))
    story += [table, Spacer(1, 10)]

    # --- Totals ----------------------------------------------------------
    total_rows = [["Subtotal", format_inr(invoice.subtotal_paise)]]
    if invoice.igst_paise:
        total_rows.append(["IGST", format_inr(invoice.igst_paise)])
    else:
        total_rows.append(["CGST", format_inr(invoice.cgst_paise)])
        total_rows.append(["SGST", format_inr(invoice.sgst_paise)])
    total_rows.append(["Total", format_inr(invoice.total_paise)])
    if invoice.amount_paid_paise:
        total_rows.append(["Paid", f"-{format_inr(invoice.amount_paid_paise)}"])
        total_rows.append(["Balance due", format_inr(invoice.balance_paise)])

    totals = Table(
        [[Paragraph(label, st["cell"]), Paragraph(value, st["cellRight"])] for label, value in total_rows],
        colWidths=[38 * mm, 34 * mm],
    )
    # Subtotal, then either IGST (1 row) or CGST+SGST (2 rows), then Total.
    total_row_index = 2 if invoice.igst_paise else 3
    totals.setStyle(TableStyle([
        ("LINEABOVE", (0, total_row_index), (-1, total_row_index), 0.8, INK),
        ("FONTNAME", (0, total_row_index), (-1, total_row_index), FONT_BOLD),
        ("TEXTCOLOR", (0, total_row_index), (-1, total_row_index), INK),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))

    words = Paragraph(
        f'<font color="#7A7A88" size="7"><b>AMOUNT IN WORDS</b></font><br/>'
        f'{amount_in_words(invoice.total_paise)}',
        st["body"],
    )
    summary = Table([[words, totals]], colWidths=[104 * mm, 74 * mm])
    summary.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story += [summary, Spacer(1, 14)]

    # --- Payment details + notes ----------------------------------------
    footer_left = (
        f'<font color="#7A7A88" size="7"><b>PAYMENT DETAILS</b></font><br/>'
        f'{settings.seller_bank_name}<br/>'
        f'A/C {settings.seller_bank_account} · IFSC {settings.seller_bank_ifsc}'
    )
    notes = invoice.notes or f"Payment due within {settings.invoice_terms_days} days of the invoice date."
    footer_right = f'<font color="#7A7A88" size="7"><b>NOTES</b></font><br/>{notes}'

    footer = Table([[Paragraph(footer_left, st["body"]), Paragraph(footer_right, st["body"])]],
                   colWidths=[89 * mm, 89 * mm])
    footer.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("LINEABOVE", (0, 0), (-1, 0), 0.4, LINE),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
    ]))

    disclaimer = Paragraph(
        f'{settings.seller_legal_name} · CIN {settings.seller_cin} · '
        f'This is a computer-generated invoice and does not require a signature.',
        st["small"],
    )
    story += [KeepTogether([footer, Spacer(1, 10), disclaimer])]

    doc.build(story)
    return buffer.getvalue()
