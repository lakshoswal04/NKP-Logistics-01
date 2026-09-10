# NKP Logistics

Warehousing and fulfilment platform for the Indian market — public marketing
site, live consignment tracking, a GST-compliant invoicing and payments spine,
and an AI Control Tower that answers questions against real platform data.

**Deployment:** frontend on Vercel, backend and Postgres on Render.
See [DEPLOYMENT.md](DEPLOYMENT.md).

## Structure

```
frontend/   Next.js 16 (App Router, TypeScript, Tailwind v4) — the site
backend/    FastAPI (Python 3.12, SQLAlchemy 2.0 async, Alembic) — REST API
render.yaml            Render blueprint: web service + Postgres
docker-compose.yml     Local Postgres + api + web
backend.env.example    → copy to backend/.env
frontend.env.example   → copy to frontend/.env
```

Every external service — Gemini, Resend, Razorpay, Google Maps — sits behind a
provider interface with a mock implementation. **The whole stack runs with zero
API keys**, and the UI states which mode it is in rather than pretending. Real
keys drop into env vars without code changes.

## What is built

| Area | Detail |
|---|---|
| **Public site** | Home, Warehousing, Track, Support, Contact, AI Control Tower |
| **Tracking** | Public lookup by AWB / order ID / LRN, scan timeline, schematic route |
| **Invoicing** | CRUD, GST computed per line (CGST+SGST vs IGST), ReportLab PDF, email delivery with attachment, CSV export |
| **Support** | Searchable knowledge base, ticket creation with emailed reference |
| **AI Control Tower** | Ops copilot with a real read-only tool registry over the database, plus address intelligence, fulfilment-centre placement, support triage and delay-narrative drafting |
| **Auth** | Email + password, JWT, company-scoped data access |

Money is stored as integer **paise** throughout — rupee floats cannot be
trusted for invoice arithmetic, and Razorpay takes paise anyway.

## Quick start

Requires Python 3.12, Node 20.9+, and PostgreSQL running locally.

```bash
# API
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp ../backend.env.example .env          # adjust DATABASE_URL if needed
createdb nkp_logistics
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8080

# Web (second terminal)
cd frontend
cp ../frontend.env.example .env
npm install
npm run dev
```

- Web: http://localhost:5001
- API docs: http://localhost:8080/docs (development only)
- Try tracking ID **NKP2026A1B2**

### Docker

```bash
cp backend.env.example backend/.env
cp frontend.env.example frontend/.env
docker compose up --build
```

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Customer | customer@demo.nkp | demo1234 |
| Admin | admin@demo.nkp | demo1234 |

Seeded tracking IDs: `NKP2026A1B2` (in transit), `NKP2026C3D4` (out for
delivery), `NKP2026E5F6` (delivered), `NKP2026J9K1` (delayed).

Seeded invoices run `NKP/2627/0001`–`0007` across draft, sent, paid and overdue.

## Tests and checks

```bash
cd backend && pytest && ruff check .        # 99 tests
cd frontend && npx tsc --noEmit && npx eslint . && npm run build
```

`npm run build` runs `scripts/check-design-tokens.mjs` first. Tailwind emits
nothing for an unknown utility and reports no error, so a renamed design token
can silently strip styling from an element — that check fails the build instead.

## Notes

- Without `GEMINI_API_KEY` the AI tools still run against live data using
  deterministic rules, and every result is badged accordingly.
- Without `EMAIL_API_KEY` the mock provider writes viewable messages, with
  attachments, to `backend/var/outbox/`.
- Rate limiting is in-process, so limits are per-instance.
