from fastapi import APIRouter

from firebase_admin import auth

from app.models.auth import CreateUserRequest


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post("/create-user")
def create_user(data: CreateUserRequest):

    user = auth.create_user(
        email=data.email,
        password=data.password,
    )

    return {
        "uid": user.uid,
        "email": user.email,
    }