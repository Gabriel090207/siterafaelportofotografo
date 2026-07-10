from fastapi import APIRouter
from pydantic import BaseModel

from app.services.google_drive import (
    get_file_metadata,
    download_file,
)

from app.services.storage import (
    upload_bytes,
)

router = APIRouter(
    prefix="/google",
    tags=["Google"]
)


class ImportDriveRequest(BaseModel):
    fileId: str
    accessToken: str


@router.post("/import")
async def import_from_drive(data: ImportDriveRequest):

    metadata = get_file_metadata(
        data.accessToken,
        data.fileId,
    )

    image = download_file(
        data.accessToken,
        data.fileId,
    )

    upload = upload_bytes(
        data=image.read(),
        filename=metadata["name"],
        content_type=metadata["mimeType"],
    )

    return {
        "success": True,
        "file": {
            "id": metadata["id"],
            "name": metadata["name"],
            "mimeType": metadata["mimeType"],
            "size": metadata.get("size"),
        },
        "storage": upload,
    }