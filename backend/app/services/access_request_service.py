from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from app.models.access_request import AccessRequest
from app.models.usuario import Usuario
from app.schemas.access_request import AccessRequestCreate, AccessRequestUpdate
import uuid


class AccessRequestService:

    @staticmethod
    def create_request(db: Session, request_data: AccessRequestCreate, user_id: str) -> AccessRequest:
        """Criar uma nova requisição de acesso"""
        # Verificar se já existe uma requisição pendente para este usuário
        existing_request = db.query(AccessRequest).filter(
            and_(
                AccessRequest.user_id == user_id,
                AccessRequest.status == "PENDENTE"
            )
        ).first()

        if existing_request:
            raise ValueError("Usuário já possui uma requisição de acesso pendente")

        access_request = AccessRequest(
            user_id=user_id,
            nivel_solicitado=request_data.nivel_solicitado.value,
            trabalha_cglic=request_data.trabalha_cglic,
            justificativa=request_data.justificativa,
            status="PENDENTE"
        )

        db.add(access_request)
        db.commit()
        db.refresh(access_request)
        return access_request

    @staticmethod
    def get_user_requests(db: Session, user_id: str) -> List[AccessRequest]:
        """Buscar todas as requisições de um usuário"""
        return db.query(AccessRequest).filter(AccessRequest.user_id == user_id).all()

    @staticmethod
    def get_pending_requests(db: Session, skip: int = 0, limit: int = 100) -> List[AccessRequest]:
        """Buscar todas as requisições pendentes"""
        return db.query(AccessRequest).filter(
            AccessRequest.status == "PENDENTE"
        ).offset(skip).limit(limit).all()

    @staticmethod
    def get_all_requests(db: Session, skip: int = 0, limit: int = 100) -> List[AccessRequest]:
        """Buscar todas as requisições com informações dos usuários"""
        return db.query(AccessRequest).offset(skip).limit(limit).all()

    @staticmethod
    def get_request_by_id(db: Session, request_id: str) -> Optional[AccessRequest]:
        """Buscar uma requisição por ID"""
        return db.query(AccessRequest).filter(AccessRequest.id == request_id).first()

    @staticmethod
    def approve_request(db: Session, request_id: str, admin_id: str, observacoes: Optional[str] = None) -> AccessRequest:
        """Aprovar uma requisição de acesso"""
        access_request = AccessRequestService.get_request_by_id(db, request_id)
        if not access_request:
            raise ValueError("Requisição não encontrada")

        if access_request.status != "PENDENTE":
            raise ValueError("Apenas requisições pendentes podem ser aprovadas")

        # Atualizar a requisição
        access_request.status = "APROVADA"
        access_request.aprovado_por_id = admin_id
        access_request.observacoes_admin = observacoes

        # Atualizar o nível de acesso do usuário
        user = db.query(Usuario).filter(Usuario.id == access_request.user_id).first()
        if user:
            user.nivel_acesso = access_request.nivel_solicitado

        db.commit()
        db.refresh(access_request)
        return access_request

    @staticmethod
    def reject_request(db: Session, request_id: str, admin_id: str, observacoes: Optional[str] = None) -> AccessRequest:
        """Rejeitar uma requisição de acesso"""
        access_request = AccessRequestService.get_request_by_id(db, request_id)
        if not access_request:
            raise ValueError("Requisição não encontrada")

        if access_request.status != "PENDENTE":
            raise ValueError("Apenas requisições pendentes podem ser rejeitadas")

        # Atualizar a requisição
        access_request.status = "REJEITADA"
        access_request.aprovado_por_id = admin_id
        access_request.observacoes_admin = observacoes

        db.commit()
        db.refresh(access_request)
        return access_request

    @staticmethod
    def delete_request(db: Session, request_id: str) -> bool:
        """Deletar uma requisição de acesso"""
        access_request = AccessRequestService.get_request_by_id(db, request_id)
        if not access_request:
            return False

        db.delete(access_request)
        db.commit()
        return True