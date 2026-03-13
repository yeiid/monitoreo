"""
Utilidades de seguridad: hashing de contraseñas y manejo de tokens JWT.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
from jose import jwt, JWTError

# Configuración JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ftth-mapper-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))  # 8 horas por defecto

import bcrypt

# Hashing de contraseñas
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar contraseña plana contra el hash almacenado usando bcrypt nativo."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), 
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Generar un hash bcrypt de la contraseña usando bcrypt nativo."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crear un token JWT con los datos proporcionados."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decodificar un token JWT. Retorna None si es inválido o expirado."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
