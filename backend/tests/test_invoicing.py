from datetime import date
from decimal import Decimal

import pytest

from app.services.invoicing import (
    LineInput,
    compute_totals,
    format_inr,
    paise_to_rupees,
    rupees_to_paise,
)
from app.services.invoicing.numbering import financial_year, next_invoice_number


class TestMoney:
    @pytest.mark.parametrize(
        ("rupees", "paise"),
        [("100", 10_000), ("12.50", 1_250), (0.1, 10), ("0.005", 1), ("45000", 4_500_000)],
    )
    def test_rupees_to_paise(self, rupees, paise):
        assert rupees_to_paise(rupees) == paise

    def test_float_pennies_do_not_drift(self):
        """The reason money is stored as paise at all."""
        total = sum(rupees_to_paise("0.1") for _ in range(10))
        assert total == 100
        assert paise_to_rupees(total) == Decimal("1.00")

    @pytest.mark.parametrize(
        ("paise", "text"),
        [
            (123_450, "₹1,234.50"),
            (12_345_678, "₹1,23,456.78"),
            (1_234_567_890, "₹1,23,45,678.90"),
            (10_000, "₹100.00"),
            (-50_000, "-₹500.00"),
        ],
    )
    def test_indian_digit_grouping(self, paise, text):
        """INR groups 2,2,3 from the right — not in thousands like en-US."""
        assert format_inr(paise) == text


class TestGst:
    LINES = [
        LineInput("Warehousing", rupees_to_paise("45000"), 1, "997212", "month"),
        LineInput("Pick & pack", rupees_to_paise("12.50"), 3200, "996729", "order"),
    ]

    def test_intrastate_splits_into_cgst_and_sgst(self):
        t = compute_totals(self.LINES, seller_state="Maharashtra", place_of_supply="Maharashtra")
        assert not t.is_interstate
        assert t.igst_paise == 0
        assert t.cgst_paise == t.sgst_paise
        assert t.subtotal_paise == rupees_to_paise("85000")
        assert t.total_paise == t.subtotal_paise + t.tax_paise

    def test_interstate_uses_a_single_igst(self):
        t = compute_totals(self.LINES, seller_state="Maharashtra", place_of_supply="Karnataka")
        assert t.is_interstate
        assert t.cgst_paise == t.sgst_paise == 0
        assert t.igst_paise == rupees_to_paise("15300")

    def test_total_is_identical_either_way(self):
        intra = compute_totals(self.LINES, seller_state="Maharashtra", place_of_supply="Maharashtra")
        inter = compute_totals(self.LINES, seller_state="Maharashtra", place_of_supply="Karnataka")
        assert intra.total_paise == inter.total_paise
        assert intra.cgst_paise + intra.sgst_paise == inter.igst_paise

    def test_state_match_is_case_and_space_insensitive(self):
        t = compute_totals(self.LINES, seller_state="Maharashtra", place_of_supply="  maharashtra ")
        assert not t.is_interstate

    def test_unknown_place_of_supply_falls_back_to_intrastate(self):
        t = compute_totals(self.LINES, seller_state="Maharashtra", place_of_supply=None)
        assert not t.is_interstate

    def test_odd_paisa_split_still_reconciles(self):
        """A tax of an odd number of paise must not lose the spare paisa."""
        lines = [LineInput("Odd", 101, 1, tax_rate=5.0)]  # 101 paise @ 5% = 5.05 -> 5
        t = compute_totals(lines, seller_state="MH", place_of_supply="MH")
        assert t.cgst_paise + t.sgst_paise == t.tax_paise
        assert t.subtotal_paise + t.tax_paise == t.total_paise

    def test_mixed_rates_are_taxed_per_line(self):
        lines = [
            LineInput("Storage", rupees_to_paise("1000"), 1, tax_rate=18.0),
            LineInput("Exempt handling", rupees_to_paise("1000"), 1, tax_rate=0.0),
        ]
        t = compute_totals(lines, seller_state="MH", place_of_supply="KA")
        assert t.igst_paise == rupees_to_paise("180")

    def test_quantity_scales_the_line_amount(self):
        line = LineInput("Pallet in", rupees_to_paise("450"), 18)
        assert line.amount_paise == rupees_to_paise("8100")


class TestNumbering:
    @pytest.mark.parametrize(
        ("on", "fy"),
        [
            (date(2026, 9, 10), "2627"),   # Sept 2026 -> FY 26-27
            (date(2026, 4, 1), "2627"),    # first day of FY
            (date(2026, 3, 31), "2526"),   # last day of the previous FY
            (date(2027, 1, 15), "2627"),
        ],
    )
    def test_financial_year_runs_april_to_march(self, on, fy):
        assert financial_year(on) == fy

    async def test_numbers_are_sequential_and_gap_free(self, db_session):
        from app.models import Company, Invoice, InvoiceStatus

        company = Company(name="Acme")
        db_session.add(company)
        await db_session.flush()

        issued = []
        for _ in range(3):
            number = await next_invoice_number(db_session, on=date(2026, 9, 10))
            issued.append(number)
            db_session.add(
                Invoice(
                    number=number,
                    company_id=company.id,
                    status=InvoiceStatus.draft,
                    issue_date=date(2026, 9, 10),
                    due_date=date(2026, 9, 25),
                    bill_to_name="Acme",
                )
            )
            await db_session.flush()

        assert issued == ["NKP/2627/0001", "NKP/2627/0002", "NKP/2627/0003"]

    async def test_series_restarts_per_financial_year(self, db_session):
        from app.models import Invoice, InvoiceStatus

        db_session.add(
            Invoice(
                number="NKP/2526/0009",
                status=InvoiceStatus.draft,
                issue_date=date(2026, 3, 1),
                due_date=date(2026, 3, 16),
                bill_to_name="Acme",
            )
        )
        await db_session.flush()
        assert await next_invoice_number(db_session, on=date(2026, 9, 10)) == "NKP/2627/0001"
