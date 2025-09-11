from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.models.usuario import Usuario
from app.models.pca import PCA
from app.schemas.pca import PCA as PCASchema, PCACreate, PCAUpdate
from datetime import date
import pandas as pd
import io

router = APIRouter()


@router.get("/", response_model=List[PCASchema])
def read_pcas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    pcas = db.query(PCA).offset(skip).limit(limit).all()
    return pcas


@router.post("/", response_model=PCASchema)
def create_pca(
    pca_in: PCACreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    # Check if PCA already exists
    existing_pca = db.query(PCA).filter(PCA.numero_contratacao == pca_in.numero_contratacao).first()
    if existing_pca:
        raise HTTPException(status_code=400, detail="PCA with this number already exists")
    
    # Calculate if it's delayed
    atrasada = False
    if pca_in.data_estimada_conclusao and pca_in.data_estimada_conclusao < date.today():
        atrasada = True
    
    pca = PCA(
        **pca_in.dict(),
        created_by=current_user.id,
        atrasada=atrasada
    )
    db.add(pca)
    db.commit()
    db.refresh(pca)
    return pca


@router.get("/{pca_id}", response_model=PCASchema)
def read_pca(
    pca_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    pca = db.query(PCA).filter(PCA.id == pca_id).first()
    if not pca:
        raise HTTPException(status_code=404, detail="PCA not found")
    return pca


@router.put("/{pca_id}", response_model=PCASchema)
def update_pca(
    pca_id: str,
    pca_in: PCAUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    pca = db.query(PCA).filter(PCA.id == pca_id).first()
    if not pca:
        raise HTTPException(status_code=404, detail="PCA not found")
    
    update_data = pca_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pca, field, value)
    
    # Update delayed status
    if pca.data_estimada_conclusao and pca.data_estimada_conclusao < date.today():
        pca.atrasada = True
    else:
        pca.atrasada = False
    
    db.commit()
    db.refresh(pca)
    return pca


@router.delete("/{pca_id}")
def delete_pca(
    pca_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    pca = db.query(PCA).filter(PCA.id == pca_id).first()
    if not pca:
        raise HTTPException(status_code=404, detail="PCA not found")
    
    db.delete(pca)
    db.commit()
    return {"message": "PCA deleted successfully"}


@router.post("/import")
async def import_pca_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    """Importa dados do PCA a partir de arquivo Excel"""
    try:
        # Validar tipo de arquivo
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(
                status_code=400,
                detail="Arquivo deve ser Excel (.xlsx ou .xls)"
            )
        
        # Ler o arquivo Excel
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Mapear colunas do Excel para o modelo (incluindo versões com encoding corrompido)
        column_mapping = {
            'Número da Contratação': 'numero_contratacao',
            'Status da Contratação': 'status_contratacao',
            'Situação da Execução': 'situacao_execucao',
            'Título da Contratação': 'titulo_contratacao',
            'Categoria da Contratação': 'categoria_contratacao',
            'Valor Total': 'valor_total',
            'Área Requisitante': 'area_requisitante',
            'Número DFD': 'numero_dfd',
            'Data Estimada de Início': 'data_estimada_inicio',
            'Data Estimada de Conclusão': 'data_estimada_conclusao',
            # Versões com encoding corrompido
            'N�mero da Contrata��o': 'numero_contratacao',
            'Status da Contrata��o': 'status_contratacao',
            'Situa��o da Execu��o': 'situacao_execucao',
            'T�tulo da Contrata��o': 'titulo_contratacao',
            'Categoria da Contrata��o': 'categoria_contratacao',
            '�rea Requisitante': 'area_requisitante',
            'N�mero DFD': 'numero_dfd',
            'Data Estimada de In�cio': 'data_estimada_inicio',
            'Data Estimada de Conclus�o': 'data_estimada_conclusao',
            # Mapeamentos alternativos caso as colunas tenham nomes diferentes
            'numero_contratacao': 'numero_contratacao',
            'status_contratacao': 'status_contratacao',
            'situacao_execucao': 'situacao_execucao',
            'titulo_contratacao': 'titulo_contratacao',
            'categoria_contratacao': 'categoria_contratacao',
            'valor_total': 'valor_total',
            'area_requisitante': 'area_requisitante',
            'numero_dfd': 'numero_dfd',
            'data_estimada_inicio': 'data_estimada_inicio',
            'data_estimada_conclusao': 'data_estimada_conclusao',
        }
        
        # Renomear colunas se necessário
        for old_name, new_name in column_mapping.items():
            if old_name in df.columns:
                df = df.rename(columns={old_name: new_name})
        
        # Estatísticas de importação
        imported = 0
        updated = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Verificar se já existe
                numero_contratacao = str(row.get('numero_contratacao', '')).strip()
                if not numero_contratacao:
                    errors.append(f"Linha {index + 2}: Número da contratação não informado")
                    continue
                
                existing_pca = db.query(PCA).filter(
                    PCA.numero_contratacao == numero_contratacao
                ).first()
                
                # Preparar dados
                pca_data = {
                    'numero_contratacao': numero_contratacao,
                    'status_contratacao': str(row.get('status_contratacao', '')) if pd.notna(row.get('status_contratacao')) else None,
                    'situacao_execucao': str(row.get('situacao_execucao', '')) if pd.notna(row.get('situacao_execucao')) else None,
                    'titulo_contratacao': str(row.get('titulo_contratacao', '')) if pd.notna(row.get('titulo_contratacao')) else None,
                    'categoria_contratacao': str(row.get('categoria_contratacao', '')) if pd.notna(row.get('categoria_contratacao')) else None,
                    'area_requisitante': str(row.get('area_requisitante', '')) if pd.notna(row.get('area_requisitante')) else None,
                    'numero_dfd': str(row.get('numero_dfd', '')) if pd.notna(row.get('numero_dfd')) else None,
                }
                
                # Converter valor
                if pd.notna(row.get('valor_total')):
                    try:
                        valor = str(row.get('valor_total')).replace('R$', '').replace(',', '.')
                        pca_data['valor_total'] = float(valor.strip())
                    except (ValueError, AttributeError):
                        pca_data['valor_total'] = 0.0
                else:
                    pca_data['valor_total'] = 0.0
                
                # Converter datas
                from datetime import datetime
                for date_field in ['data_estimada_inicio', 'data_estimada_conclusao']:
                    if pd.notna(row.get(date_field)):
                        try:
                            if isinstance(row.get(date_field), str):
                                pca_data[date_field] = datetime.strptime(
                                    row.get(date_field), '%d/%m/%Y'
                                ).date()
                            else:
                                pca_data[date_field] = pd.to_datetime(
                                    row.get(date_field)
                                ).date()
                        except (ValueError, TypeError):
                            pca_data[date_field] = None
                    else:
                        pca_data[date_field] = None
                
                # Calcular se está atrasada
                if pca_data.get('data_estimada_conclusao'):
                    pca_data['atrasada'] = (
                        pca_data['data_estimada_conclusao'] < datetime.now().date() and
                        pca_data.get('status_contratacao', '').upper() != 'CONCLUÍDO'
                    )
                else:
                    pca_data['atrasada'] = False
                
                if existing_pca:
                    # Atualizar registro existente
                    for key, value in pca_data.items():
                        setattr(existing_pca, key, value)
                    updated += 1
                else:
                    # Criar novo registro
                    pca_data['created_by'] = current_user.id
                    new_pca = PCA(**pca_data)
                    db.add(new_pca)
                    imported += 1
                    
            except Exception as e:
                errors.append(f"Linha {index + 2}: {str(e)}")
                continue
        
        # Commit das alterações
        db.commit()
        
        return {
            "success": True,
            "message": f"Importação concluída",
            "imported": imported,
            "updated": updated,
            "total": len(df),
            "errors": errors[:5] if errors else []  # Retornar apenas os 5 primeiros erros
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=400,
            detail="Arquivo Excel está vazio"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Erro ao processar arquivo: {str(e)}"
        )


@router.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    total_pcas = db.query(PCA).count()
    pcas_atrasadas = db.query(PCA).filter(PCA.atrasada == True).count()
    
    return {
        "total_pcas": total_pcas,
        "pcas_atrasadas": pcas_atrasadas,
        "pcas_no_prazo": total_pcas - pcas_atrasadas
    }


@router.get("/atrasadas", response_model=List[PCASchema])
def get_pcas_atrasadas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    pcas = db.query(PCA).filter(PCA.atrasada == True).all()
    return pcas