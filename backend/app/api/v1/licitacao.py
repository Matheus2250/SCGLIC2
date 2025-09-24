from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.api import deps
from app.core.database import get_db
from app.models.usuario import Usuario
from app.models.licitacao import Licitacao
from app.models.qualificacao import Qualificacao
from app.schemas.licitacao import Licitacao as LicitacaoSchema, LicitacaoCreate, LicitacaoUpdate
from decimal import Decimal

router = APIRouter()


@router.get("/", response_model=List[LicitacaoSchema])
def read_licitacoes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    licitacoes = db.query(Licitacao).offset(skip).limit(limit).all()
    return licitacoes


@router.post("/", response_model=LicitacaoSchema)
def create_licitacao(
    licitacao_in: LicitacaoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_user_with_write_access)
) -> Any:
    try:
        print(f"Dados recebidos para criação de licitação: {licitacao_in.dict()}")
        
        # Verify Qualificacao exists
        qualificacao = db.query(Qualificacao).filter(Qualificacao.nup == licitacao_in.nup).first()
        if not qualificacao:
            raise HTTPException(status_code=400, detail=f"Qualificacao with NUP {licitacao_in.nup} not found")

        # Calculate economy if both values are present
        economia = None
        if licitacao_in.valor_estimado and licitacao_in.valor_homologado:
            economia = licitacao_in.valor_estimado - licitacao_in.valor_homologado

        # Create licitacao with ano inherited from qualificacao
        licitacao_data = licitacao_in.dict()
        licitacao_data['ano'] = qualificacao.ano  # Inherit ano from qualificacao

        licitacao = Licitacao(
            **licitacao_data,
            economia=economia,
            created_by=current_user.id
        )
        db.add(licitacao)
        db.commit()
        db.refresh(licitacao)
        return licitacao
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao criar licitação: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=422, detail=f"Erro na validação dos dados: {str(e)}")


@router.get("/{licitacao_id}", response_model=LicitacaoSchema)
def read_licitacao(
    licitacao_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    licitacao = db.query(Licitacao).filter(Licitacao.id == licitacao_id).first()
    if not licitacao:
        raise HTTPException(status_code=404, detail="Licitacao not found")
    return licitacao


@router.put("/{licitacao_id}", response_model=LicitacaoSchema)
def update_licitacao(
    licitacao_id: str,
    licitacao_in: LicitacaoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_user_with_write_access)
) -> Any:
    licitacao = db.query(Licitacao).filter(Licitacao.id == licitacao_id).first()
    if not licitacao:
        raise HTTPException(status_code=404, detail="Licitacao not found")
    
    update_data = licitacao_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(licitacao, field, value)
    
    # Recalculate economy
    if licitacao.valor_estimado and licitacao.valor_homologado:
        licitacao.economia = licitacao.valor_estimado - licitacao.valor_homologado
    
    db.commit()
    db.refresh(licitacao)
    return licitacao


@router.delete("/{licitacao_id}")
def delete_licitacao(
    licitacao_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_user_with_write_access)
) -> Any:
    licitacao = db.query(Licitacao).filter(Licitacao.id == licitacao_id).first()
    if not licitacao:
        raise HTTPException(status_code=404, detail="Licitacao not found")
    
    db.delete(licitacao)
    db.commit()
    return {"message": "Licitacao deleted successfully"}


@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)) -> Any:
    """Retorna estatísticas para o dashboard de licitações"""
    try:
        # Total de licitações
        total_licitacoes = db.query(func.count(Licitacao.id)).scalar() or 0
        
        # Licitações por status
        status_counts = db.query(
            Licitacao.status,
            func.count(Licitacao.id)
        ).group_by(Licitacao.status).all()
        
        licitacoes_por_status = {
            status: count for status, count in status_counts
        }
        
        # Valores totais
        valor_total_estimado = db.query(
            func.sum(Licitacao.valor_estimado)
        ).scalar() or Decimal('0')
        
        valor_total_homologado = db.query(
            func.sum(Licitacao.valor_homologado)
        ).filter(
            Licitacao.status == 'HOMOLOGADA'
        ).scalar() or Decimal('0')
        
        # Economia total
        economia_total = db.query(
            func.sum(
                case(
                    (Licitacao.status == 'HOMOLOGADA',
                     Licitacao.valor_estimado - Licitacao.valor_homologado),
                    else_=0
                )
            )
        ).scalar() or Decimal('0')
        
        # Taxa de sucesso
        total_concluidas = db.query(func.count(Licitacao.id)).filter(
            Licitacao.status.in_(['HOMOLOGADA', 'FRACASSADA', 'REVOGADA'])
        ).scalar() or 0
        
        total_homologadas = licitacoes_por_status.get('HOMOLOGADA', 0)
        
        taxa_sucesso = (
            (total_homologadas / total_concluidas * 100) 
            if total_concluidas > 0 else 0
        )
        
        return {
            "total_licitacoes": total_licitacoes,
            "homologadas": licitacoes_por_status.get('HOMOLOGADA', 0),
            "em_andamento": licitacoes_por_status.get('EM ANDAMENTO', 0),
            "fracassadas": licitacoes_por_status.get('FRACASSADA', 0),
            "revogadas": licitacoes_por_status.get('REVOGADA', 0),
            "valor_total_estimado": float(valor_total_estimado),
            "valor_total_homologado": float(valor_total_homologado),
            "total_economia": float(economia_total),
            "economia_percentual": (
                float(economia_total / valor_total_estimado * 100) 
                if valor_total_estimado > 0 else 0
            ),
            "taxa_sucesso": float(taxa_sucesso),
            "licitacoes_por_status": {
                "HOMOLOGADA": licitacoes_por_status.get('HOMOLOGADA', 0),
                "EM ANDAMENTO": licitacoes_por_status.get('EM ANDAMENTO', 0),
                "FRACASSADA": licitacoes_por_status.get('FRACASSADA', 0),
                "REVOGADA": licitacoes_por_status.get('REVOGADA', 0)
            }
        }
    except Exception as e:
        print(f"Erro no dashboard stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/economia/relatorio")
def get_economia_relatorio(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    licitacoes_com_economia = db.query(Licitacao).filter(
        Licitacao.economia.isnot(None),
        Licitacao.economia > 0
    ).all()
    
    relatorio = []
    for licitacao in licitacoes_com_economia:
        relatorio.append({
            "nup": licitacao.nup,
            "numero_contratacao": licitacao.numero_contratacao,
            "objeto": licitacao.objeto,
            "valor_estimado": float(licitacao.valor_estimado) if licitacao.valor_estimado else 0,
            "valor_homologado": float(licitacao.valor_homologado) if licitacao.valor_homologado else 0,
            "economia": float(licitacao.economia),
            "percentual_economia": round((float(licitacao.economia) / float(licitacao.valor_estimado)) * 100, 2) if licitacao.valor_estimado else 0
        })
    
    total_economia = sum([item["economia"] for item in relatorio])
    
    return {
        "licitacoes": relatorio,
        "total_economia": total_economia,
        "total_licitacoes_com_economia": len(relatorio)
    }