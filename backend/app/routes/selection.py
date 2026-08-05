from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from io import BytesIO
from zipfile import ZIP_DEFLATED, ZipFile

from firebase_admin import storage
from pydantic import BaseModel

from app.firebase.firestore import db

router = APIRouter(
    prefix="/selection",
    tags=["Selection"],
)


class DownloadSelectionRequest(BaseModel):
    clientId: str
    selectionId: str


@router.post("/download")
async def download_selection(
    data: DownloadSelectionRequest,
):
    selection_ref = (
        db.collection("clients")
        .document(data.clientId)
        .collection("selections")
        .document(data.selectionId)
    )

    selection_doc = selection_ref.get()

    if not selection_doc.exists:
        raise HTTPException(
            status_code=404,
            detail="Seleção não encontrada.",
        )

    selection = selection_doc.to_dict()

    
    album_ref = (
        db.collection("AlbumClient")
        .document(selection["albumId"])
    )

    album_doc = album_ref.get()

   

    if not album_doc.exists:
        raise HTTPException(
            status_code=404,
            detail="Álbum não encontrado.",
        )

    album = album_doc.to_dict()

    selected_names = {
        photo["name"]
        for photo in selection["photos"]
    }

    photos_to_download = [
        photo
        for photo in album["highQualityPhotos"]
        if photo["name"] in selected_names
    ]

    bucket = storage.bucket()

    zip_buffer = BytesIO()

    with ZipFile(
        zip_buffer,
        "w",
        ZIP_DEFLATED,
    ) as zip_file:

        for photo in photos_to_download:

            blob = bucket.blob(
                photo["storagePath"]
            )

            file_bytes = blob.download_as_bytes()

            zip_file.writestr(
                photo["name"],
                file_bytes,
            )

    zip_buffer.seek(0)

    filename = (
        f'{selection["selectionName"]}.zip'
    )

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )