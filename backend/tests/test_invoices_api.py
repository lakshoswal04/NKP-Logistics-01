"""End-to-end tests for the invoice API."""

import csv
import io

import pytest

PAYLOAD = {
    "bill_to_name": "Northwind Retail Pvt Ltd",
    "bill_to_email": "ap@northwind.example",
    "bill_to_gstin": "29AAGCN9999R1ZP",
    "place_of_supply": "Karnataka",
    "line_items": [
        {"description": "Warehousing — Hoskote FC", "unit_price": 19500, "quantity": 1,
         "hsn_sac": "997212", "unit": "month"},
        {"description": "Pick & pack", "unit_price": 12.5, "quantity": 800,
         "hsn_sac": "996729", "unit": "order"},
    ],
}


async def _create(client, headers, **overrides):
    resp = await client.post("/api/v1/invoices", headers=headers, json={**PAYLOAD, **overrides})
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestCreate:
    async def test_creates_a_numbered_draft(self, client, staff_headers):
        invoice = await _create(client, staff_headers)
        assert invoice["status"] == "draft"
        assert invoice["number"].startswith("NKP/")
        assert len(invoice["line_items"]) == 2

    async def test_totals_are_computed_server_side(self, client, staff_headers):
        invoice = await _create(client, staff_headers)
        # 19,500 + (12.50 x 800) = 29,500 -> 18% IGST = 5,310
        assert invoice["subtotal_paise"] == 2_950_000
        assert invoice["igst_paise"] == 531_000
        assert invoice["cgst_paise"] == invoice["sgst_paise"] == 0
        assert invoice["total_paise"] == 3_481_000

    async def test_intrastate_supply_splits_the_tax(self, client, staff_headers):
        invoice = await _create(client, staff_headers, place_of_supply="Maharashtra")
        assert invoice["igst_paise"] == 0
        assert invoice["cgst_paise"] == invoice["sgst_paise"] == 265_500

    async def test_numbers_increment(self, client, staff_headers):
        first = await _create(client, staff_headers)
        second = await _create(client, staff_headers)
        assert first["number"] != second["number"]
        assert int(second["number"].rsplit("/", 1)[1]) == int(first["number"].rsplit("/", 1)[1]) + 1

    async def test_rejects_an_invoice_with_no_lines(self, client, staff_headers):
        resp = await client.post(
            "/api/v1/invoices", headers=staff_headers, json={**PAYLOAD, "line_items": []}
        )
        assert resp.status_code == 422

    @pytest.mark.parametrize("bad", [{"unit_price": 0}, {"unit_price": -5}, {"quantity": 0}])
    async def test_rejects_non_positive_amounts(self, client, staff_headers, bad):
        line = {**PAYLOAD["line_items"][0], **bad}
        resp = await client.post(
            "/api/v1/invoices", headers=staff_headers, json={**PAYLOAD, "line_items": [line]}
        )
        assert resp.status_code == 422


