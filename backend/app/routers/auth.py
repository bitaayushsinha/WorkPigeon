"""
routers/auth.py — JWT authentication
POST /api/auth/login   → returns access token
GET  /api/auth/me      → returns current user from token
"""

from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel

from app.config import settings
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Auth"])
bearer = HTTPBearer(auto_error=False)

ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7


# ── Helpers ────────────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> User:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    payload = decode_token(creds.credentials)
    user = await User.get(payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists.")
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


# ── Schemas ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    name: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    current_workload: float
    ai_efficiency_score: float
    commits_today: int
    skills: list


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest) -> LoginResponse:
    user = await User.find_one(User.email == body.email)
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_token(str(user.id), user.role)
    return LoginResponse(
        access_token=token,
        user_id=str(user.id),
        role=user.role,
        name=user.name,
    )


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut(
        id=str(user.id),
        name=user.name,
        email=user.email,
        role=user.role,
        current_workload=user.current_workload,
        ai_efficiency_score=user.ai_efficiency_score,
        commits_today=user.commits_today,
        skills=[{"name": s.name, "proficiency": s.proficiency} for s in user.skills],
    )
