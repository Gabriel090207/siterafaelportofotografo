from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.concurrency import run_in_threadpool

from app.dependencies.admin_auth import AuthenticatedAdmin, get_authenticated_admin
from app.models.client_provisioning import ProvisionClientRequest
from app.services.client_emails import ClientEmailConflict, ClientEmailError
from app.services.client_password_crypto import InvalidPassword
from app.services.client_links import ClientLinkRevoked
from app.services.client_share_link import ClientShareLinkService, ClientShareLinkNotFound
from app.services.client_provisioning import (
    ClientProvisioningService, InvalidClientProvisioning,
    ClientProvisioningReconciliationRequired,
)


router = APIRouter(prefix="/admin/clients", tags=["Admin Clients"])


def get_provisioning_service():
    from app.firebase.firestore import db
    return ClientProvisioningService(db)


def get_share_link_service():
    from app.firebase.firestore import db
    return ClientShareLinkService(db)


@router.post("/{client_id}/link")
async def get_client_share_link(
    client_id: str,
    _admin: Annotated[AuthenticatedAdmin, Depends(get_authenticated_admin)],
):
    headers = {"Cache-Control": "no-store"}
    try:
        result = await run_in_threadpool(get_share_link_service().get_or_create, client_id)
        return JSONResponse(headers=headers, content=result)
    except ClientShareLinkNotFound:
        return JSONResponse(status_code=404, headers=headers, content={"detail": "Cliente não encontrado."})
    except ClientLinkRevoked:
        return JSONResponse(status_code=409, headers=headers, content={"detail": "Link de acesso revogado."})
    except Exception:
        return JSONResponse(status_code=503, headers=headers,
                            content={"detail": "Não foi possível obter o link de acesso."})


@router.post("")
async def provision_client(
    request: Request,
    _admin: Annotated[AuthenticatedAdmin, Depends(get_authenticated_admin)],
):
    headers = {"Cache-Control": "no-store"}
    try:
        # Do not allow FastAPI validation errors to echo password inputs.
        data = ProvisionClientRequest.model_validate(await request.json())
    except (ValidationError, ValueError, UnicodeDecodeError):
        return JSONResponse(status_code=422, headers=headers,
                            content={"detail": "Dados de Cliente inválidos."})
    try:
        result = await run_in_threadpool(get_provisioning_service().provision, data)
        return JSONResponse(status_code=201, headers=headers, content=result)
    except ClientEmailConflict:
        return JSONResponse(status_code=409, headers=headers,
                            content={"detail": "E-mail já reservado para outro Cliente."})
    except (ClientEmailError, InvalidClientProvisioning, InvalidPassword):
        return JSONResponse(status_code=422, headers=headers,
                            content={"detail": "E-mails ou combinação de senha inválidos."})
    except ClientProvisioningReconciliationRequired:
        return JSONResponse(status_code=503, headers=headers, content={
            "detail": "Não foi possível confirmar o provisionamento. Solicite verificação operacional antes de repetir.",
            "code": "provisioning_reconciliation_required",
        })
    except Exception:
        return JSONResponse(status_code=503, headers=headers,
                            content={"detail": "Não foi possível provisionar o Cliente."})
