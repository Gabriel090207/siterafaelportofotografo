from uuid import uuid4

from firebase_admin import storage


def upload_bytes(
    data: bytes,
    filename: str,
    content_type: str,
    folder: str = "albums",
):
    bucket = storage.bucket()

    extension = filename.split(".")[-1]

    path = f"{folder}/{uuid4()}.{extension}"

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

def copy_storage_file(
    source_path: str,
    destination_path: str,
):
    bucket = storage.bucket()

    source_blob = bucket.blob(source_path)

    if not source_blob.exists():
        raise FileNotFoundError(
            f"Arquivo não encontrado no Storage: {source_path}"
        )

    copied_blob = bucket.copy_blob(
        source_blob,
        bucket,
        destination_path,
    )

    copied_blob.make_public()

    return {
        "path": destination_path,
        "url": copied_blob.public_url,
    }


def move_storage_file(
    source_path: str,
    destination_path: str,
):
    result = copy_storage_file(
        source_path,
        destination_path,
    )

    bucket = storage.bucket()

    source_blob = bucket.blob(
        source_path,
    )

    source_blob.delete()

    return result



def move_storage_folder(
    source_folder: str,
    destination_folder: str,
):
    print("\n========== MOVE STORAGE FOLDER ==========")
    print("SOURCE:", source_folder)
    print("DESTINATION:", destination_folder)

    try:

        bucket = storage.bucket()

        blobs = bucket.list_blobs(
            prefix=source_folder
        )

        moved_files = []

        for blob in blobs:

            print("ARQUIVO ENCONTRADO:", blob.name)

            source_path = blob.name

            destination_path = source_path.replace(
                source_folder,
                destination_folder,
                1,
            )

            print("COPIANDO PARA:", destination_path)

            copied_blob = bucket.copy_blob(
                blob,
                bucket,
                destination_path,
            )

            copied_blob.make_public()

            print("COPIADO")

            blob.delete()

            print("REMOVIDO:", source_path)

            moved_files.append({

                "oldPath": source_path,

                "newPath": destination_path,

                "url": copied_blob.public_url,

            })

        print("TOTAL:", len(moved_files))
        print("========== FIM MOVE STORAGE ==========\n")

        return {

            "success": True,

            "filesMoved": len(moved_files),

            "files": moved_files,

        }

    except Exception as e:

        import traceback

        print("\n========== ERRO MOVE STORAGE ==========")
        traceback.print_exc()
        print("=======================================\n")

        raise