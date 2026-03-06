"""
Rate limiting middleware for ARIA API.

Uses a simple in-memory sliding window per user (Clerk ID).
Configurable:
  - 10 requests per minute for authenticated users
  - 5 requests per minute for unauthenticated (health check etc.)
"""
import time
from collections import defaultdict
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


# Sliding window storage: {user_key: [timestamp, ...]}
_request_log: dict[str, list[float]] = defaultdict(list)

# Config
RATE_LIMIT_AI = 10               # requests per minute for expensive AI endpoints
RATE_LIMIT_GENERAL_AUTH = 100    # requests per minute for general authenticated traffic
RATE_LIMIT_GENERAL_UNAUTH = 30   # requests per minute for unauthenticated
WINDOW_SECONDS = 60



def _get_user_key(request: Request) -> str:
    """Extract a rate-limit key from the request."""
    # Try Clerk user ID from auth state
    user_id = getattr(request.state, "user", None)
    if user_id:
        return f"user:{user_id}"

    # Fallback to IP
    client = request.client
    ip = client.host if client else "unknown"
    return f"ip:{ip}"


def _is_rate_limited(key: str, limit: int) -> tuple[bool, int]:
    """Check if the key has exceeded its rate limit.

    Returns (is_limited, remaining_requests).
    """
    now = time.time()
    window_start = now - WINDOW_SECONDS

    # Clean old entries
    _request_log[key] = [t for t in _request_log[key] if t > window_start]

    current_count = len(_request_log[key])
    remaining = max(0, limit - current_count)

    if current_count >= limit:
        return True, 0

    # Record this request
    _request_log[key].append(now)
    return False, remaining - 1


class RateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware that enforces per-user rate limits."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for health check
        if request.url.path == "/api/health":
            return await call_next(request)

        # Skip for docs
        if request.url.path in ("/docs", "/redoc", "/openapi.json"):
            return await call_next(request)

        key = _get_user_key(request)
        is_authenticated = key.startswith("user:")
        
        # Differentiate between expensive AI endpoints and general endpoints
        is_ai_endpoint = request.url.path.startswith("/api/v1/research")
        
        if is_ai_endpoint:
            limit = RATE_LIMIT_AI
            bucket_key = f"ai:{key}"
        else:
            limit = RATE_LIMIT_GENERAL_AUTH if is_authenticated else RATE_LIMIT_GENERAL_UNAUTH
            bucket_key = f"gen:{key}"

        is_limited, remaining = _is_rate_limited(bucket_key, limit)

        if is_limited:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Please try again later.",
                    "retry_after_seconds": WINDOW_SECONDS,
                },
                headers={
                    "Retry-After": str(WINDOW_SECONDS),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                },
            )

        response = await call_next(request)

        # Add rate limit headers to all responses
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)

        return response
