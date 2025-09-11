from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID
from app.models.licitacao import StatusLicitacao


class LicitacaoBase(BaseModel):
    nup: str
    numero_contratacao: Optional[str] = None
    area_demandante: Optional[str] = None
    responsavel_instrucao: Optional[str] = None
    modalidade: Optional[str] = None
    objeto: Optional[str] = None
    palavra_chave: Optional[str] = None
    valor_estimado: Optional[Decimal] = None
    observacoes: Optional[str] = None
    pregoeiro: Optional[str] = None
    valor_homologado: Optional[Decimal] = None
    data_homologacao: Optional[date] = None
    link: Optional[str] = None
    status: StatusLicitacao = StatusLicitacao.EM_ANDAMENTO


class LicitacaoCreate(LicitacaoBase):
    pass


class LicitacaoUpdate(BaseModel):
    nup: Optional[str] = None
    numero_contratacao: Optional[str] = None
    area_demandante: Optional[str] = None
    responsavel_instrucao: Optional[str] = None
    modalidade: Optional[str] = None
    objeto: Optional[str] = None
    palavra_chave: Optional[str] = None
    valor_estimado: Optional[Decimal] = None
    observacoes: Optional[str] = None
    pregoeiro: Optional[str] = None
    valor_homologado: Optional[Decimal] = None
    data_homologacao: Optional[date] = None
    link: Optional[str] = None
    status: Optional[StatusLicitacao] = None


class Licitacao(LicitacaoBase):
    id: UUID
    economia: Optional[Decimal] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: UUID

    class Config:
        from_attributes = True