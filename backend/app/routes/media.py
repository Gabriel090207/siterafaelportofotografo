import ipaddress
import re
import socket
import ssl
import warnings

from io import BytesIO
from pathlib import PurePosixPath
from typing import Annotated
from urllib.parse import urljoin, urlsplit

import certifi
import urllib3

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, ConfigDict, Field

from app.dependencies.admin_auth import (
    AuthenticatedAdmin,
    get_authenticated_admin,
)


router = APIRouter(prefix="/media", tags=["Media"])

MAX_EXTERNAL_IMAGE_BYTES = 25 * 1024 * 1024
MAX_EXTERNAL_IMAGE_REDIRECTS = 3
EXTERNAL_IMAGE_TIMEOUT_SECONDS = 10
ALLOWED_IMAGE_FORMATS = {
    "JPEG": ("image/jpeg", ".jpg"),
    "PNG": ("image/png", ".png"),
    "WEBP": ("image/webp", ".webp"),
}
REDIRECT_STATUS_CODES = {301, 302, 303, 307, 308}
BLOCKED_HOSTNAMES = {
    "localhost",
    "metadata.google.internal",
    "metadata.google",
}


class ImportExternalImageRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2048)


def _invalid_external_image() -> HTTPException:
    return HTTPException(
        status_code=422,
        detail="A URL informada não contém uma imagem válida.",
    )


def _validate_external_url(url: str):
    try:
        parsed = urlsplit(url.strip())
        port = parsed.port
    except ValueError as error:
        raise _invalid_external_image() from error

    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise _invalid_external_image()

    if parsed.username or parsed.password or parsed.fragment:
        raise _invalid_external_image()

    expected_port = 443 if parsed.scheme == "https" else 80
    if port is not None and port != expected_port:
        raise _invalid_external_image()

    hostname = parsed.hostname.rstrip(".").lower()
    if (
        hostname in BLOCKED_HOSTNAMES
        or hostname.endswith(".localhost")
        or hostname.endswith(".local")
        or hostname.endswith(".internal")
    ):
        raise _invalid_external_image()

    try:
        address_info = socket.getaddrinfo(
            hostname,
            expected_port,
            type=socket.SOCK_STREAM,
        )
    except socket.gaierror as error:
        raise _invalid_external_image() from error

    addresses: list[str] = []
    for _, _, _, _, socket_address in address_info:
        address = socket_address[0]

        try:
            parsed_address = ipaddress.ip_address(address)
        except ValueError as error:
            raise _invalid_external_image() from error

        if not parsed_address.is_global:
            raise _invalid_external_image()

        normalized_address = str(parsed_address)
        if normalized_address not in addresses:
            addresses.append(normalized_address)

    if not addresses:
        raise _invalid_external_image()

    return parsed, hostname, expected_port, addresses


def _request_pinned_address(url: str):
    parsed, hostname, port, addresses = _validate_external_url(url)
    request_target = parsed.path or "/"

    if parsed.query:
        request_target = f"{request_target}?{parsed.query}"

    host_header = hostname
    last_error: Exception | None = None

    for address in addresses:
        pool = None

        try:
            if parsed.scheme == "https":
                pool = urllib3.HTTPSConnectionPool(
                    address,
                    port=port,
                    timeout=urllib3.Timeout(
                        connect=EXTERNAL_IMAGE_TIMEOUT_SECONDS,
                        read=EXTERNAL_IMAGE_TIMEOUT_SECONDS,
                    ),
                    maxsize=1,
                    block=True,
                    retries=False,
                    cert_reqs=ssl.CERT_REQUIRED,
                    ca_certs=certifi.where(),
                    assert_hostname=hostname,
                    server_hostname=hostname,
                )
            else:
                pool = urllib3.HTTPConnectionPool(
                    address,
                    port=port,
                    timeout=urllib3.Timeout(
                        connect=EXTERNAL_IMAGE_TIMEOUT_SECONDS,
                        read=EXTERNAL_IMAGE_TIMEOUT_SECONDS,
                    ),
                    maxsize=1,
                    block=True,
                    retries=False,
                )

            response = pool.urlopen(
                "GET",
                request_target,
                headers={
                    "Host": host_header,
                    "Accept": "image/jpeg,image/png,image/webp",
                    "User-Agent": "RafaelPortoMediaImporter/1.0",
                },
                redirect=False,
                preload_content=False,
            )
            return response, pool
        except (urllib3.exceptions.HTTPError, OSError) as error:
            last_error = error
            if pool is not None:
                pool.close()

    raise HTTPException(
        status_code=502,
        detail="Não foi possível importar a imagem externa.",
    ) from last_error


def _download_external_image(initial_url: str) -> tuple[bytes, str]:
    current_url = initial_url.strip()

    for redirect_count in range(MAX_EXTERNAL_IMAGE_REDIRECTS + 1):
        response, pool = _request_pinned_address(current_url)

        try:
            if response.status in REDIRECT_STATUS_CODES:
                location = response.headers.get("Location")

                if not location or redirect_count >= MAX_EXTERNAL_IMAGE_REDIRECTS:
                    raise _invalid_external_image()

                current_url = urljoin(current_url, location)
                continue

            if response.status < 200 or response.status >= 300:
                raise HTTPException(
                    status_code=502,
                    detail="Não foi possível importar a imagem externa.",
                )

            content_length = response.headers.get("Content-Length")
            if content_length:
                try:
                    if int(content_length) > MAX_EXTERNAL_IMAGE_BYTES:
                        raise HTTPException(
                            status_code=413,
                            detail="A imagem externa excede o limite de 25 MB.",
                        )
                except ValueError:
                    pass

            content = bytearray()
            for chunk in response.stream(64 * 1024, decode_content=True):
                content.extend(chunk)

                if len(content) > MAX_EXTERNAL_IMAGE_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail="A imagem externa excede o limite de 25 MB.",
                    )

            return bytes(content), current_url
        finally:
            response.release_conn()
            pool.close()

    raise _invalid_external_image()


def _validate_image_content(content: bytes) -> tuple[str, str]:
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)

            with Image.open(BytesIO(content)) as image:
                image.verify()
                image_format = image.format
    except (
        UnidentifiedImageError,
        OSError,
        SyntaxError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
    ) as error:
        raise _invalid_external_image() from error

    if image_format not in ALLOWED_IMAGE_FORMATS:
        raise _invalid_external_image()

    return ALLOWED_IMAGE_FORMATS[image_format]


def _safe_filename(final_url: str, extension: str) -> str:
    path_name = PurePosixPath(urlsplit(final_url).path).name
    stem = PurePosixPath(path_name).stem
    safe_stem = re.sub(r"[^A-Za-z0-9_-]+", "-", stem).strip("-")
    safe_stem = safe_stem[:80] or "imagem-importada"
    return f"{safe_stem}{extension}"


@router.post("/import-external-image")
def import_external_image(
    data: ImportExternalImageRequest,
    _authenticated_admin: Annotated[
        AuthenticatedAdmin,
        Depends(get_authenticated_admin),
    ],
):
    content, final_url = _download_external_image(data.url)
    media_type, extension = _validate_image_content(content)
    filename = _safe_filename(final_url, extension)

    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
