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
    
    # Calculate if it's delayed - only "Não iniciada" contracts can be delayed
    # NULL values in situacao_execucao also mean "Não iniciada"
    atrasada = False
    is_nao_iniciada = (pca_in.situacao_execucao is None or 
                       (pca_in.situacao_execucao and pca_in.situacao_execucao.lower().strip() == "não iniciada"))
    
    if (is_nao_iniciada and
        pca_in.data_estimada_conclusao and 
        pca_in.data_estimada_conclusao < date.today()):
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
    
    # Update delayed status - only "Não iniciada" contracts can be delayed
    # NULL values in situacao_execucao also mean "Não iniciada"
    is_nao_iniciada = (pca.situacao_execucao is None or 
                       (pca.situacao_execucao and pca.situacao_execucao.lower().strip() == "não iniciada"))
    
    if (is_nao_iniciada and
        pca.data_estimada_conclusao and 
        pca.data_estimada_conclusao < date.today()):
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
    print(f"INICIO IMPORT - Filename: {file.filename}, ContentType: {file.content_type}")
    try:
        # Validar tipo de arquivo
        print(f"VALIDANDO ARQUIVO - Filename: {file.filename}")
        if not file.filename.endswith(('.xlsx', '.xls')):
            print(f"ERRO VALIDACAO - Arquivo inválido: {file.filename}")
            raise HTTPException(
                status_code=400,
                detail="Arquivo deve ser Excel (.xlsx ou .xls)"
            )
        
        # Ler o arquivo Excel
        print(f"LENDO ARQUIVO EXCEL - Size: {len(contents) if 'contents' in locals() else 'unknown'}")
        contents = await file.read()
        print(f"ARQUIVO LIDO - Size: {len(contents)} bytes")
        df = pd.read_excel(io.BytesIO(contents))
        print(f"EXCEL PROCESSADO - Linhas: {len(df)}, Colunas: {len(df.columns)}")
        
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
        processed_numbers = set()  # Para evitar duplicatas no mesmo arquivo
        
        for index, row in df.iterrows():
            try:
                # Verificar se já existe
                numero_contratacao = str(row.get('numero_contratacao', '')).strip()
                if not numero_contratacao:
                    errors.append(f"Linha {index + 2}: Número da contratação não informado")
                    continue
                
                # Verificar duplicatas dentro do mesmo arquivo
                if numero_contratacao in processed_numbers:
                    errors.append(f"Linha {index + 2}: Número da contratação {numero_contratacao} duplicado no arquivo")
                    continue
                
                processed_numbers.add(numero_contratacao)
                
                print(f"VERIFICANDO DUPLICATA - Numero: {numero_contratacao}")
                existing_pca = db.query(PCA).filter(
                    PCA.numero_contratacao == numero_contratacao
                ).first()
                print(f"RESULTADO DUPLICATA - Existe: {existing_pca is not None}")
                
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
                
                # Calcular se está atrasada - only "Não iniciada" contracts can be delayed
                # NULL values in situacao_execucao also mean "Não iniciada"
                situacao = pca_data.get('situacao_execucao')
                is_nao_iniciada = (situacao is None or 
                                 (situacao and situacao.lower().strip() == "não iniciada"))
                
                if (is_nao_iniciada and
                    pca_data.get('data_estimada_conclusao') and
                    pca_data['data_estimada_conclusao'] < datetime.now().date()):
                    pca_data['atrasada'] = True
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
                
                # Flush intermediário para detectar problemas mais cedo
                db.flush()
                    
            except Exception as e:
                db.rollback()
                error_msg = f"Linha {index + 2} (PCA {numero_contratacao}): {str(e)}"
                errors.append(error_msg)
                print(f"ERRO DE IMPORTACAO: {error_msg}")  # Debug mais visível
                import traceback
                print(f"TRACEBACK: {traceback.format_exc()}")  # Stack trace completo
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
        print(f"ERRO GERAL IMPORT: {str(e)}")
        import traceback
        print(f"TRACEBACK GERAL: {traceback.format_exc()}")
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


@router.get("/dashboard/charts")
def get_dashboard_charts(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    """Retorna dados para gráficos do dashboard de planejamento"""
    from sqlalchemy import func
    
    # Gráfico por situação da execução
    situacao_stats = db.query(
        PCA.situacao_execucao,
        func.count(PCA.id).label('quantidade')
    ).group_by(PCA.situacao_execucao).all()
    
    situacao_data = [
        {
            "name": item.situacao_execucao or "Não iniciada",
            "value": item.quantidade
        }
        for item in situacao_stats
    ]
    
    # Gráfico por categoria
    categoria_stats = db.query(
        PCA.categoria_contratacao,
        func.count(PCA.id).label('quantidade')
    ).group_by(PCA.categoria_contratacao).all()
    
    categoria_data = [
        {
            "name": item.categoria_contratacao or "Não informada",
            "value": item.quantidade
        }
        for item in categoria_stats
    ]
    
    # Gráfico por status da contratação
    status_stats = db.query(
        PCA.status_contratacao,
        func.count(PCA.id).label('quantidade')
    ).group_by(PCA.status_contratacao).all()
    
    status_data = [
        {
            "name": item.status_contratacao or "Não informado",
            "value": item.quantidade
        }
        for item in status_stats
    ]
    
    # Gráfico de valores por categoria
    valor_categoria_stats = db.query(
        PCA.categoria_contratacao,
        func.sum(PCA.valor_total).label('valor_total')
    ).group_by(PCA.categoria_contratacao).all()
    
    valor_categoria_data = [
        {
            "name": item.categoria_contratacao or "Não informada",
            "value": float(item.valor_total or 0)
        }
        for item in valor_categoria_stats
    ]
    
    return {
        "situacao_execucao": situacao_data,
        "categoria": categoria_data,
        "status_contratacao": status_data,
        "valor_por_categoria": valor_categoria_data
    }