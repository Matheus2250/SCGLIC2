import uuid
from sqlalchemy import Column, String, Text, DECIMAL, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class PCA(Base):
    __tablename__ = "pca"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    numero_contratacao = Column(String(50), unique=True, index=True, nullable=False)
    status_contratacao = Column(String(100))
    situacao_execucao = Column(String(100))
    titulo_contratacao = Column(Text)
    categoria_contratacao = Column(String(100))
    valor_total = Column(DECIMAL(precision=15, scale=2))
    area_requisitante = Column(String(200))
    numero_dfd = Column(String(50))
    data_estimada_inicio = Column(Date)
    data_estimada_conclusao = Column(Date)
    atrasada = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)

    # Relationships
    creator = relationship("Usuario")
    qualificacoes = relationship("Qualificacao", back_populates="pca_ref")