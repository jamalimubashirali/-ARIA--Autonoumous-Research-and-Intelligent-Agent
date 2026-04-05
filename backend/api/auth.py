import json
import httpx
import jwt
import logging
from jwt import PyJWKClient
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from config import settings

logger = logging.getLogger(__name__)


def _cors_headers(request: Request) -> dict:
    origin = request.headers.get("origin")
    if origin and origin in settings.allowed_origins_list:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}



async def clerk_auth_middleware(request: Request, call_next):
    # Only protect /api/v1 routes except webhooks
    if not request.url.path.startswith("/api/v1") or request.url.path.endswith("stripe/webhook"):
        return await call_next(request)

    # Let CORS preflight through without auth
    if request.method == "OPTIONS":
        return await call_next(request)

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        logger.warning(f"[Auth] Missing/invalid Authorization header for {request.method} {request.url.path}")
        return JSONResponse(
            status_code=401,
            content={"detail": "UNAUTHORIZED - Missing JWT"},
            headers=_cors_headers(request),
        )

    token = auth_header.split(" ")[1]
    
    try:
        # Get unverified headers to find key ID
        unverified_header = jwt.get_unverified_header(token)
        
        jwks_client = PyJWKClient(settings.clerk_jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False, "verify_iss": False} 
        )

        # Attach user info to request state
        request.state.user = payload.get("sub") # Clerk User ID
        
    except Exception as e:
        logger.warning(f"[Auth] Token verification failed for {request.method} {request.url.path}: {e}")
        return JSONResponse(
            status_code=401,
            content={"detail": f"UNAUTHORIZED - {str(e)}"},
            headers=_cors_headers(request),
        )
        
    response = await call_next(request)
    return response
