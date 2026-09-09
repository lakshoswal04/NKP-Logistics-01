import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.db import Base, get_db
from app.main import app


@pytest.fixture(autouse=True)
def reset_rate_limits():
    """Clear slowapi's counters between tests.

    The limiter uses in-process memory storage keyed by client IP, and every
    test here shares the same IP and the same process. Without a reset the auth
    limit (20/minute) is exhausted part-way through the file and later tests
    fail at fixture setup with a 429 that looks nothing like a rate-limit bug.
    """
    from app.core.limiter import limiter

    limiter.reset()
    yield


@pytest.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite://")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        yield session
    await engine.dispose()


@pytest.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()

async def _register_and_login(client, email: str, password: str, **extra) -> dict[str, str]:
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": extra.pop("full_name", "Test User"),
            **extra,
        },
    )
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest.fixture
async def staff_headers(client, db_session):
    """An admin's Authorization header.

    Registration always creates a customer — the API deliberately offers no way
    to self-elevate — so the role is promoted directly on the row. db_session is
    the very session the app is using, courtesy of the get_db override.
    """
    from sqlalchemy import select

    from app.models import User, UserRole

    headers = await _register_and_login(client, "staff@test.nkp", "testpass123", full_name="Staff User")
    user = await db_session.scalar(select(User).where(User.email == "staff@test.nkp"))
    user.role = UserRole.admin
    await db_session.commit()
    # The token needs no reissue: get_current_user re-reads the role from the
    # database on every request rather than trusting the JWT's role claim.
    return headers


@pytest.fixture
async def customer_headers(client, db_session):
    """A customer's Authorization header, scoped to their own company."""
    return await _register_and_login(
        client, "buyer@test.nkp", "testpass123", full_name="Buyer User", company_name="Buyer Co"
    )
