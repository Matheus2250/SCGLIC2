from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user, get_admin_user
from app.models.usuario import Usuario
from app.schemas.access_request import (
    AccessRequestCreate,
    AccessRequestResponse,
    AccessRequestListResponse,
    AccessRequestUpdate
)
from app.services.access_request_service import AccessRequestService

router = APIRouter()


@router.post("/", response_model=AccessRequestResponse, status_code=status.HTTP_201_CREATED)
def create_access_request(
    request_data: AccessRequestCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Criar uma nova requisição de acesso"""
    try:
        access_request = AccessRequestService.create_request(db, request_data, str(current_user.id))

        # Buscar dados do usuário para retorno
        response_data = {
            "id": access_request.id,
            "user_id": access_request.user_id,
            "nivel_solicitado": access_request.nivel_solicitado,
            "trabalha_cglic": access_request.trabalha_cglic,
            "justificativa": access_request.justificativa,
            "status": access_request.status,
            "observacoes_admin": access_request.observacoes_admin,
            "aprovado_por_id": access_request.aprovado_por_id,
            "created_at": access_request.created_at,
            "updated_at": access_request.updated_at,
            "user_nome": current_user.nome_completo,
            "user_email": current_user.email
        }

        return response_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/my-requests", response_model=List[AccessRequestResponse])
def get_my_requests(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Buscar minhas requisições de acesso"""
    requests = AccessRequestService.get_user_requests(db, str(current_user.id))

    response_list = []
    for req in requests:
        response_data = {
            "id": req.id,
            "user_id": str(req.user_id),
            "nivel_solicitado": req.nivel_solicitado,
            "trabalha_cglic": req.trabalha_cglic,
            "justificativa": req.justificativa,
            "status": req.status,
            "observacoes_admin": req.observacoes_admin,
            "aprovado_por_id": str(req.aprovado_por_id) if req.aprovado_por_id else None,
            "created_at": req.created_at,
            "updated_at": req.updated_at,
            "user_nome": current_user.nome_completo,
            "user_email": current_user.email
        }
        response_list.append(response_data)

    return response_list


@router.get("/pending", response_model=List[AccessRequestListResponse])
def get_pending_requests(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user)
):
    """Buscar requisições pendentes (apenas para administradores)"""
    requests = AccessRequestService.get_pending_requests(db, skip, limit)

    response_list = []
    for req in requests:
        user = req.user
        response_data = {
            "id": req.id,
            "user_nome": user.nome_completo,
            "user_email": user.email,
            "nivel_solicitado": req.nivel_solicitado,
            "trabalha_cglic": req.trabalha_cglic,
            "status": req.status,
            "created_at": req.created_at
        }
        response_list.append(response_data)

    return response_list


@router.get("/", response_model=List[AccessRequestListResponse])
def get_all_requests(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user)
):
    """Buscar todas as requisições (apenas para administradores)"""
    requests = AccessRequestService.get_all_requests(db, skip, limit)

    response_list = []
    for req in requests:
        user = req.user
        response_data = {
            "id": req.id,
            "user_nome": user.nome_completo,
            "user_email": user.email,
            "nivel_solicitado": req.nivel_solicitado,
            "trabalha_cglic": req.trabalha_cglic,
            "status": req.status,
            "created_at": req.created_at
        }
        response_list.append(response_data)

    return response_list


@router.get("/{request_id}", response_model=AccessRequestResponse)
def get_request_details(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user)
):
    """Buscar detalhes de uma requisição específica (apenas para administradores)"""
    request = AccessRequestService.get_request_by_id(db, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Requisição não encontrada")

    user = request.user
    aprovado_por = request.aprovado_por if request.aprovado_por else None

    response_data = {
        "id": request.id,
        "user_id": request.user_id,
        "nivel_solicitado": request.nivel_solicitado,
        "trabalha_cglic": request.trabalha_cglic,
        "justificativa": request.justificativa,
        "status": request.status,
        "observacoes_admin": request.observacoes_admin,
        "aprovado_por_id": request.aprovado_por_id,
        "created_at": request.created_at,
        "updated_at": request.updated_at,
        "user_nome": user.nome_completo,
        "user_email": user.email,
        "aprovado_por_nome": aprovado_por.nome_completo if aprovado_por else None
    }

    return response_data


@router.post("/{request_id}/approve", response_model=AccessRequestResponse)
def approve_request(
    request_id: str,
    update_data: AccessRequestUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user)
):
    """Aprovar uma requisição de acesso (apenas para administradores)"""
    try:
        access_request = AccessRequestService.approve_request(
            db, request_id, str(current_user.id), update_data.observacoes_admin
        )

        user = access_request.user
        response_data = {
            "id": access_request.id,
            "user_id": access_request.user_id,
            "nivel_solicitado": access_request.nivel_solicitado,
            "trabalha_cglic": access_request.trabalha_cglic,
            "justificativa": access_request.justificativa,
            "status": access_request.status,
            "observacoes_admin": access_request.observacoes_admin,
            "aprovado_por_id": access_request.aprovado_por_id,
            "created_at": access_request.created_at,
            "updated_at": access_request.updated_at,
            "user_nome": user.nome_completo,
            "user_email": user.email,
            "aprovado_por_nome": current_user.nome_completo
        }

        return response_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{request_id}/reject", response_model=AccessRequestResponse)
def reject_request(
    request_id: str,
    update_data: AccessRequestUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user)
):
    """Rejeitar uma requisição de acesso (apenas para administradores)"""
    try:
        access_request = AccessRequestService.reject_request(
            db, request_id, str(current_user.id), update_data.observacoes_admin
        )

        user = access_request.user
        response_data = {
            "id": access_request.id,
            "user_id": access_request.user_id,
            "nivel_solicitado": access_request.nivel_solicitado,
            "trabalha_cglic": access_request.trabalha_cglic,
            "justificativa": access_request.justificativa,
            "status": access_request.status,
            "observacoes_admin": access_request.observacoes_admin,
            "aprovado_por_id": access_request.aprovado_por_id,
            "created_at": access_request.created_at,
            "updated_at": access_request.updated_at,
            "user_nome": user.nome_completo,
            "user_email": user.email,
            "aprovado_por_nome": current_user.nome_completo
        }

        return response_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user)
):
    """Deletar uma requisição de acesso (apenas para administradores)"""
    success = AccessRequestService.delete_request(db, request_id)
    if not success:
        raise HTTPException(status_code=404, detail="Requisição não encontrada")