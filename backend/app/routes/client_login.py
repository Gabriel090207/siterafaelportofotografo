from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, SecretStr, ValidationError
from starlette.concurrency import run_in_threadpool

from app.services.client_login import (
    ClientLoginService, InvalidClientLogin,
)


router = APIRouter(prefix="/client", tags=["Client Login"])


class ClientLoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    email: str = Field(max_length=320)
    password: SecretStr = Field(min_length=1, max_length=4096, repr=False)


def get_login_service():
    from app.firebase.firestore import db
    return ClientLoginService(db)


@router.post("/login")
async def login_client(request: Request):
    # Parse locally: FastAPI's default validation response can echo input/passwords.
    headers = {"Cache-Control": "no-store"}
    try:
        data = ClientLoginRequest.model_validate(await request.json())
    except (ValidationError, ValueError, UnicodeDecodeError):
        return JSONResponse(status_code=401, headers=headers,
                            content={"detail": "E-mail ou senha inválidos."})
    try:
        token = await run_in_threadpool(
            get_login_service().login, data.email, data.password.get_secret_value(),
        )
        return JSONResponse(content={"customToken": token}, headers=headers)
    except InvalidClientLogin:
        return JSONResponse(status_code=401, headers=headers,
                            content={"detail": "E-mail ou senha inválidos."})
    except Exception:
        # Infrastructure/provider failures must not expose SDK details or secrets.
        return JSONResponse(status_code=503, headers=headers,
                            content={"detail": "Não foi possível entrar. Tente novamente."})
