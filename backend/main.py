from firebase_functions import https_fn, options
from firebase_admin import initialize_app, app_check
from firebase_admin.exceptions import FirebaseError

# Import the FastAPI app
from src.mortgage_api.main import app as fastapi_app

# Initialize Firebase Admin
initialize_app()

# Set global options
options.set_global_options(max_instances=10, memory=options.MemoryOption.MB_512)


def verify_app_check_token(request: https_fn.Request) -> bool:
    """
    Verify the App Check token from the request headers.
    Returns True if valid, False otherwise.
    """
    app_check_token = request.headers.get('X-Firebase-AppCheck')

    if not app_check_token:
        return False

    try:
        # Verify the token
        app_check.verify_token(app_check_token)
        return True
    except (ValueError, FirebaseError) as e:
        print(f"App Check token verification failed: {e}")
        return False


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
    if not verify_app_check_token(req):
        return https_fn.Response(
            response=b'{"error": "Invalid or missing App Check token"}',
            status=403,
            headers={"Content-Type": "application/json"}
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
