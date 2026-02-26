import json
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from .router import router

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Firebase Admin SDK (initialized once at startup)
firebase_app_check = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup, cleanup on shutdown."""
    global firebase_app_check

    # Initialize Firebase Admin SDK once at startup (for local dev with App Check)
    if os.getenv("LOCAL_DEV"):
        try:
            from firebase_admin import app_check, credentials, initialize_app

            project_id = os.getenv("PROJECT_ID")
            if not project_id:
                logger.error("PROJECT_ID environment variable not set")
                raise ValueError("PROJECT_ID is required for App Check")

            logger.info(f"Initializing Firebase Admin SDK for project: {project_id}")
            cred = credentials.ApplicationDefault()
            initialize_app(cred, {"projectId": project_id})
            firebase_app_check = app_check
            logger.info("Firebase Admin SDK initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
            raise

    yield

    # Cleanup (if needed)
    logger.info("Shutting down application")


app = FastAPI(title="Mortgage Comparison API", lifespan=lifespan)

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
        logger.debug(f"{request.method} {request.url.path}")

        # Skip OPTIONS (CORS preflight)
        if request.method == "OPTIONS":
            logger.debug("Skipping OPTIONS request")
            return await call_next(request)

        # Verify App Check token
        from .app_check import verify_token

        token = request.headers.get("x-firebase-appcheck")
        logger.debug(f"App Check token received: {token[:30] if token else 'None'}...")

        if firebase_app_check is None:
            logger.error("Firebase App Check not initialized")
            return Response(
                content='{"error": "App Check verification not available"}',
                status_code=500,
                media_type="application/json",
            )

        is_valid, error_msg = verify_token(token)
        if not is_valid:
            return Response(
                content=json.dumps({"error": error_msg}),
                status_code=403,
                media_type="application/json",
            )

        return await call_next(request)


app.include_router(router)
