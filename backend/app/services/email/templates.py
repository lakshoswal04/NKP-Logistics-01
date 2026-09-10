"""Transactional email rendering.

Templates are inline Jinja strings rather than files on disk: they are small,
they belong with the code that sends them, and it keeps the Docker image from
needing a template directory copied in at the right path.

HTML email constraints drive the markup — table-based layout, inline styles, no
external stylesheets, no web fonts. Gmail strips <style> blocks in some clients
and Outlook ignores most modern CSS, so anything clever here degrades badly.
"""

from __future__ import annotations

from jinja2 import Environment, StrictUndefined
from markupsafe import Markup

from app.core.config import get_settings
from app.models import Invoice, Payment, SupportTicket
from app.services.invoicing.totals import format_inr

_env = Environment(autoescape=True, undefined=StrictUndefined, trim_blocks=True, lstrip_blocks=True)
_env.filters["inr"] = format_inr

INK = "#101014"
BRAND = "#F48424"
MUTED = "#7A7A88"
MIST = "#F4F5F7"
LINE = "#E3E3E8"

_SHELL = """
<!doctype html>
<html><body style="margin:0;padding:0;background:{{ mist }};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{{ mist }};padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="max-width:560px;background:#ffffff;border:1px solid {{ line }};border-radius:10px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <tr><td style="background:{{ ink }};padding:18px 28px;">
      <span style="color:{{ brand }};font-size:19px;font-weight:800;letter-spacing:.02em;">NKP</span>
      <span style="color:#ffffff;font-size:19px;font-weight:700;letter-spacing:.02em;"> LOGISTICS</span>
    </td></tr>
    <tr><td style="padding:28px;color:{{ ink }};font-size:14px;line-height:1.6;">
{{ content }}
    </td></tr>
    <tr><td style="background:{{ mist }};padding:16px 28px;border-top:1px solid {{ line }};color:{{ muted }};font-size:11px;line-height:1.5;">
      {{ seller_name }} · GSTIN {{ seller_gstin }}<br>
      {{ seller_address }}<br>
      <a href="mailto:{{ seller_email }}" style="color:{{ muted }};">{{ seller_email }}</a> · {{ seller_phone }}
    </td></tr>
  </table>
</td></tr></table>
</body></html>
"""

_BUTTON = (
    '<a href="{href}" style="display:inline-block;background:{brand};color:#ffffff;'
    'text-decoration:none;padding:11px 22px;border-radius:6px;font-weight:600;'
    'font-size:14px;">{label}</a>'
)


def _shell(content_html: str) -> str:
    settings = get_settings()
    return _env.from_string(_SHELL).render(
        content=Markup(content_html),
        ink=INK,
        brand=BRAND,
        muted=MUTED,
        mist=MIST,
        line=LINE,
        seller_name=settings.seller_legal_name,
        seller_gstin=settings.seller_gstin,
        seller_address=settings.seller_address,
        seller_email=settings.seller_email,
        seller_phone=settings.seller_phone,
    )


def _render(template: str, **context) -> str:
    """Render a body fragment with autoescaping on.

    User-supplied values (billing names, free-text messages) are escaped here.
    The result is then wrapped in Markup by _shell so it is not escaped again —
    escaping already-safe markup is what turns an email into visible HTML source.
    """
    return _env.from_string(template).render(**context)


_INVOICE_BODY = """
<p style="margin:0 0 14px;">Hello {{ invoice.bill_to_name }},</p>
<p style="margin:0 0 18px;">
  Please find attached tax invoice <strong>{{ invoice.number }}</strong> for warehousing
  and fulfilment services.
</p>
{% if message %}
<p style="margin:0 0 18px;padding:12px 14px;background:{{ mist }};border-left:3px solid {{ brand }};">
  {{ message }}
</p>
{% endif %}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="border:1px solid {{ line }};border-radius:8px;margin:0 0 20px;">
  <tr><td style="padding:14px 16px;border-bottom:1px solid {{ line }};color:{{ muted }};font-size:12px;">
    Amount due</td>
    <td style="padding:14px 16px;border-bottom:1px solid {{ line }};text-align:right;font-size:20px;font-weight:700;">
    {{ invoice.balance_paise | inr }}</td></tr>
  <tr><td style="padding:11px 16px;color:{{ muted }};font-size:12px;">Invoice date</td>
      <td style="padding:11px 16px;text-align:right;font-size:13px;">{{ invoice.issue_date.strftime('%d %b %Y') }}</td></tr>
  <tr><td style="padding:11px 16px;color:{{ muted }};font-size:12px;">Due date</td>
      <td style="padding:11px 16px;text-align:right;font-size:13px;font-weight:600;">{{ invoice.due_date.strftime('%d %b %Y') }}</td></tr>
  <tr><td style="padding:11px 16px;color:{{ muted }};font-size:12px;">Place of supply</td>
      <td style="padding:11px 16px;text-align:right;font-size:13px;">{{ invoice.place_of_supply or '—' }}</td></tr>
</table>
{% if invoice.balance_paise > 0 %}
<p style="margin:0 0 20px;">{{ pay_button }}</p>
{% endif %}
<p style="margin:0;color:{{ muted }};font-size:12px;">
  The full invoice is attached as a PDF. Reply to this email if anything looks wrong.
</p>
"""


