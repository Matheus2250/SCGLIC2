import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class NivelAcesso(str, enum.Enum):
    COORDENADOR = "COORDENADOR"
    DIPLAN = "DIPLAN"
    DIQUALI = "DIQUALI"
    DIPLI = "DIPLI"
    VISITANTE = "VISITANTE"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    nivel_acesso = Column(Enum(NivelAcesso), nullable=False, default=NivelAcesso.VISITANTE)
    nome_completo = Column(String(200), nullable=False)
    ativo = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relacionamentos
    access_requests = relationship("AccessRequest", back_populates="user", foreign_keys="AccessRequest.user_id")