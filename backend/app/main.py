from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.firebase.firebase

from app.routes.auth import router as auth_router
from app.routes.album import router as album_router
from app.routes.album_client import router as album_client_router
from app.routes.album_feed import (
    public_router as public_album_feed_router,
    router as album_feed_router,
)
from app.routes.feed_category import (
    public_router as public_feed_category_router,
    router as feed_category_router,
)
from app.routes.client_testimonials import router as client_testimonials_router
from app.routes.client_selections import router as client_selections_router
from app.routes.client_session import router as client_session_router
from app.routes.client_albums import router as client_albums_router
from app.routes.google import router as google_router
from app.routes.selection import router as selection_router
from app.routes.media import router as media_router

app = FastAPI(
    title="Rafael Porto API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(album_router)
app.include_router(album_client_router)
app.include_router(album_feed_router)
app.include_router(public_album_feed_router)
app.include_router(feed_category_router)
app.include_router(public_feed_category_router)
app.include_router(client_testimonials_router)
app.include_router(client_selections_router)
app.include_router(client_session_router)
app.include_router(client_albums_router)
app.include_router(google_router)
app.include_router(selection_router)
app.include_router(media_router)


@app.get("/")
def root():
    return {
        "message": "API Online 🚀"
    }
