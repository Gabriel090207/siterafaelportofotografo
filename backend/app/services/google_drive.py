import io
import os

from dotenv import load_dotenv

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

from googleapiclient.discovery import build
from googleapiclient.http import (
    MediaIoBaseDownload,
    MediaIoBaseUpload,
)

load_dotenv()

SCOPES = [
    "https://www.googleapis.com/auth/drive"
]


def get_drive_service():
    """
    Serviço usado pelo backend para fazer upload
    automático para o Drive do fotógrafo.
    """

    credentials = Credentials(
        token=None,
        refresh_token=os.getenv("GOOGLE_REFRESH_TOKEN"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=SCOPES,
    )

    credentials.refresh(Request())

    return build(
        "drive",
        "v3",
        credentials=credentials,
    )


def get_picker_drive_service(
    access_token: str,
):
    """
    Serviço usado pelo Google Picker.
    """

    return build(
        "drive",
        "v3",
        credentials=Credentials(access_token),
    )


def get_file_metadata(
    access_token: str,
    file_id: str,
):

    drive = get_picker_drive_service(
        access_token
    )

    return (
        drive.files()
        .get(
            fileId=file_id,
            fields="id,name,mimeType,size,thumbnailLink,webViewLink",
        )
        .execute()
    )


def download_file(
    access_token: str,
    file_id: str,
):

    drive = get_picker_drive_service(
        access_token
    )

    request = drive.files().get_media(
        fileId=file_id
    )

    file = io.BytesIO()

    downloader = MediaIoBaseDownload(
        file,
        request,
    )

    done = False

    while not done:
        _, done = downloader.next_chunk()

    file.seek(0)

    return file


def get_or_create_folder(
    service,
    name: str,
    parent_id: str | None = None,
) -> str:

    escaped_name = name.replace("'", "\\'")

    query = (
        "mimeType='application/vnd.google-apps.folder' "
        f"and name='{escaped_name}' "
        "and trashed=false"
    )

    if parent_id:
        query += f" and '{parent_id}' in parents"

    response = (
        service.files()
        .list(
            q=query,
            fields="files(id,name)",
            pageSize=1,
        )
        .execute()
    )

    folders = response.get(
        "files",
        [],
    )

    if folders:
        return folders[0]["id"]

    metadata = {
        "name": name,
        "mimeType": "application/vnd.google-apps.folder",
    }

    if parent_id:
        metadata["parents"] = [
            parent_id
        ]

    folder = (
        service.files()
        .create(
            body=metadata,
            fields="id",
        )
        .execute()
    )

    return folder["id"]


def upload_album_file_to_drive(
    service,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    client_name: str,
    album_name: str,
    category: str,
):

    root_folder = get_or_create_folder(
        service,
        "Rafael Porto Foto e Filme",
    )

    albums_folder = get_or_create_folder(
        service,
        "Albums",
        root_folder,
    )

    client_folder = get_or_create_folder(
        service,
        client_name,
        albums_folder,
    )

    album_folder = get_or_create_folder(
        service,
        album_name,
        client_folder,
    )

    category_folder = get_or_create_folder(
        service,
        category,
        album_folder,
    )

    media = MediaIoBaseUpload(
        io.BytesIO(file_bytes),
        mimetype=content_type,
        resumable=False,
    )

    metadata = {
        "name": filename,
        "parents": [
            category_folder
        ],
    }

    uploaded = (
        service.files()
        .create(
            body=metadata,
            media_body=media,
            fields="id,name",
        )
        .execute()
    )

    return {
        "file": uploaded,
        "albumFolderId": album_folder,
        "driveFileId": uploaded["id"],
    }


def upload_feed_file_to_drive(
    service,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    album_category: str,
    album_name: str,
    folder: str,
):
    """
    Estrutura:

    Rafael Porto Foto e Filme/
        Feed/
            Categoria do Álbum/
                Nome do Álbum/
                    Fotos/
                    Vídeos/
                    Categorias/
    """

    root_folder = get_or_create_folder(
        service,
        "Rafael Porto Foto e Filme",
    )

    feed_folder = get_or_create_folder(
        service,
        "Eventos",
        root_folder,
    )

    category_folder = get_or_create_folder(
        service,
        album_category,
        feed_folder,
    )

    album_folder = get_or_create_folder(
        service,
        album_name,
        category_folder,
    )

    parts = folder.split("/")

    parent = album_folder

    for part in parts:
        parent = get_or_create_folder(
            service,
            part,
            parent,
        )

    destination_folder = parent

    media = MediaIoBaseUpload(
        io.BytesIO(file_bytes),
        mimetype=content_type,
        resumable=False,
    )

    metadata = {
        "name": filename,
        "parents": [
            destination_folder,
        ],
    }

    uploaded = (
        service.files()
        .create(
            body=metadata,
            media_body=media,
            fields="id,name",
        )
        .execute()
    )

    return {
        "file": uploaded,
        "driveFolderId": album_folder,
        "driveFileId": uploaded["id"],
    }



def copy_picker_file_to_drive(
    access_token: str,
    file_id: str,
    service,
    album_category: str,
    album_name: str,
    folder: str,
):
    metadata = get_file_metadata(
        access_token,
        file_id,
    )

    file = download_file(
        access_token,
        file_id,
    )

    return upload_feed_file_to_drive(
        service=service,
        file_bytes=file.read(),
        filename=metadata["name"],
        content_type=metadata["mimeType"],
        album_category=album_category,
        album_name=album_name,
        folder=folder,
    )


def copy_picker_album_file_to_drive(
    access_token: str,
    file_id: str,
    service,
    client_name: str,
    album_name: str,
    category: str,
):
    metadata = get_file_metadata(
        access_token,
        file_id,
    )

    file = download_file(
        access_token,
        file_id,
    )

    return upload_album_file_to_drive(
        service=service,
        file_bytes=file.read(),
        filename=metadata["name"],
        content_type=metadata["mimeType"],
        client_name=client_name,
        album_name=album_name,
        category=category,
    )


def rename_drive_folder(
    folder_id: str,
    new_name: str,
):
    service = get_drive_service()

    updated = (
        service.files()
        .update(
            fileId=folder_id,
            body={
                "name": new_name,
            },
            fields="id,name",
        )
        .execute()
    )

    return updated


def move_drive_folder(
    source_folder_id: str,
    destination_folder_id: str,
):
    service = get_drive_service()

    files = (
        service.files()
        .list(
            q=f"'{source_folder_id}' in parents and trashed=false",
            fields="files(id,name)",
        )
        .execute()
    )

    moved = []

    for file in files.get("files", []):

        service.files().update(
            fileId=file["id"],
            addParents=destination_folder_id,
            removeParents=source_folder_id,
            fields="id,name",
        ).execute()

        moved.append(file)

    return {
        "success": True,
        "files": moved,
    }


def delete_drive_file(
    file_id: str,
):
    service = get_drive_service()

    service.files().delete(
        fileId=file_id,
    ).execute()

    return {
        "success": True,
        "deleted": file_id,
    }


def delete_drive_folder(
    folder_id: str,
):

    service = get_drive_service()

    service.files().delete(
        fileId=folder_id,
    ).execute()

    return {
        "success": True,
        "deleted": folder_id,
    }