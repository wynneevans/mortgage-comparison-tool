from firebase_functions import https_fn, options
from firebase_admin import initialize_app

# Import the FastAPI app
from src.mortgage_api.main import app as fastapi_app
from src.mortgage_api.app_check import verify_token

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
        return https_fn.Response(
            response=f'{{"error": "{error_msg}"}}'.encode(),
            status=403,
            headers={"Content-Type": "application/json"},
        )

    import asyncio

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

    asyncio.run(run_asgi())

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
