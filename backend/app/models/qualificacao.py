"""
pyright: reportMissingImports=false
This module depends on SQLAlchemy at runtime. If your editor flags imports,
point it to the backend virtualenv with dependencies installed.
"""
import uuid
from sqlalchemy import Column, String, Text, DECIMAL, DateTime, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class StatusQualificacao(str, enum.Enum):
    EM_ANALISE = "EM ANALISE"
    CONCLUIDO = "CONCLUIDO"


class Qualificacao(Base):
    __tablename__ = "qualificacoes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nup = Column(String(50), unique=True, index=True, nullable=False)
    numero_contratacao = Column(String(50), ForeignKey("pca.numero_contratacao"), nullable=False)
    ano = Column(Integer, nullable=False, default=2025)
    area_demandante = Column(String(200))
    responsavel_instrucao = Column(String(200))
    modalidade = Column(String(100))
    objeto = Column(Text)
    palavra_chave = Column(String(200))
    valor_estimado = Column(DECIMAL(precision=15, scale=2))
    status = Column(Enum(StatusQualificacao), default=StatusQualificacao.EM_ANALISE)
    observacoes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)

    # Relationships
    creator = relationship("Usuario", foreign_keys=[created_by])
    updater = relationship("Usuario", foreign_keys=[updated_by])
    pca_ref = relationship("PCA", back_populates="qualificacoes")
    licitacao = relationship("Licitacao", back_populates="qualificacao_ref")
