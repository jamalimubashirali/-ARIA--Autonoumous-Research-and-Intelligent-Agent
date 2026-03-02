import json
import httpx
from jose import jwt, jwk
from jose.utils import base64url_decode
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from config import settings

# In-memory cache for the JWKS
_jwks_cache = None

async def get_jwks():
    global _jwks_cache
    if _jwks_cache is None and settings.clerk_jwks_url:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(settings.clerk_jwks_url)
                response.raise_for_status()
                _jwks_cache = response.json()
            except Exception as e:
                print(f"Failed to fetch JWKS: {e}")
                return None
    return _jwks_cache

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
        
        jwks = await get_jwks()
        if not jwks:
            # Fallback to simple secret verification if JWKS is not available
            # Warning: Production clerk apps should strictly use JWKS
            payload = jwt.decode(token, settings.clerk_secret_key, algorithms=["HS256", "RS256"])
        else:
            rsa_key = {}
            for key in jwks["keys"]:
                if key["kid"] == unverified_header["kid"]:
                    rsa_key = {
                        "kty": key["kty"],
                        "kid": key["kid"],
                        "use": key["use"],
                        "n": key["n"],
                        "e": key["e"]
                    }
                    break
            
            if not rsa_key:
                return JSONResponse(status_code=401, content={"detail": "UNAUTHORIZED - Invalid key"})
                
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=["RS256"],
                # Clerk usually expects the audience or issuer to be set
                options={"verify_aud": False, "verify_iss": False} 
            )

        # Attach user info to request state
        request.state.user = payload.get("sub") # Clerk User ID
        
    except jwt.JWTError as e:
        return JSONResponse(status_code=401, content={"detail": f"UNAUTHORIZED - {str(e)}"})
        
    response = await call_next(request)
    return response

def setup_auth(app):
    app.middleware("http")(clerk_auth_middleware)
