from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mortgage_api.router import router

app = FastAPI(title="Mortgage Comparison API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://remortgage-helper.web.app",
        "https://remortgage-helper.firebaseapp.com",
    ],
    allow_methods=["POST"],
    allow_headers=["*"],
)

app.include_router(router)
