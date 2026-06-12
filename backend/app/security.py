from datetime import UTC, datetime, timedelta
import hashlib
import hmac
import secrets

import jwt


def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    try:
        salt, digest = hashed.split("$", 1)
    except ValueError:
        return False
    candidate = hash_password(password, salt)
    return hmac.compare_digest(candidate, hashed)


def new_jti() -> str:
    return secrets.token_urlsafe(24)


def token_hash(jti: str) -> str:
    return hashlib.sha256(jti.encode("utf-8")).hexdigest()


def create_token_pair(settings, user, remember_me: bool = True):
    now = datetime.now(UTC)
    access_exp = now + timedelta(minutes=settings.access_token_minutes)
    refresh_days = settings.refresh_token_days if remember_me else min(settings.refresh_token_days, 7)
    refresh_exp = now + timedelta(days=refresh_days)
    refresh_jti = new_jti()

    access_token = jwt.encode(
        {
            "sub": user.id,
            "role": user.role,
            "typ": "access",
            "iat": int(now.timestamp()),
            "exp": access_exp,
        },
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    refresh_token = jwt.encode(
        {
            "sub": user.id,
            "role": user.role,
            "jti": refresh_jti,
            "typ": "refresh",
            "iat": int(now.timestamp()),
            "exp": refresh_exp,
        },
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    return access_token, refresh_token, refresh_jti, refresh_exp


def decode_token(settings, token: str):
    return jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
        options={"require": ["sub", "exp", "typ"]},
    )

