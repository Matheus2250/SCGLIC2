from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from app.models.qualificacao import StatusQualificacao


class QualificacaoBase(BaseModel):
    nup: str
    numero_contratacao: str
    area_demandante: Optional[str] = None
    responsavel_instrucao: Optional[str] = None
    modalidade: Optional[str] = None
    objeto: Optional[str] = None
    palavra_chave: Optional[str] = None
    valor_estimado: Optional[Decimal] = None
    status: StatusQualificacao = StatusQualificacao.EM_ANALISE
    observacoes: Optional[str] = None


class QualificacaoCreate(QualificacaoBase):
    pass


class QualificacaoUpdate(BaseModel):
    nup: Optional[str] = None
    numero_contratacao: Optional[str] = None
    area_demandante: Optional[str] = None
    responsavel_instrucao: Optional[str] = None
    modalidade: Optional[str] = None
    objeto: Optional[str] = None
    palavra_chave: Optional[str] = None
    valor_estimado: Optional[Decimal] = None
    status: Optional[StatusQualificacao] = None
    observacoes: Optional[str] = None


class Qualificacao(QualificacaoBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: UUID

    class Config:
        from_attributes = True