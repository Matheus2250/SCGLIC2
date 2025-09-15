from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.models.usuario import Usuario
from app.models.qualificacao import Qualificacao, StatusQualificacao
from app.models.pca import PCA
from app.schemas.qualificacao import Qualificacao as QualificacaoSchema, QualificacaoCreate, QualificacaoUpdate

router = APIRouter()


@router.get("/", response_model=List[QualificacaoSchema])
def read_qualificacoes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    qualificacoes = db.query(Qualificacao).offset(skip).limit(limit).all()
    return qualificacoes


@router.get("/concluidas", response_model=List[QualificacaoSchema])
def read_qualificacoes_concluidas(
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    """Retorna apenas as qualificações com status 'Concluído' para seleção em licitações"""
    qualificacoes = db.query(Qualificacao).filter(
        Qualificacao.status == StatusQualificacao.CONCLUIDO
    ).offset(skip).limit(limit).all()
    return qualificacoes


@router.post("/", response_model=QualificacaoSchema)
def create_qualificacao(
    qualificacao_in: QualificacaoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    # Check if Qualificacao already exists
    existing_qualificacao = db.query(Qualificacao).filter(Qualificacao.nup == qualificacao_in.nup).first()
    if existing_qualificacao:
        raise HTTPException(status_code=400, detail="Qualificacao with this NUP already exists")
    
    # Verify PCA exists
    pca = db.query(PCA).filter(PCA.numero_contratacao == qualificacao_in.numero_contratacao).first()
    if not pca:
        raise HTTPException(status_code=400, detail="PCA not found")
    
    qualificacao = Qualificacao(
        **qualificacao_in.dict(),
        created_by=current_user.id
    )
    db.add(qualificacao)
    db.commit()
    db.refresh(qualificacao)
    return qualificacao


@router.get("/{qualificacao_id}", response_model=QualificacaoSchema)
def read_qualificacao(
    qualificacao_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    qualificacao = db.query(Qualificacao).filter(Qualificacao.id == qualificacao_id).first()
    if not qualificacao:
        raise HTTPException(status_code=404, detail="Qualificacao not found")
    return qualificacao


@router.put("/{qualificacao_id}", response_model=QualificacaoSchema)
def update_qualificacao(
    qualificacao_id: str,
    qualificacao_in: QualificacaoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    qualificacao = db.query(Qualificacao).filter(Qualificacao.id == qualificacao_id).first()
    if not qualificacao:
        raise HTTPException(status_code=404, detail="Qualificacao not found")
    
    update_data = qualificacao_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(qualificacao, field, value)
    
    db.commit()
    db.refresh(qualificacao)
    return qualificacao


@router.delete("/{qualificacao_id}")
def delete_qualificacao(
    qualificacao_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    qualificacao = db.query(Qualificacao).filter(Qualificacao.id == qualificacao_id).first()
    if not qualificacao:
        raise HTTPException(status_code=404, detail="Qualificacao not found")
    
    db.delete(qualificacao)
    db.commit()
    return {"message": "Qualificacao deleted successfully"}


@router.get("/by-pca/{numero_contratacao}", response_model=List[QualificacaoSchema])
def read_qualificacoes_by_pca(
    numero_contratacao: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    qualificacoes = db.query(Qualificacao).filter(
        Qualificacao.numero_contratacao == numero_contratacao
    ).all()
    return qualificacoes