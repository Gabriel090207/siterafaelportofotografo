from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, SecretStr, ValidationError
from starlette.concurrency import run_in_threadpool

from app.services.client_link_login import ClientLinkLoginService, InvalidClientLinkLogin

router = APIRouter(prefix="/client", tags=["Client Link Login"])


class ClientLinkLoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    publicId: str = Field(min_length=22, max_length=22)
    secret: SecretStr = Field(min_length=43, max_length=43, repr=False)


def get_link_login_service():
    from app.firebase.firestore import db
    return ClientLinkLoginService(db)


@router.post("/link-login")
async def login_client_link(request: Request):
    headers = {"Cache-Control": "no-store"}
    failure = {"detail": "Link inválido ou indisponível."}
    try:
        # Avoid default request-validation responses that echo secret inputs.
        data = ClientLinkLoginRequest.model_validate(await request.json())
    except (ValidationError, ValueError, UnicodeDecodeError):
        return JSONResponse(status_code=401, headers=headers, content=failure)
    try:
        token = await run_in_threadpool(
            get_link_login_service().exchange, data.publicId, data.secret.get_secret_value(),
        )
        return JSONResponse(headers=headers, content={"customToken": token})
    except InvalidClientLinkLogin:
        return JSONResponse(status_code=401, headers=headers, content=failure)
    except Exception:
        return JSONResponse(status_code=503, headers=headers, content=failure)
