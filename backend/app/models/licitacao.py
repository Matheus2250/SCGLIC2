import uuid
from sqlalchemy import Column, String, Text, DECIMAL, DateTime, Date, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class StatusLicitacao(str, enum.Enum):
    HOMOLOGADA = "HOMOLOGADA"
    FRACASSADA = "FRACASSADA"
    EM_ANDAMENTO = "EM ANDAMENTO"
    REVOGADA = "REVOGADA"


class Licitacao(Base):
    __tablename__ = "licitacoes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nup = Column(String(50), ForeignKey("qualificacoes.nup"), nullable=False)
    numero_contratacao = Column(String(50))
    ano = Column(Integer, nullable=False, default=2025)
    area_demandante = Column(String(200))
    responsavel_instrucao = Column(String(200))
    modalidade = Column(String(100))
    objeto = Column(Text)
    palavra_chave = Column(String(200))
    valor_estimado = Column(DECIMAL(precision=15, scale=2))
    observacoes = Column(Text)
    pregoeiro = Column(String(200))
    valor_homologado = Column(DECIMAL(precision=15, scale=2))
    data_homologacao = Column(Date)
    link = Column(String(500))
    status = Column(Enum(StatusLicitacao), default=StatusLicitacao.EM_ANDAMENTO)
    economia = Column(DECIMAL(precision=15, scale=2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)

    # Relationships
    creator = relationship("Usuario")
    qualificacao_ref = relationship("Qualificacao", back_populates="licitacao")