from uuid import uuid4

from firebase_admin import storage


def upload_bytes(
    data: bytes,
    filename: str,
    content_type: str,
):
    bucket = storage.bucket()

    extension = filename.split(".")[-1]

    path = f"albums/{uuid4()}.{extension}"

    blob = bucket.blob(path)

    blob.upload_from_string(
        data,
        content_type=content_type
    )

    blob.make_public()

    return {
        "path": path,
        "url": blob.public_url,
    }