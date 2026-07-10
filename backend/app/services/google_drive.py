from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


def get_drive_service(access_token: str):

    credentials = Credentials(access_token)

    return build(
        "drive",
        "v3",
        credentials=credentials
    )


def get_file_metadata(
    access_token: str,
    file_id: str
):

    drive = get_drive_service(access_token)

    return drive.files().get(
        fileId=file_id,
        fields="id,name,mimeType,size,thumbnailLink,webViewLink"
    ).execute()

from googleapiclient.http import MediaIoBaseDownload

import io


def download_file(
    access_token: str,
    file_id: str
):

    drive = get_drive_service(access_token)

    request = drive.files().get_media(
        fileId=file_id
    )

    file = io.BytesIO()

    downloader = MediaIoBaseDownload(
        file,
        request
    )

    done = False

    while not done:

        _, done = downloader.next_chunk()

    file.seek(0)

    return file