def render_invoice_email(invoice: Invoice, *, message: str | None = None) -> tuple[str, str, str]:
    """Return ``(subject, html, plaintext)`` for an invoice email."""
    settings = get_settings()
    pay_url = f"{settings.web_base_url}/dashboard/invoices/{invoice.id}"
    content = _render(
        _INVOICE_BODY,
        invoice=invoice,
        message=message,
        mist=MIST,
        brand=BRAND,
        line=LINE,
        muted=MUTED,
        pay_button=Markup(_BUTTON.format(href=pay_url, brand=BRAND, label="View &amp; pay online")),
    )
    subject = f"Invoice {invoice.number} from {settings.seller_legal_name} — {format_inr(invoice.balance_paise)} due"
    text = (
        f"Hello {invoice.bill_to_name},\n\n"
        f"Tax invoice {invoice.number} is attached.\n\n"
        f"Amount due: {format_inr(invoice.balance_paise)}\n"
        f"Invoice date: {invoice.issue_date:%d %b %Y}\n"
        f"Due date: {invoice.due_date:%d %b %Y}\n\n"
        f"View and pay online: {pay_url}\n\n"
        f"{settings.seller_legal_name}\n{settings.seller_email}"
    )
    return subject, _shell(content), text


_RECEIPT_BODY = """
<p style="margin:0 0 14px;">Hello {{ invoice.bill_to_name }},</p>
<p style="margin:0 0 18px;">
  We've received your payment for invoice <strong>{{ invoice.number }}</strong>. Thank you.
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="border:1px solid {{ line }};border-radius:8px;margin:0 0 20px;">
  <tr><td style="padding:14px 16px;border-bottom:1px solid {{ line }};color:{{ muted }};font-size:12px;">Amount paid</td>
      <td style="padding:14px 16px;border-bottom:1px solid {{ line }};text-align:right;font-size:20px;font-weight:700;color:#137a3f;">
      {{ payment.amount_paise | inr }}</td></tr>
  <tr><td style="padding:11px 16px;color:{{ muted }};font-size:12px;">Payment reference</td>
      <td style="padding:11px 16px;text-align:right;font-size:13px;font-family:monospace;">{{ payment.provider_payment_id or '—' }}</td></tr>
  <tr><td style="padding:11px 16px;color:{{ muted }};font-size:12px;">Method</td>
      <td style="padding:11px 16px;text-align:right;font-size:13px;">{{ payment.method or 'online' }}</td></tr>
  <tr><td style="padding:11px 16px;color:{{ muted }};font-size:12px;">Balance remaining</td>
      <td style="padding:11px 16px;text-align:right;font-size:13px;font-weight:600;">{{ invoice.balance_paise | inr }}</td></tr>
</table>
<p style="margin:0;color:{{ muted }};font-size:12px;">
  A receipted copy of the invoice is attached for your records.
</p>
"""


def render_receipt_email(invoice: Invoice, payment: Payment) -> tuple[str, str, str]:
    settings = get_settings()
    content = _render(
        _RECEIPT_BODY, invoice=invoice, payment=payment, line=LINE, muted=MUTED
    )
    subject = f"Payment received — invoice {invoice.number}"
    text = (
        f"Hello {invoice.bill_to_name},\n\n"
        f"We've received {format_inr(payment.amount_paise)} against invoice {invoice.number}.\n"
        f"Reference: {payment.provider_payment_id or '—'}\n"
        f"Balance remaining: {format_inr(invoice.balance_paise)}\n\n"
        f"{settings.seller_legal_name}"
    )
    return subject, _shell(content), text


_TICKET_BODY = """
<p style="margin:0 0 14px;">Hello{% if ticket.full_name %} {{ ticket.full_name }}{% endif %},</p>
<p style="margin:0 0 18px;">
  We've logged your query as <strong>{{ ticket.ticket_id }}</strong> and a specialist from
  the {{ ticket.category }} desk will respond shortly.
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="border:1px solid {{ line }};border-radius:8px;margin:0 0 20px;">
  <tr><td style="padding:11px 16px;color:{{ muted }};font-size:12px;">Reference</td>
      <td style="padding:11px 16px;text-align:right;font-size:13px;font-weight:700;">{{ ticket.ticket_id }}</td></tr>
  <tr><td style="padding:11px 16px;color:{{ muted }};font-size:12px;">Subject</td>
      <td style="padding:11px 16px;text-align:right;font-size:13px;">{{ ticket.subject }}</td></tr>
  {% if ticket.tracking_id %}
  <tr><td style="padding:11px 16px;color:{{ muted }};font-size:12px;">Tracking ID</td>
      <td style="padding:11px 16px;text-align:right;font-size:13px;font-family:monospace;">{{ ticket.tracking_id }}</td></tr>
  {% endif %}
</table>
{% if ai_reply %}
<p style="margin:0 0 8px;font-weight:600;">While you wait — this may already answer it:</p>
<p style="margin:0 0 18px;padding:12px 14px;background:{{ mist }};border-left:3px solid {{ brand }};white-space:pre-line;">{{ ai_reply }}</p>
<p style="margin:0 0 18px;color:{{ muted }};font-size:11px;">
  Drafted automatically from our support knowledge base. A human is still reviewing your query.
</p>
{% endif %}
<p style="margin:0;color:{{ muted }};font-size:12px;">Quote {{ ticket.ticket_id }} on any follow-up.</p>
"""


def render_ticket_ack_email(ticket: SupportTicket, *, ai_reply: str | None = None) -> tuple[str, str, str]:
    content = _render(
        _TICKET_BODY, ticket=ticket, ai_reply=ai_reply, line=LINE, muted=MUTED, mist=MIST, brand=BRAND
    )
    subject = f"[{ticket.ticket_id}] We've received your query"
    text = (
        f"Hello,\n\nYour query has been logged as {ticket.ticket_id}.\n"
        f"Subject: {ticket.subject}\n\n"
        + (f"This may already answer it:\n{ai_reply}\n\n" if ai_reply else "")
        + "A specialist will respond shortly."
    )
    return subject, _shell(content), text
