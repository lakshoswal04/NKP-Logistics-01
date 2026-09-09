"""Tests for the AI Control Tower.

These cover the deterministic layer — classification, retrieval, address
scoring, placement — which is what runs when no Gemini key is configured, and
what the model-backed path falls back to when the provider fails. The Gemini
call itself is not exercised here: it needs a live key, and asserting on model
output would make the suite flaky rather than useful.
"""

import pytest

from app.services.ai.demo import address_intelligence, placement_advice
from app.services.ai.knowledge import baseline_triage, retrieve


class TestTriageClassification:
    @pytest.mark.parametrize(
        ("message", "category"),
        [
            # The phishing pattern is a combination — channel plus lure — not a
            # keyword. Each of these is a scam customers actually report.
            ("I got an SMS saying my delivery failed, pay Rs.25 on this link", "Suspected fraud or phishing"),
            ("Someone called asking for an OTP to release my parcel", "Suspected fraud or phishing"),
            ("A WhatsApp message asked me to click a link to confirm my address",
             "Suspected fraud or phishing"),
            # ...and these must NOT be swept up as fraud.
            ("My delivery failed yesterday, can you reattempt tomorrow?", "Delivery issue"),
            ("Our GSTIN is missing from the last invoice", "Billing or invoice"),
            ("Our system shows 240 units, your dashboard shows 216", "Inventory discrepancy"),
            ("Two cartons arrived damaged on inbound GRN 4471", "Damaged or short receipt"),
            ("Where is my consignment, tracking has not updated", "Shipment status"),
        ],
    )
    def test_categories(self, message, category):
        assert baseline_triage(message, retrieve(message, 3))["category"] == category

    def test_phishing_is_always_high_priority(self):
        result = baseline_triage("is this SMS with a payment link genuine?", [])
        assert result["category"] == "Suspected fraud or phishing"
        assert result["urgency"] == "high"

    def test_a_missing_gstin_is_not_an_escalation(self):
        """'missing' used to trip the urgency rule — a billing correction is routine."""
        assert baseline_triage("the GSTIN is missing on invoice 0004", [])["urgency"] == "normal"

    def test_a_lost_consignment_is_an_escalation(self):
        assert baseline_triage("my consignment has gone missing", [])["urgency"] == "high"

    def test_unmatched_queries_are_flagged_for_a_human(self):
        result = baseline_triage("Do you sponsor cricket teams in Nagpur?", [])
        assert result["needs_human"] is True
        assert "specialist" in result["suggested_reply"]

    def test_a_matched_query_answers_from_the_knowledge_base(self):
        message = "what is the dispatch cut-off?"
        matches = retrieve(message, 3)
        assert matches
        result = baseline_triage(message, matches)
        assert result["needs_human"] is False
        assert matches[0]["a"][:40] in result["suggested_reply"]

    def test_the_reply_never_asks_for_a_credential(self):
        for message in ("otp needed for delivery", "send me a payment link", "delivery failed"):
            reply = baseline_triage(message, retrieve(message, 3))["suggested_reply"].lower()
            assert "share your otp" not in reply
            assert "enter your pin" not in reply


class TestRetrieval:
    def test_finds_the_relevant_entry(self):
        assert any("GSTIN" in m["q"] for m in retrieve("gstin wrong on invoice", 3))

    def test_returns_nothing_for_an_empty_query(self):
        assert retrieve("   ", 3) == []

    def test_stopwords_alone_match_nothing(self):
        assert retrieve("the a is are what", 3) == []


class TestAddressIntelligence:
    COMPLETE = "Flat 402, Sunrise Apartments, Marol, Andheri East, Mumbai 400093. Ph 9820012345"
    VAGUE = "near the big temple, opposite the school"

    def test_a_complete_address_scores_low_risk(self):
        result = address_intelligence(self.COMPLETE)
        assert result["risk_band"] == "low"
        assert result["normalised"]["pincode"] == "400093"
        assert result["normalised"]["city"] == "Mumbai"
        assert result["normalised"]["phone"] == "9820012345"
        assert result["serviceable"] is True

    def test_a_vague_address_scores_high_risk(self):
        result = address_intelligence(self.VAGUE)
        assert result["risk_band"] == "high"
        assert result["rto_risk"] > 0.5
        assert result["serviceable"] is False
        assert len(result["issues"]) >= 3

    def test_a_missing_pincode_is_called_out_specifically(self):
        issues = " ".join(address_intelligence(self.VAGUE)["issues"]).lower()
        assert "pincode" in issues

    def test_risk_and_confidence_stay_in_range(self):
        for address in (self.COMPLETE, self.VAGUE, "x" * 400, "Plot 1"):
            result = address_intelligence(address)
            assert 0 <= result["rto_risk"] <= 1
            assert 0 <= result["confidence"] <= 1

    def test_confidence_falls_as_issues_rise(self):
        assert (
            address_intelligence(self.COMPLETE)["confidence"]
            > address_intelligence(self.VAGUE)["confidence"]
        )


