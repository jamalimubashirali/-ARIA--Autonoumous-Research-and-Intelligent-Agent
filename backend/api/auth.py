import json
import httpx
import jwt
from jwt import PyJWKClient
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from config import settings



async def clerk_auth_middleware(request: Request, call_next):
    # Only protect /api/v1 routes except webhooks
    if not request.url.path.startswith("/api/v1") or request.url.path.endswith("stripe/webhook"):
        return await call_next(request)
        
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "UNAUTHORIZED - Missing JWT"})

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
        return JSONResponse(status_code=401, content={"detail": f"UNAUTHORIZED - {str(e)}"})
        
    response = await call_next(request)
    return response
