"""
Rate limiting middleware for ARIA API using Redis.

Uses a sliding window per user (Clerk ID) stored in Redis.
Configurable:
  - 10 requests per minute for expensive AI endpoints
  - 100 requests per minute for general authenticated traffic
  - 30 requests per minute for unauthenticated
"""
import time
from typing import Callable
import redis.asyncio as redis
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from config import settings

# Initialize Redis client globally
redis_client = redis.from_url(settings.redis_url, decode_responses=True)

# Rate limits are pulled directly from `settings` in config.py


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


async def _is_rate_limited(key: str, limit: int) -> tuple[bool, int]:
    """Check if the key has exceeded its rate limit in Redis.

    Returns (is_limited, remaining_requests).
    """
    now = time.time()
    window_start = now - settings.WINDOW_SECONDS
    redis_key = f"ratelimit:{key}"

    # Use a pipeline for atomic operations
    pipeline = redis_client.pipeline()
    
    # Remove old entries
    pipeline.zremrangebyscore(redis_key, 0, window_start)
    
    # Add new entry (score and value are both timestamp)
    pipeline.zadd(redis_key, {str(now): now})
    
    # Count requests in window
    pipeline.zcard(redis_key)
    
    # Set TTL on the key so it cleans up entirely if unused
    pipeline.expire(redis_key, settings.WINDOW_SECONDS)
    
    results = await pipeline.execute()
    current_count = results[2]  # Result of zcard
    
    remaining = max(0, limit - current_count)
    if current_count > limit:
        return True, 0
    return False, remaining


class RateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware that enforces per-user rate limits using Redis."""

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
            limit = settings.RATE_LIMIT_AI
            bucket_key = f"ai:{key}"
        else:
            limit = settings.RATE_LIMIT_GENERAL_AUTH if is_authenticated else settings.RATE_LIMIT_GENERAL_UNAUTH
            bucket_key = f"gen:{key}"

        try:
            is_limited, remaining = await _is_rate_limited(bucket_key, limit)
        except Exception as e:
            # If Redis connection fails, bypass rate limiting (fail open) rather than bringing down the API
            # Silencing the exception log to prevent terminal spam when Redis is not installed locally
            is_limited, remaining = False, limit

        if is_limited:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Please try again later.",
                    "retry_after_seconds": settings.WINDOW_SECONDS,
                },
                headers={
                    "Retry-After": str(settings.WINDOW_SECONDS),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                },
            )

        response = await call_next(request)

        # Add rate limit headers to all responses
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)

        return response
