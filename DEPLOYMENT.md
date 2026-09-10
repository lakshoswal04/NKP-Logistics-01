# Deployment

Frontend on **Vercel**, backend and Postgres on **Render**.

There is a chicken-and-egg step: the backend needs the frontend's origin for
CORS, and the frontend needs the backend's URL at build time. Deploy the
backend first, then the frontend, then come back and set `CORS_ORIGINS`.

---

## 1. Backend + database on Render

Render reads `render.yaml` at the repository root, which declares both the web
service and the Postgres instance.

**Dashboard → New → Blueprint → select this repository.**

It provisions:

| Resource | Notes |
|---|---|
| `nkp-postgres` | Postgres 16, free plan |
| `nkp-api` | Python web service, root directory `backend`, region `singapore` |

The blueprint sets `DATABASE_URL` from the database, generates `JWT_SECRET`,
and pins Python 3.12.13. Three variables are marked `sync: false`, meaning you
fill them in yourself after step 2.

**Start command:**

```
alembic upgrade head && python -m app.seed_boot && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Migrations run before the server binds, so the app never serves a request
against a schema it does not have. `app.seed_boot` is a no-op unless
`SEED_ON_START=true`, and the seeder itself returns early if any data exists.

**Two things Render does that would otherwise break the app**, both handled in
`backend/app/core/config.py`:

- It hands out `postgres://…`, which SQLAlchemy's async engine cannot use.
  `_normalise_database_url` rewrites it to `postgresql+asyncpg://…`.
- That URL carries `?sslmode=require`, which is a libpq parameter. asyncpg
  configures TLS itself and **rejects** it, so the parameter is stripped.

Health checks: `/health` is a liveness probe and deliberately does not touch the
database — a health check that fails when Postgres blips causes the platform to
restart a healthy web process. `/readyz` reports database reachability
separately.

---

## 2. Frontend on Vercel

**Dashboard → Add New → Project → import this repository.**

| Setting | Value |
|---|---|
| Framework preset | Next.js (auto-detected) |
| **Root Directory** | **`frontend`** — this is the one that is easy to miss |
| Build command | `npm run build` (default) |
| Node version | 20.x — pinned by `.nvmrc` and `engines` |

Set one environment variable, for **all** environments:

```
NEXT_PUBLIC_API_URL = https://nkp-api.onrender.com
```

`NEXT_PUBLIC_*` values are **inlined at build time**, not read at runtime.
Changing this in the dashboard requires a redeploy, not a restart.

`npm run build` runs `scripts/check-design-tokens.mjs` before `next build`, so a
reference to a deleted design token fails the deploy rather than silently
shipping an unstyled element.

---

## 3. Close the loop — set CORS on Render

With the Vercel URL known, set these on `nkp-api` and redeploy:

```
CORS_ORIGINS       = https://your-project.vercel.app
WEB_BASE_URL       = https://your-project.vercel.app
CORS_ORIGIN_REGEX  = ^https://your-project-[a-z0-9-]+\.vercel\.app$
```

The regex is for preview deployments: Vercel gives every commit its own
hostname, so they cannot be enumerated. Scope it to your project — do not match
all of `vercel.app`.

Without this the site loads and every API call fails in the browser with an
opaque CORS error while the server logs look completely healthy.

---

## 4. Optional credentials

The app runs fully with none of these. Each provider falls back to a mock and
the UI states which mode it is in.

| Variable | Effect when set |
|---|---|
| `GEMINI_API_KEY` | AI Control Tower answers are model-generated. Without it the same tools run against the same live data by rules, badged "Rules" instead of "Gemini". |
| `EMAIL_PROVIDER=resend` + `EMAIL_API_KEY` | Invoices and receipts are actually delivered. The mock writes viewable messages to `backend/var/outbox/`. |
| `PAYMENT_PROVIDER=razorpay` + `RAZORPAY_KEY_ID` / `_SECRET` / `_WEBHOOK_SECRET` | Real Razorpay checkout. Use **test** keys (`rzp_test_…`). |

Razorpay webhook URL, once configured:
`https://nkp-api.onrender.com/api/v1/payments/webhook/razorpay`

---

## Production safety guards

`Settings._guard_production` refuses to boot when `ENVIRONMENT=production` and
any of these hold:

- `JWT_SECRET` is the placeholder, or shorter than 32 characters
- `DEBUG` is true — it exposes `/docs` and full tracebacks
- neither `CORS_ORIGINS` nor `CORS_ORIGIN_REGEX` is set

Failing at boot is the intent. A placeholder signing key reaching production is
a complete authentication bypass and would otherwise be entirely silent.

Generate a real secret with:

```bash
openssl rand -hex 32
```

---

## Known limits of the free tiers

- **Render free web services sleep after ~15 minutes idle.** The next request
  cold-starts and can take 50 seconds or more. The first page load after a
  quiet period will look broken; it is not.
- **Render free Postgres expires after 90 days** and cannot be restored. Move
  to a paid instance before that if the data matters.
- Rate limiting is in-process (`slowapi` with memory storage), so limits are
  per-instance. Correct on one instance; it would need Redis to scale out.
- The mock email provider writes to the container filesystem, which is
  ephemeral. Writes are wrapped so a read-only filesystem cannot break a
  request, but the outbox does not survive a restart.

---

## Verifying a deploy

```bash
curl https://nkp-api.onrender.com/health     # {"status":"ok",...}
curl https://nkp-api.onrender.com/readyz     # {"status":"ok","database":"ok"}
```

Then on the site:

1. `/track` with `NKP2026A1B2` returns a live consignment — proves the database
   is seeded and CORS is right.
2. `/support`, search "GSTIN" — proves the client bundle is working.
3. Sign in with `customer@demo.nkp` / `demo1234`, open `/ai`, ask
   "What is outstanding on receivables?" — proves auth and the AI tool loop.

If step 1 fails but `/health` passes, it is almost always `CORS_ORIGINS`.
