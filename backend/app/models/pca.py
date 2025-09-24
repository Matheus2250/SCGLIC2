import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Text, DECIMAL, Boolean, DateTime, Date, ForeignKey, Integer, UniqueConstraint
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)

    # Relationships
    creator = relationship("Usuario")
    qualificacoes = relationship("Qualificacao", back_populates="pca_ref")

    @property
    def atrasada(self) -> bool:
        """
        Contratação é considerada atrasada se:
        - Situação da execução é "Não iniciada" (ou similar)
        - Data estimada de início já passou
        - Data estimada de conclusão ainda não passou (se passou, é vencida)
        """
        if not self.data_estimada_inicio or not self.data_estimada_conclusao:
            return False

        # Verificar se é "Não iniciada" - normalizar string
        situacao = (self.situacao_execucao or "").strip().lower()
        situacao_nao_iniciada = situacao in ["", "não iniciada", "nao iniciada", "não iniciado", "nao iniciado"]

        if not situacao_nao_iniciada:
            return False

        hoje = date.today()
        # Debug para algumas contratações
        if self.numero_contratacao in ["1/2025", "2/2025", "3/2025"]:
            print(f"DEBUG {self.numero_contratacao}: situacao='{self.situacao_execucao}' -> nao_iniciada={situacao_nao_iniciada}, inicio={self.data_estimada_inicio}, conclusao={self.data_estimada_conclusao}, hoje={hoje}")

        # Atrasada: situação não iniciada + início passou + conclusão não passou
        return (hoje > self.data_estimada_inicio and hoje <= self.data_estimada_conclusao)

    @property
    def vencida(self) -> bool:
        """
        Contratação é considerada vencida se:
        - Situação da execução é "Não iniciada" (ou similar)
        - Data estimada de conclusão já passou
        """
        if not self.data_estimada_conclusao:
            return False

        # Verificar se é "Não iniciada" - normalizar string
        situacao = (self.situacao_execucao or "").strip().lower()
        situacao_nao_iniciada = situacao in ["", "não iniciada", "nao iniciada", "não iniciado", "nao iniciado"]

        if not situacao_nao_iniciada:
            return False

        hoje = date.today()
        # Vencida: situação não iniciada + conclusão passou
        return hoje > self.data_estimada_conclusao