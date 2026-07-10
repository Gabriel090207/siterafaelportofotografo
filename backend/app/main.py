from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.firebase.firebase

from app.routes.auth import router as auth_router
from app.routes.google import router as google_router

app = FastAPI(
    title="Rafael Porto API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(google_router)


@app.get("/")
def root():
    return {
        "message": "API Online 🚀"
    }