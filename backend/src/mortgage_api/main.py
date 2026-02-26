import os
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from .router import router

app = FastAPI(title="Mortgage Comparison API")

# CORS for local development
if os.getenv("LOCAL_DEV"):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # App Check verification for local development
    @app.middleware("http")
    async def verify_app_check_local(request: Request, call_next):
        print(f"\n[App Check Middleware] {request.method} {request.url.path}")

        # Skip OPTIONS
        if request.method == "OPTIONS":
            print("[App Check Middleware] Skipping OPTIONS request")
            return await call_next(request)

        # Check for App Check token
        token = request.headers.get("x-firebase-appcheck")
        if not token:
            print("[App Check Middleware] ❌ No token found in headers")
            return Response(
                content='{"error": "Missing App Check token"}',
                status_code=403,
                media_type="application/json"
            )

        print(f"[App Check Middleware] Token received: {token[:30]}...")

        # Verify token using firebase-admin
        try:
            from firebase_admin import app_check, credentials, initialize_app
            import firebase_admin

            # Initialize Firebase Admin if not already initialized
            if not firebase_admin._apps:
                print("[App Check Middleware] Initializing Firebase Admin...")
                cred = credentials.ApplicationDefault()
                initialize_app(cred, {
                    'projectId': 'remortgage-helper'
                })

            print("[App Check Middleware] Verifying token...")
            decoded_token = app_check.verify_token(token)
            print(f"[App Check Middleware] ✅ Token verified successfully")
            print(f"[App Check Middleware] Token claims: {decoded_token}")
        except Exception as e:
            print(f"[App Check Middleware] ❌ Token verification failed: {e}")
            return Response(
                content=f'{{"error": "Invalid App Check token: {str(e)}"}}',
                status_code=403,
                media_type="application/json"
            )

        return await call_next(request)

app.include_router(router)
