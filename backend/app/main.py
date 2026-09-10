import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.extension import _rate_limit_exceeded_handler

from app.core.config import get_settings
from app.core.limiter import limiter
from app.routers import ai, auth, invoices, leads, quotes, support, tracking

logging.basicConfig(level=logging.INFO)

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    # Vercel preview deployments get a fresh hostname per commit, so they can
    # only be matched by pattern. Empty in development, where the explicit
    # origin list is enough.
    allow_origin_regex=settings.cors_origin_regex or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # The browser cannot read a header the server does not expose, and the
    # dashboard reads the filename back off CSV and PDF downloads.
    expose_headers=["Content-Disposition"],
)

API_V1 = "/api/v1"
app.include_router(auth.router, prefix=API_V1)
app.include_router(leads.router, prefix=API_V1)
app.include_router(quotes.router, prefix=API_V1)
app.include_router(tracking.router, prefix=API_V1)
app.include_router(invoices.router, prefix=API_V1)
app.include_router(support.router, prefix=API_V1)
app.include_router(ai.router, prefix=API_V1)


@app.get("/health", tags=["health"])
async def health():
    """Liveness probe. Deliberately does not touch the database.

    A health check that fails when Postgres blips causes the platform to
    restart a perfectly healthy web process, which makes an outage worse rather
    than better. Database reachability is reported separately by /readyz.
    """
    return {"status": "ok", "service": settings.app_name, "environment": settings.environment}


@app.get("/readyz", tags=["health"])
async def readyz():
    """Readiness probe — confirms the database is actually reachable."""
    from sqlalchemy import text

    from app.db import engine

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001 - surfaced as status, not raised
        logging.getLogger("nkp.health").warning("Readiness check failed: %s", exc)
        return {"status": "degraded", "database": "unreachable"}
    return {"status": "ok", "database": "ok"}
