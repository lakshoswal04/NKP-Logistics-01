import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.core.security import create_token, decode_token, hash_password, verify_password
from app.db import get_db
from app.models import Company, User, UserRole
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenPair, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

settings = get_settings()


def _token_pair(user: User) -> TokenPair:
    return TokenPair(
        access_token=create_token(user.id, "access", extra={"role": user.role.value}),
        refresh_token=create_token(user.id, "refresh"),
    )


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.auth_rate_limit)
async def register(request: Request, body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(User).where(User.email == body.email.lower()))
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")

    company = None
    if body.company_name:
        company = Company(name=body.company_name)
        db.add(company)
        await db.flush()

    user = User(
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        phone=body.phone,
        role=UserRole.customer,
        company_id=company.id if company else None,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return _token_pair(user)


@router.post("/login", response_model=TokenPair)
@limiter.limit(settings.auth_rate_limit)
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == body.email.lower()))
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is deactivated")
    return _token_pair(user)


@router.post("/refresh", response_model=TokenPair)
@limiter.limit(settings.auth_rate_limit)
async def refresh(request: Request, body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(body.refresh_token, expected_type="refresh")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token") from None
    user = await db.scalar(select(User).where(User.id == int(payload["sub"])))
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or inactive")
    return _token_pair(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(user: User = Depends(get_current_user)):
    # Stateless JWT: the client discards its tokens. A server-side denylist
    # (Redis) arrives with the portal work in iteration 2.
    return None


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return user
