from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base
from app.models.usuario import NivelAcesso


class AccessRequest(Base):
    __tablename__ = "access_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    nivel_solicitado = Column(String, nullable=False)  # Nível de acesso solicitado
    trabalha_cglic = Column(Boolean, nullable=False, default=False)  # Se trabalha na CGLIC
    justificativa = Column(Text, nullable=True)  # Justificativa da requisição
    status = Column(String, nullable=False, default="PENDENTE")  # PENDENTE, APROVADA, REJEITADA
    observacoes_admin = Column(Text, nullable=True)  # Observações do administrador
    aprovado_por_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)  # ID do admin que aprovou
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relacionamentos
    user = relationship("Usuario", foreign_keys=[user_id], back_populates="access_requests")
    aprovado_por = relationship("Usuario", foreign_keys=[aprovado_por_id])

    def __str__(self):
        return f"AccessRequest({self.user.nome_completo} -> {self.nivel_solicitado})"