from typing import Annotated

from fastapi import APIRouter, Depends

from firebase_admin import auth

from app.models.auth import CreateUserRequest
from app.dependencies.admin_auth import AuthenticatedAdmin, get_authenticated_admin


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post("/create-user")
def create_user(
    data: CreateUserRequest,
    _admin: Annotated[AuthenticatedAdmin, Depends(get_authenticated_admin)],
):

    user = auth.create_user(
        email=data.email,
        password=data.password,
    )

    return {
        "uid": user.uid,
        "email": user.email,
    }
