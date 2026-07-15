import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.extension import _rate_limit_exceeded_handler

from app.core.config import get_settings
from app.core.limiter import limiter
from app.routers import ai, auth, leads, quotes, tracking

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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_V1 = "/api/v1"
app.include_router(auth.router, prefix=API_V1)
app.include_router(leads.router, prefix=API_V1)
app.include_router(quotes.router, prefix=API_V1)
app.include_router(tracking.router, prefix=API_V1)
app.include_router(ai.router, prefix=API_V1)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "service": settings.app_name, "environment": settings.environment}
