import asyncio
import json
import logging
import sys
import traceback

from firebase_admin import initialize_app
from firebase_functions import https_fn, options
from src.mortgage_api.app_check import verify_token

# Import the FastAPI app
from src.mortgage_api.main import app as fastapi_app


# Configure structured JSON logging for Cloud Run (Gen 2 Cloud Functions)
class _CloudRunFormatter(logging.Formatter):
    _SEVERITY = {
        logging.DEBUG: "DEBUG",
        logging.INFO: "INFO",
        logging.WARNING: "WARNING",
        logging.ERROR: "ERROR",
        logging.CRITICAL: "CRITICAL",
    }

    def format(self, record):
        entry = {
            "severity": self._SEVERITY.get(record.levelno, "DEFAULT"),
            "message": record.getMessage(),
        }
        if record.exc_info and record.exc_info[0]:
            entry["stack_trace"] = self.formatException(record.exc_info)
        return json.dumps(entry)


_handler = logging.StreamHandler(sys.stdout)
_handler.setFormatter(_CloudRunFormatter())
logging.root.handlers = [_handler]
logging.root.setLevel(logging.INFO)

logger = logging.getLogger(__name__)

# Initialize Firebase Admin
initialize_app()

# Set global options
options.set_global_options(max_instances=10, memory=options.MemoryOption.MB_512)


@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=[
            "http://localhost:5173",
            "https://remortgage-helper.web.app",
            "https://remortgage-helper.firebaseapp.com",
            "https://remortgage-helper.com",
            "https://www.remortgage-helper.com",
        ],
        cors_methods=["POST", "OPTIONS"],
    )
)
def api(req: https_fn.Request) -> https_fn.Response:
    """
    Cloud Function that wraps the FastAPI ASGI application.
    Now includes App Check token verification.
    """
    # Skip verification for OPTIONS (CORS preflight)
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    # Verify App Check token
    token = req.headers.get("X-Firebase-AppCheck")
    is_valid, error_msg = verify_token(token)
    if not is_valid:
        logger.warning(f"App Check rejected: {error_msg}")
        return https_fn.Response(
            response=json.dumps({"error": error_msg}).encode(),
            status=403,
            headers={"Content-Type": "application/json"},
        )

    logger.info("App Check token verified, forwarding to ASGI app")

    # Convert Firebase Request to ASGI scope
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": req.method,
        "scheme": "https",
        "path": req.path,
        "query_string": req.query_string.encode() if req.query_string else b"",
        "root_path": "",
        "headers": [
            (k.lower().encode(), v.encode()) for k, v in req.headers.items()
        ],
        "server": ("functions.firebase.com", 443),
        "client": (req.environ.get("REMOTE_ADDR", "127.0.0.1"), 0),
    }

    # Request body
    body = req.get_data()
    body_sent = False

    async def receive():
        nonlocal body_sent
        if not body_sent:
            body_sent = True
            return {
                "type": "http.request",
                "body": body,
                "more_body": False,
            }
        return {"type": "http.disconnect"}

    # Response collection
    status_code = 200
    response_headers = []
    body_parts = []

    async def send(message):
        nonlocal status_code, response_headers

        if message["type"] == "http.response.start":
            status_code = message["status"]
            response_headers = message.get("headers", [])
        elif message["type"] == "http.response.body":
            body = message.get("body", b"")
            if body:
                body_parts.append(body)

    # Run the ASGI app
    async def run_asgi():
        await fastapi_app(scope, receive, send)

    try:
        asyncio.run(run_asgi())
    except Exception:
        tb = traceback.format_exc()
        print(f"ASGI_ERROR: {tb}", flush=True)
        logger.error("ASGI application failed: " + tb)
        return https_fn.Response(
            response=json.dumps({"error": "Internal server error"}).encode(),
            status=500,
            headers={"Content-Type": "application/json"},
        )

    # Build Firebase Response
    response_body = b"".join(body_parts)

    return https_fn.Response(
        response=response_body,
        status=status_code,
        headers={
            k.decode() if isinstance(k, bytes) else k: v.decode()
            if isinstance(v, bytes)
            else v
            for k, v in response_headers
        },
    )
