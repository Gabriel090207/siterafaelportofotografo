import re
import unicodedata
from datetime import datetime, timedelta, timezone
from io import BytesIO
from math import isfinite
from pathlib import PurePosixPath
from zipfile import ZIP_DEFLATED, ZipFile

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from firebase_admin import storage
from pydantic import BaseModel

from app.dependencies.client_auth import (
    AuthenticatedClient,
    get_authenticated_client,
)
from app.firebase.firestore import db


router = APIRouter(
    prefix="/album",
    tags=["Album"],
)


class DownloadAlbumRequest(BaseModel):
    albumId: str


def sanitize_download_filename(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    safe_value = re.sub(r"[^A-Za-z0-9._ -]+", "-", ascii_value)
    safe_value = re.sub(r"\s+", " ", safe_value).strip(" .-_")

    return safe_value or "album"


def get_zip_entry_name(
    folder: str,
    item: dict,
    used_names: set[str],
) -> str:
    original_name = str(item.get("name") or "").strip()
    storage_path = str(item.get("storagePath") or "").strip()
    filename = PurePosixPath(original_name or storage_path).name

    if not filename:
        filename = "arquivo"

    stem = PurePosixPath(filename).stem or "arquivo"
    suffix = PurePosixPath(filename).suffix
    candidate = f"{folder}/{filename}"
    counter = 2

    while candidate.casefold() in used_names:
        candidate = f"{folder}/{stem} ({counter}){suffix}"
        counter += 1

    used_names.add(candidate.casefold())

    return candidate


def validate_download_deadline(
    album: dict,
    now: datetime | None = None,
) -> None:
    download_days = album.get("highQualityDownloadDays")

    if download_days is None:
        return

    if (
        isinstance(download_days, bool)
        or not isinstance(download_days, (int, float))
        or not isfinite(download_days)
        or download_days <= 0
    ):
        raise HTTPException(
            status_code=422,
            detail="O prazo de download do álbum possui uma configuração inválida.",
        )

    created_at = album.get("createdAt")

    if not isinstance(created_at, datetime) or created_at.tzinfo is None:
        raise HTTPException(
            status_code=422,
            detail="A data de criação do álbum está ausente ou é inválida.",
        )

    current_time = now or datetime.now(timezone.utc)

    if current_time.tzinfo is None:
        raise ValueError("O horário atual deve conter informação de timezone.")

    expires_at = (
        created_at.astimezone(timezone.utc)
        + timedelta(days=download_days)
    )

    if current_time.astimezone(timezone.utc) >= expires_at:
        raise HTTPException(
            status_code=410,
            detail="O prazo de download deste álbum expirou.",
        )


@router.post("/download")
async def download_album(
    data: DownloadAlbumRequest,
    client: Annotated[
        AuthenticatedClient,
        Depends(get_authenticated_client),
    ],
):
    album_ref = (
        db.collection("AlbumClient")
        .document(data.albumId)
    )

    album_doc = album_ref.get()

    if not album_doc.exists:
        raise HTTPException(
            status_code=404,
            detail="Álbum não encontrado.",
        )

    album = album_doc.to_dict() or {}

    if album.get("clientId") != client.id:
        raise HTTPException(
            status_code=404,
            detail="Álbum não encontrado.",
        )

    validate_download_deadline(album)

    photos = album.get("highQualityPhotos") or []
    videos = album.get("highQualityVideos") or []
    files = [
        ("Fotos", item)
        for item in photos
    ] + [
        ("Videos", item)
        for item in videos
    ]

    if not files:
        raise HTTPException(
            status_code=404,
            detail="O álbum não possui arquivos em alta qualidade.",
        )

    for _, item in files:
        if not isinstance(item, dict) or not item.get("storagePath"):
            raise HTTPException(
                status_code=422,
                detail="Um arquivo em alta qualidade não possui storagePath.",
            )

    bucket = storage.bucket()
    zip_buffer = BytesIO()
    used_names: set[str] = set()

    with ZipFile(
        zip_buffer,
        "w",
        ZIP_DEFLATED,
    ) as zip_file:
        for folder, item in files:
            storage_path = str(item["storagePath"])
            display_name = item.get("name") or PurePosixPath(storage_path).name
            blob = bucket.blob(storage_path)

            try:
                if not blob.exists():
                    raise HTTPException(
                        status_code=404,
                        detail=f'Arquivo não encontrado no Storage: "{display_name}".',
                    )

                file_bytes = blob.download_as_bytes()
            except HTTPException:
                raise
            except Exception as error:
                raise HTTPException(
                    status_code=502,
                    detail=f'Não foi possível baixar o arquivo "{display_name}" do Storage.',
                ) from error

            zip_file.writestr(
                get_zip_entry_name(
                    folder,
                    item,
                    used_names,
                ),
                file_bytes,
            )

    zip_buffer.seek(0)

    album_name = str(
        album.get("name")
        or album.get("title")
        or "album"
    )
    filename = f"{sanitize_download_filename(album_name)}.zip"

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )
