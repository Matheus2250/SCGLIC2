from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.usuario import NivelAcesso


class UsuarioBase(BaseModel):
    username: str
    email: EmailStr
    nome_completo: str
    nivel_acesso: NivelAcesso = NivelAcesso.VISITANTE
    ativo: bool = True


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    nome_completo: Optional[str] = None
    nivel_acesso: Optional[NivelAcesso] = None
    ativo: Optional[bool] = None


class Usuario(UsuarioBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None