class TestAuthorisation:
    async def test_anonymous_access_is_rejected(self, client):
        assert (await client.get("/api/v1/invoices")).status_code == 401

    async def test_customers_cannot_raise_invoices(self, client, customer_headers):
        resp = await client.post("/api/v1/invoices", headers=customer_headers, json=PAYLOAD)
        assert resp.status_code == 403

    async def test_customers_do_not_see_another_company_invoices(
        self, client, staff_headers, customer_headers
    ):
        await _create(client, staff_headers)  # company_id is null -> not the buyer's
        resp = await client.get("/api/v1/invoices", headers=customer_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == 0

    async def test_fetching_another_company_invoice_is_a_404(
        self, client, staff_headers, customer_headers
    ):
        invoice = await _create(client, staff_headers)
        resp = await client.get(f"/api/v1/invoices/{invoice['id']}", headers=customer_headers)
        # 404 rather than 403 so the endpoint does not confirm the id exists.
        assert resp.status_code == 404


class TestLifecycle:
    async def test_send_marks_it_sent_and_records_the_time(self, client, staff_headers):
        invoice = await _create(client, staff_headers)
        resp = await client.post(
            f"/api/v1/invoices/{invoice['id']}/send", headers=staff_headers, json={}
        )
        assert resp.status_code == 200
        assert resp.json()["sent_to"] == "ap@northwind.example"

        fresh = (await client.get(f"/api/v1/invoices/{invoice['id']}", headers=staff_headers)).json()
        assert fresh["status"] == "sent"
        assert fresh["sent_at"] is not None

    async def test_send_without_a_recipient_is_rejected(self, client, staff_headers):
        invoice = await _create(client, staff_headers, bill_to_email=None)
        resp = await client.post(
            f"/api/v1/invoices/{invoice['id']}/send", headers=staff_headers, json={}
        )
        assert resp.status_code == 422

    async def test_an_issued_invoice_cannot_be_edited(self, client, staff_headers):
        invoice = await _create(client, staff_headers)
        await client.post(f"/api/v1/invoices/{invoice['id']}/send", headers=staff_headers, json={})
        resp = await client.patch(
            f"/api/v1/invoices/{invoice['id']}", headers=staff_headers, json={"notes": "oops"}
        )
        assert resp.status_code == 409

    async def test_editing_the_place_of_supply_recomputes_the_tax_split(self, client, staff_headers):
        invoice = await _create(client, staff_headers)
        assert invoice["igst_paise"] > 0
        resp = await client.patch(
            f"/api/v1/invoices/{invoice['id']}",
            headers=staff_headers,
            json={"place_of_supply": "Maharashtra"},
        )
        assert resp.status_code == 200
        updated = resp.json()
        assert updated["igst_paise"] == 0
        assert updated["cgst_paise"] == updated["sgst_paise"] > 0
        assert updated["total_paise"] == invoice["total_paise"]

    async def test_void_blocks_a_later_send(self, client, staff_headers):
        invoice = await _create(client, staff_headers)
        assert (
            await client.post(f"/api/v1/invoices/{invoice['id']}/void", headers=staff_headers)
        ).json()["status"] == "void"
        resp = await client.post(
            f"/api/v1/invoices/{invoice['id']}/send", headers=staff_headers, json={}
        )
        assert resp.status_code == 409


class TestDownloads:
    async def test_pdf_is_a_real_pdf_named_after_the_invoice(self, client, staff_headers):
        invoice = await _create(client, staff_headers)
        resp = await client.get(f"/api/v1/invoices/{invoice['id']}/pdf", headers=staff_headers)
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/pdf"
        assert resp.content.startswith(b"%PDF-")
        assert invoice["number"].replace("/", "-") in resp.headers["content-disposition"]

    async def test_csv_uses_rupees_and_opens_cleanly_in_excel(self, client, staff_headers):
        await _create(client, staff_headers)
        resp = await client.get("/api/v1/invoices/export.csv", headers=staff_headers)
        assert resp.status_code == 200
        assert "attachment" in resp.headers["content-disposition"]

        text = resp.text
        assert text.startswith("﻿"), "needs a BOM or Excel mangles the rupee column"

        rows = list(csv.DictReader(io.StringIO(text.lstrip("﻿"))))
        assert len(rows) == 1
        assert rows[0]["Invoice number"].startswith("NKP/")
        assert rows[0]["Total"] == "34810.0"      # rupees, not paise
        assert rows[0]["Overdue"] == "no"

    async def test_csv_respects_the_status_filter(self, client, staff_headers):
        await _create(client, staff_headers)
        resp = await client.get("/api/v1/invoices/export.csv?status=paid", headers=staff_headers)
        rows = list(csv.DictReader(io.StringIO(resp.text.lstrip("﻿"))))
        assert rows == []


class TestListing:
    async def test_reports_outstanding_across_the_whole_set(self, client, staff_headers):
        first = await _create(client, staff_headers)
        second = await _create(client, staff_headers)
        for inv in (first, second):
            await client.post(f"/api/v1/invoices/{inv['id']}/send", headers=staff_headers, json={})

        body = (await client.get("/api/v1/invoices?page_size=1", headers=staff_headers)).json()
        assert len(body["items"]) == 1, "page size applies to rows"
        assert body["total"] == 2
        # ...but the money figure covers everything matching, not just this page.
        assert body["outstanding_paise"] == first["total_paise"] + second["total_paise"]

    async def test_drafts_are_not_counted_as_outstanding(self, client, staff_headers):
        await _create(client, staff_headers)
        body = (await client.get("/api/v1/invoices", headers=staff_headers)).json()
        assert body["total"] == 1
        assert body["outstanding_paise"] == 0

    async def test_search_matches_number_and_billed_name(self, client, staff_headers):
        await _create(client, staff_headers)
        await _create(client, staff_headers, bill_to_name="Southgate Traders")

        hits = (await client.get("/api/v1/invoices?q=southgate", headers=staff_headers)).json()
        assert hits["total"] == 1
        assert hits["items"][0]["bill_to_name"] == "Southgate Traders"
