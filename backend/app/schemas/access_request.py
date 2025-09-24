from pydantic import BaseModel, Field, field_serializer
from typing import Optional, Union
from datetime import datetime
from uuid import UUID
from app.models.usuario import NivelAcesso


class AccessRequestCreate(BaseModel):
    nivel_solicitado: NivelAcesso = Field(..., description="Nível de acesso solicitado")
    trabalha_cglic: bool = Field(..., description="Se trabalha na CGLIC")
    justificativa: Optional[str] = Field(None, description="Justificativa da requisição")


class AccessRequestUpdate(BaseModel):
    status: str = Field(..., description="PENDENTE, APROVADA, REJEITADA")
    observacoes_admin: Optional[str] = Field(None, description="Observações do administrador")


class AccessRequestResponse(BaseModel):
    id: Union[str, UUID]
    user_id: Union[str, UUID]
    nivel_solicitado: str
    trabalha_cglic: bool
    justificativa: Optional[str] = None
    status: str
    observacoes_admin: Optional[str] = None
    aprovado_por_id: Optional[Union[str, UUID]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Dados do usuário que fez a requisição
    user_nome: Optional[str] = None
    user_email: Optional[str] = None

    # Dados do administrador que aprovou (se aplicável)
    aprovado_por_nome: Optional[str] = None

    @field_serializer('id')
    def serialize_id(self, v):
        return str(v)

    @field_serializer('user_id')
    def serialize_user_id(self, v):
        return str(v)

    @field_serializer('aprovado_por_id')
    def serialize_aprovado_por_id(self, v):
        return str(v) if v else None

    class Config:
        from_attributes = True


class AccessRequestListResponse(BaseModel):
    id: Union[str, UUID]
    user_nome: str
    user_email: str
    nivel_solicitado: str
    trabalha_cglic: bool
    status: str
    created_at: datetime

    @field_serializer('id')
    def serialize_id(self, v):
        return str(v)

    class Config:
        from_attributes = True