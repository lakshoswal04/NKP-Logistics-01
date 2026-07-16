# NKP Logistics

AI-powered logistics platform for the Indian B2B market — public marketing site, customer/admin/warehouse/driver portals, and an AI layer (quoting, tracking, route optimization, fraud detection).

**Status:** Iteration 1 — monorepo foundation + public marketing site.

## Structure

```
frontend/   Next.js (App Router, TypeScript, Tailwind) — marketing site + portals
backend/    FastAPI (Python 3.12, SQLAlchemy 2.0 async, Alembic) — REST API
docker-compose.yml     Postgres 16 (PostGIS) + Redis + api + web
backend.env.example    Backend env template  → copy to backend/.env
frontend.env.example   Frontend env template → copy to frontend/.env
```

All external services (Google Maps, email, LLM, payments) sit behind swappable provider interfaces with **mock implementations**, so the whole stack runs locally with zero API keys. Real keys drop into `.env` files later without code changes.

## Quick start (Docker)

```bash
cp backend.env.example backend/.env
cp frontend.env.example frontend/.env
docker compose up --build
```

- Web: http://localhost:5001
- API docs: http://localhost:8080/docs
- Migrations + demo seed data run automatically. Try tracking ID **NKP2026A1B2**.

## Quick start (native, no Docker)

Requires Python 3.12, Node 20+, PostgreSQL running locally.

```bash
# API
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp ../backend.env.example .env   # adjust DATABASE_URL for your local Postgres
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

## Demo credentials (seeded)

| Role | Email | Password |
|---|---|---|
| Customer | customer@demo.nkp | demo1234 |
| Admin | admin@demo.nkp | demo1234 |
| Warehouse | warehouse@demo.nkp | demo1234 |
| Driver | driver@demo.nkp | demo1234 |

Seeded public tracking IDs: `NKP2026A1B2` (in transit), `NKP2026C3D4` (out for delivery), `NKP2026E5F6` (delivered), `NKP2026J9K1` (delayed).

## Tests & lint

```bash
cd backend
source .venv/bin/activate
pytest
ruff check .

cd ../frontend
npm run lint
npm run build
```
