from fastapi import FastAPI

from .router import router

app = FastAPI(title="Mortgage Comparison API")

# CORS is handled by Cloud Functions @https_fn.on_request(cors=...)
# For local development, Vite proxy handles CORS

app.include_router(router)
