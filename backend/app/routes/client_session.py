from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies.client_auth import (
    AuthenticatedClient,
    get_authenticated_client,
)


router = APIRouter(
    prefix="/client/session",
    tags=["Client Session"],
)


@router.get("")
def get_client_session(
    client: Annotated[
        AuthenticatedClient,
        Depends(get_authenticated_client),
    ],
):
    return {
        "id": client.id,
        "uid": client.uid,
        "name": client.name,
        "email": client.email,
    }
