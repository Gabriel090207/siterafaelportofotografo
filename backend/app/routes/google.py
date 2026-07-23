from fastapi import APIRouter
from pydantic import BaseModel

from app.services.google_drive import (
    get_drive_service,
    upload_album_file_to_drive,
    upload_feed_file_to_drive,
    get_file_metadata,
    download_file,
    copy_picker_file_to_drive,
    copy_picker_album_file_to_drive,
    rename_drive_folder,
    delete_drive_file,
    move_drive_folder,
    delete_drive_folder
)

from app.services.storage import (
    upload_bytes,
)

from app.services.storage import (
    copy_storage_file,
    move_storage_file,
    move_storage_folder,
)

router = APIRouter(
    prefix="/google",
    tags=["Google"]
)


class ImportDriveRequest(BaseModel):
    fileId: str
    accessToken: str

class CopyPickerFileRequest(BaseModel):
    fileId: str
    accessToken: str
    albumCategory: str
    albumName: str
    folder: str

class CopyPickerAlbumFileRequest(BaseModel):
    fileId: str
    accessToken: str
    clientName: str
    albumName: str
    category: str

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
        folder="drive",
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


@router.post("/copy-picker-file")
async def copy_picker_file(
    data: CopyPickerFileRequest,
):

    service = get_drive_service()

    result = copy_picker_file_to_drive(
        access_token=data.accessToken,
        file_id=data.fileId,
        service=service,
        album_category=data.albumCategory,
        album_name=data.albumName,
        folder=data.folder,
    )

    return result


@router.post("/copy-picker-album-file")
async def copy_picker_album_file(
    data: CopyPickerAlbumFileRequest,
):

    service = get_drive_service()

    return copy_picker_album_file_to_drive(
        access_token=data.accessToken,
        file_id=data.fileId,
        service=service,
        client_name=data.clientName,
        album_name=data.albumName,
        category=data.category,
    )

@router.post("/copy")
def copy_drive_file(
    data: dict,
):
    result = copy_storage_file(
        source_path=data["sourcePath"],
        destination_path=data["destinationPath"],
    )

    return result


@router.post("/move")
def move_drive_file(
    data: dict,
):

    result = move_storage_file(
        source_path=data["sourcePath"],
        destination_path=data["destinationPath"],
    )

    return result


@router.post("/storage/move-folder")
def move_storage_folder_route(
    data: dict,
):

    return move_storage_folder(
        source_folder=data["sourceFolder"],
        destination_folder=data["destinationFolder"],
    )


@router.post("/move-folder")
def move_drive_folder_route(
    data: dict,
):

    return move_drive_folder(
        source_folder_id=data["sourceFolderId"],
        destination_folder_id=data["destinationFolderId"],
    )

from fastapi import Form, UploadFile, File

from app.services.google_drive import (
    get_drive_service,
    upload_album_file_to_drive,
)

@router.post("/upload-album-file")
async def upload_album_file(

    file: UploadFile = File(...),

    clientName: str = Form(...),

    albumName: str = Form(...),

    category: str = Form(...),

):

    service = get_drive_service()

    file_bytes = await file.read()

    result = upload_album_file_to_drive(

        service=service,

        file_bytes=file_bytes,

        filename=file.filename,

        content_type=file.content_type,

        client_name=clientName,

        album_name=albumName,

        category=category,

    )

    return result


@router.post("/upload-feed-file")
async def upload_feed_file(

    file: UploadFile = File(...),

    albumCategory: str = Form(...),

    albumName: str = Form(...),

    folder: str = Form(...),

):

    print("\n========== INÍCIO UPLOAD FEED ==========")
    print(f"Arquivo: {file.filename}")
    print(f"Tipo: {file.content_type}")
    print(f"Categoria: {albumCategory}")
    print(f"Álbum: {albumName}")
    print(f"Pasta: {folder}")

    service = get_drive_service()

    print("✔ Serviço do Drive criado")

    file_bytes = await file.read()

    print(f"✔ Arquivo lido: {len(file_bytes)} bytes")

    result = upload_feed_file_to_drive(

        service=service,

        file_bytes=file_bytes,

        filename=file.filename,

        content_type=file.content_type,

        album_category=albumCategory,

        album_name=albumName,

        folder=folder,

    )

    print("✔ Upload concluído")
    print(result)
    print("========== FIM UPLOAD FEED ==========\n")

    return result



@router.post("/rename-folder")
def rename_folder(data: dict):

    return rename_drive_folder(

        folder_id=data["folderId"],

        new_name=data["newName"],

    )


@router.post("/delete-file")
def delete_file_from_drive(
    data: dict,
):

    return delete_drive_file(
        file_id=data["fileId"],
    )


@router.post("/delete-folder")
def delete_folder_from_drive(
    data: dict,
):

    return delete_drive_folder(
        folder_id=data["folderId"],
    )