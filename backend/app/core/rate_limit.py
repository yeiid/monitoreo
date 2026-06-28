"""
Rate limiting simple por IP usando un dict en memoria.
Para producción considerar Redis o slowapi.
"""
import time
from collections import defaultdict
from fastapi import Request, HTTPException, status


class RateLimiter:
    def __init__(self):
        self._requests: dict[str, list[float]] = defaultdict(list)

    def check(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """
        Verifica si una key ha excedido el límite de requests.
        Retorna True si está permitido, False si excedido.
        """
        now = time.time()
        cutoff = now - window_seconds

        # Limpiar requests viejas
        self._requests[key] = [t for t in self._requests[key] if t > cutoff]

        if len(self._requests[key]) >= max_requests:
            return False

        self._requests[key].append(now)
        return True

    def get_remaining(self, key: str, max_requests: int, window_seconds: int) -> int:
        """Retorna cuántos requests quedan en la ventana actual."""
        now = time.time()
        cutoff = now - window_seconds
        current = [t for t in self._requests[key] if t > cutoff]
        return max(0, max_requests - len(current))


# Instancia global del rate limiter
_rate_limiter = RateLimiter()


def rate_limit_login(request: Request):
    """
    Rate limiter para el endpoint de login.
    Máximo 5 intentos por IP cada 5 minutos.
    """
    client_ip = request.client.host if request.client else "unknown"
    key = f"login:{client_ip}"

    if not _rate_limiter.check(key, max_requests=5, window_seconds=300):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos de login. Intenta de nuevo en 5 minutos."
        )


def rate_limit_auth(request: Request):
    """
    Rate limiter general para endpoints de auth.
    Máximo 30 requests por IP cada minuto.
    """
    client_ip = request.client.host if request.client else "unknown"
    key = f"auth:{client_ip}"

    if not _rate_limiter.check(key, max_requests=30, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Límite de peticiones excedido. Intenta de nuevo en un minuto."
        )