class TestPlacement:
    DISTRIBUTION = [
        {"city": "Mumbai", "orders": 4200},
        {"city": "Bengaluru", "orders": 3100},
        {"city": "Delhi", "orders": 2400},
        {"city": "Kolkata", "orders": 600},
    ]

    def test_recommends_centres_in_volume_order(self):
        result = placement_advice(self.DISTRIBUTION)
        shares = [pick["share_pct"] for pick in result["recommended"]]
        assert shares == sorted(shares, reverse=True)
        assert result["recommended"][0]["fulfilment_centre"].startswith("Bhiwandi")

    def test_stops_once_most_volume_is_covered(self):
        """The point of the rule: do not sell a fourth FC for the last 6% of orders."""
        result = placement_advice(self.DISTRIBUTION)
        assert result["coverage_pct"] >= 85
        assert len(result["recommended"]) < len(self.DISTRIBUTION)

    def test_a_single_city_needs_a_single_centre(self):
        result = placement_advice([{"city": "Mumbai", "orders": 5000}])
        assert len(result["recommended"]) == 1
        assert result["coverage_pct"] == 100

    def test_unmapped_cities_are_reported_not_silently_dropped(self):
        result = placement_advice([{"city": "Mumbai", "orders": 1000}, {"city": "Shillong", "orders": 250}])
        assert result["unmapped_orders"] == 250
        assert "long-haul" in result["summary"]

    def test_zero_volume_is_rejected(self):
        assert "error" in placement_advice([{"city": "Mumbai", "orders": 0}])

    def test_shares_sum_to_the_coverage(self):
        result = placement_advice(self.DISTRIBUTION)
        assert sum(p["share_pct"] for p in result["recommended"]) == pytest.approx(
            result["coverage_pct"], abs=0.2
        )


class TestAiEndpoints:
    async def test_status_reports_demo_mode_without_a_key(self, client):
        body = (await client.get("/api/v1/ai/status")).json()
        assert body["mode"] == "demo"
        assert body["model"] is None
        assert len(body["features"]) >= 4
        assert body["suggestions"]

    async def test_copilot_requires_authentication(self, client):
        resp = await client.post("/api/v1/ai/copilot", json={"question": "what is delayed?"})
        assert resp.status_code == 401

    async def test_copilot_answers_from_the_database(self, client, staff_headers, db_session):
        from datetime import UTC, datetime

        from app.models import Shipment, ShipmentStatus, ShipmentType

        db_session.add(
            Shipment(
                tracking_id="NKPAITEST01",
                origin_city="Mumbai",
                destination_city="Pune",
                status=ShipmentStatus.delayed,
                shipment_type=ShipmentType.ltl,
                pickup_date=datetime.now(UTC),
            )
        )
        await db_session.commit()

        body = (
            await client.post(
                "/api/v1/ai/copilot", headers=staff_headers, json={"question": "which are delayed?"}
            )
        ).json()
        assert body["mode"] == "demo"
        assert "search_shipments" in body["tools_used"]
        assert "NKPAITEST01" in body["answer"]

    async def test_address_endpoint_scores_a_vague_address(self, client):
        body = (
            await client.post("/api/v1/ai/address", json={"address": "near the temple, second lane"})
        ).json()
        assert body["risk_band"] == "high"
        assert body["mode"] == "demo"

    async def test_placement_endpoint_rejects_empty_volume(self, client):
        resp = await client.post(
            "/api/v1/ai/placement", json={"distribution": [{"city": "Mumbai", "orders": 0}]}
        )
        assert resp.status_code == 422

    async def test_triage_endpoint_flags_a_scam(self, client):
        body = (
            await client.post(
                "/api/v1/ai/triage",
                json={"message": "I got an SMS with a link asking me to pay for redelivery"},
            )
        ).json()
        assert body["category"] == "Suspected fraud or phishing"
        assert body["urgency"] == "high"

    async def test_delay_narrative_404s_on_an_unknown_reference(self, client):
        resp = await client.post("/api/v1/ai/delay-narrative", json={"tracking_id": "NOPE12345"})
        assert resp.status_code == 404
