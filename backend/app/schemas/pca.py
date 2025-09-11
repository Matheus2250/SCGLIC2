from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID


class PCABase(BaseModel):
    numero_contratacao: str
    status_contratacao: Optional[str] = None
    situacao_execucao: Optional[str] = None
    titulo_contratacao: Optional[str] = None
    categoria_contratacao: Optional[str] = None
    valor_total: Optional[Decimal] = None
    area_requisitante: Optional[str] = None
    numero_dfd: Optional[str] = None
    data_estimada_inicio: Optional[date] = None
    data_estimada_conclusao: Optional[date] = None


class PCACreate(PCABase):
    pass


class PCAUpdate(BaseModel):
    numero_contratacao: Optional[str] = None
    status_contratacao: Optional[str] = None
    situacao_execucao: Optional[str] = None
    titulo_contratacao: Optional[str] = None
    categoria_contratacao: Optional[str] = None
    valor_total: Optional[Decimal] = None
    area_requisitante: Optional[str] = None
    numero_dfd: Optional[str] = None
    data_estimada_inicio: Optional[date] = None
    data_estimada_conclusao: Optional[date] = None


class PCA(PCABase):
    id: UUID
    atrasada: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: UUID

    class Config:
        from_attributes = True


class PCAImport(BaseModel):
    file_data: bytes
    filename: str