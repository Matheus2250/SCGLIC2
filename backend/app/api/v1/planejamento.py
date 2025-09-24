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
import re
import uuid


def clean_text(text):
    """Limpa e corrige caracteres especiais corrompidos"""
    if pd.isna(text) or text == '':
        return None

    text = str(text)
    # Correções de encoding corrompido comum (baseado em convert_pca.py)
    replacements = {
        '�': 'ã',
        '��o': 'ção',
        '��': 'ção',
        'contrata��o': 'contratação',
        'situa��o': 'situação',
        'execu��o': 'execução',
        'prepara��o': 'preparação',
        't�tulo': 'título',
        'servi�o': 'serviço',
        'informa��o': 'informação',
        'comunica��o': 'comunicação',
        'aquisi��o': 'aquisição',
        'manuten��o': 'manutenção',
        '�rea': 'área',
        'n�mero': 'número',
        'in�cio': 'início',
        'conclus�o': 'conclusão',
        'dura��o': 'duração',
        'transfer�ncia': 'transferência',
        'assist�ncia': 'assistência',
        't�cnica': 'técnica',
        'cient�fica': 'científica',
        'implementa��o': 'implementação',
        '�gil': 'ágil',
        'ag�ncias': 'agências',
        'mobili�rios': 'mobiliários',
        'acess�rios': 'acessórios',
        'an�lise': 'análise',
        'tecnologia': 'tecnologia',
        'licenciamento': 'licenciamento'
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    return text.strip()


def parse_csv_date(date_str):
    """Converte string de data CSV para formato datetime"""
    if pd.isna(date_str) or date_str == '':
        return None

    date_str = str(date_str).strip()

    # Tentar diferentes formatos de data
    formats = ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y']

    for fmt in formats:
        try:
            from datetime import datetime
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue

    return None


def parse_csv_currency(value_str):
    """Converte string de valor monetário CSV para float"""
    if pd.isna(value_str) or value_str == '':
        return 0.0

    value_str = str(value_str).strip()

    # Remove espaços e outros caracteres não numéricos
    value_str = re.sub(r'[^\d,.]', '', value_str)

    # Se tem vírgula, é separador decimal brasileiro
    if ',' in value_str:
        # Dividir em parte inteira e decimal
        parts = value_str.split(',')
        integer_part = parts[0].replace('.', '')  # Remove pontos de milhares
        decimal_part = parts[1] if len(parts) > 1 else '00'
        value_str = integer_part + '.' + decimal_part

    try:
        return float(value_str)
    except ValueError:
        return 0.0



router = APIRouter()


@router.get("/", response_model=List[PCASchema])
def read_pcas(
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    pcas = db.query(PCA).offset(skip).limit(limit).all()
    return pcas


@router.post("/", response_model=PCASchema)
def create_pca(
    pca_in: PCACreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_user_with_write_access)
) -> Any:
    # Check if PCA already exists
    existing_pca = db.query(PCA).filter(PCA.numero_contratacao == pca_in.numero_contratacao).first()
    if existing_pca:
        raise HTTPException(status_code=400, detail="PCA with this number already exists")
    
    pca = PCA(
        **pca_in.dict(),
        created_by=current_user.id
    )
    db.add(pca)
    db.commit()
    db.refresh(pca)
    return pca


@router.get("/atrasadas")
def get_pcas_atrasadas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> List[PCASchema]:
    from sqlalchemy import text

    # Buscar contratações atrasadas usando a mesma lógica SQL
    sql_query = text("""
        SELECT * FROM pca
        WHERE situacao_execucao = 'Não iniciada'
          AND data_estimada_inicio < CURRENT_DATE
          AND data_estimada_conclusao >= CURRENT_DATE
        ORDER BY data_estimada_inicio ASC
    """)

    result = db.execute(sql_query)
    pcas = result.fetchall()

    # Converter resultados para objetos PCA
    pca_objects = []
    for row in pcas:
        pca = PCA()
        for column, value in zip(result.keys(), row):
            setattr(pca, column, value)
        pca_objects.append(pca)

    return pca_objects


@router.get("/vencidas")
def get_pcas_vencidas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> List[PCASchema]:
    from sqlalchemy import text

    # Buscar contratações vencidas usando a mesma lógica SQL
    sql_query = text("""
        SELECT * FROM pca
        WHERE situacao_execucao = 'Não iniciada'
          AND data_estimada_conclusao < CURRENT_DATE
        ORDER BY data_estimada_conclusao ASC
    """)

    result = db.execute(sql_query)
    pcas = result.fetchall()

    # Converter resultados para objetos PCA
    pca_objects = []
    for row in pcas:
        pca = PCA()
        for column, value in zip(result.keys(), row):
            setattr(pca, column, value)
        pca_objects.append(pca)

    return pca_objects




@router.get("/{pca_id}", response_model=PCASchema)
def read_pca(
    pca_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    pca = db.query(PCA).filter(PCA.id == pca_id).first()
    if not pca:
        raise HTTPException(status_code=404, detail="PCA not found")
    return pca


@router.put("/{pca_id}", response_model=PCASchema)
def update_pca(
    pca_id: uuid.UUID,
    pca_in: PCAUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_user_with_write_access)
) -> Any:
    pca = db.query(PCA).filter(PCA.id == pca_id).first()
    if not pca:
        raise HTTPException(status_code=404, detail="PCA not found")

    update_data = pca_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pca, field, value)

    db.commit()
    db.refresh(pca)
    return pca


@router.delete("/{pca_id}")
def delete_pca(
    pca_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_user_with_write_access)
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
    current_user: Usuario = Depends(deps.get_user_with_write_access)
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



@router.post("/import-csv")
async def import_pca_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_user_with_write_access)
) -> Any:
    """Importa dados do PCA a partir de arquivo CSV e converte automaticamente"""
    print(f"INICIO IMPORT CSV - Filename: {file.filename}, ContentType: {file.content_type}")
    try:
        # Validar tipo de arquivo
        print(f"VALIDANDO ARQUIVO CSV - Filename: {file.filename}")
        if not file.filename.endswith('.csv'):
            print(f"ERRO VALIDACAO CSV - Arquivo inválido: {file.filename}")
            raise HTTPException(
                status_code=400,
                detail="Arquivo deve ser CSV (.csv)"
            )

        # Ler o arquivo CSV
        print(f"LENDO ARQUIVO CSV")
        contents = await file.read()
        print(f"ARQUIVO CSV LIDO - Size: {len(contents)} bytes")

        # Tentar diferentes encodings (melhorado com base no convert_pca.py)
        df = None
        encodings = ['windows-1252', 'utf-8', 'latin1', 'iso-8859-1', 'cp1252']

        for encoding in encodings:
            try:
                df = pd.read_csv(io.BytesIO(contents), sep=';', encoding=encoding)
                print(f"CSV PROCESSADO COM ENCODING {encoding} - Linhas: {len(df)}, Colunas: {len(df.columns)}")
                break
            except Exception as e:
                print(f"Erro com encoding {encoding}: {e}")
                continue

        if df is None:
            raise HTTPException(
                status_code=400,
                detail="Erro ao processar arquivo CSV. Verifique o formato e encoding."
            )

        print("Colunas encontradas no CSV:")
        for i, col in enumerate(df.columns):
            print(f"{i+1}. {col}")

        # Mapeamento das colunas do CSV para a tabela PCA (baseado no convert_pca.py)
        column_mapping = {
            0: 'numero_contratacao',      # Número da contratação
            1: 'status_contratacao',      # Status da contratação
            2: 'situacao_execucao',       # Situação da Execução
            3: 'titulo_contratacao',      # Título da contratação
            4: 'categoria_contratacao',   # Categoria da contratação
            6: 'data_estimada_inicio',    # Data estimada para o início
            7: 'data_estimada_conclusao', # Data estimada para a conclusão
            9: 'area_requisitante',       # Área requisitante
            10: 'numero_dfd',             # Nº DFD
            24: 'valor_total'             # Valor Total (coluna 25, índice 24)
        }

        # Processar e limpar dados
        clean_data = []
        processed_numbers = set()

        print("Processando registros do CSV...")

        for index, row in df.iterrows():
            try:
                # Extrair dados usando o mapeamento de colunas
                record = {}

                for col_index, field_name in column_mapping.items():
                    if col_index < len(df.columns):
                        raw_value = row.iloc[col_index] if col_index < len(row) else None

                        if field_name in ['data_estimada_inicio', 'data_estimada_conclusao']:
                            record[field_name] = parse_csv_date(raw_value)
                        elif field_name == 'valor_total':
                            record[field_name] = parse_csv_currency(raw_value)
                        else:
                            cleaned_value = clean_text(raw_value)
                            # Se for situacao_execucao e estiver vazio, colocar "Não iniciada"
                            if field_name == 'situacao_execucao' and (cleaned_value is None or cleaned_value == ''):
                                cleaned_value = 'Não iniciada'
                            record[field_name] = cleaned_value

                # Verificar se tem número de contratação
                numero_contratacao = record.get('numero_contratacao')
                if not numero_contratacao:
                    print(f"Linha {index + 2}: Número da contratação não informado")
                    continue

                numero_contratacao = str(numero_contratacao).strip()

                # Verificar duplicatas dentro do mesmo arquivo
                if numero_contratacao in processed_numbers:
                    print(f"Linha {index + 2}: Número da contratação {numero_contratacao} duplicado no arquivo")
                    continue

                processed_numbers.add(numero_contratacao)
                clean_data.append(record)

            except Exception as e:
                print(f"Erro processando linha CSV {index + 2}: {e}")
                continue

        print(f"CSV processado: {len(clean_data)} registros válidos de {len(df)} total")

        # Agora processar como se fosse importação Excel normal
        imported = 0
        updated = 0
        errors = []

        for record in clean_data:
            try:
                numero_contratacao = record['numero_contratacao']

                print(f"VERIFICANDO DUPLICATA CSV - Numero: {numero_contratacao}")
                existing_pca = db.query(PCA).filter(
                    PCA.numero_contratacao == numero_contratacao
                ).first()
                print(f"RESULTADO DUPLICATA CSV - Existe: {existing_pca is not None}")


                if existing_pca:
                    # Atualizar registro existente
                    for key, value in record.items():
                        setattr(existing_pca, key, value)
                    updated += 1
                else:
                    # Criar novo registro
                    record['created_by'] = current_user.id
                    new_pca = PCA(**record)
                    db.add(new_pca)
                    imported += 1

                # Flush intermediário
                db.flush()

            except Exception as e:
                db.rollback()
                error_msg = f"PCA {numero_contratacao}: {str(e)}"
                errors.append(error_msg)
                print(f"ERRO DE IMPORTACAO CSV: {error_msg}")
                import traceback
                print(f"TRACEBACK CSV: {traceback.format_exc()}")
                continue

        # Commit das alterações
        db.commit()

        return {
            "success": True,
            "message": f"Importação CSV concluída",
            "imported": imported,
            "updated": updated,
            "total": len(clean_data),
            "errors": errors[:5] if errors else []
        }

    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=400,
            detail="Arquivo CSV está vazio"
        )
    except Exception as e:
        db.rollback()
        print(f"ERRO GERAL IMPORT CSV: {str(e)}")
        import traceback
        print(f"TRACEBACK GERAL CSV: {traceback.format_exc()}")
        raise HTTPException(
            status_code=400,
            detail=f"Erro ao processar arquivo CSV: {str(e)}"
        )


@router.get("/debug/situacoes")
def debug_situacoes_execucao(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    """Endpoint temporário para debugar valores de situacao_execucao"""
    from datetime import date
    from sqlalchemy import func
    
    # Listar todos os valores únicos de situacao_execucao
    situacoes = db.query(PCA.situacao_execucao, func.count(PCA.id)).group_by(PCA.situacao_execucao).all()
    
    # Contratações com data de conclusão passada
    today = date.today()
    all_pcas = db.query(PCA).all()
    vencidas_por_data = [pca for pca in all_pcas if pca.vencida]
    
    return {
        "total_pcas": db.query(PCA).count(),
        "situacoes_execucao": [{"situacao": s[0], "quantidade": s[1]} for s in situacoes],
        "contratacoes_com_data_passada": len(vencidas_por_data),
        "exemplos_vencidas_por_data": [
            {
                "numero": pca.numero_contratacao,
                "situacao": pca.situacao_execucao,
                "data_conclusao": str(pca.data_estimada_conclusao),
                "atrasada": pca.atrasada
            } for pca in vencidas_por_data[:10]  # Primeiros 10 exemplos
        ]
    }

@router.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    from sqlalchemy import text

    # Usar a consulta SQL direta conforme especificado
    sql_query = text("""
        SELECT
            COUNT(*) as total,
            COUNT(CASE
                      WHEN situacao_execucao = 'Não iniciada'
                           AND data_estimada_inicio < CURRENT_DATE
                           AND data_estimada_conclusao >= CURRENT_DATE
                      THEN 1
                 END) as atrasadas,
            COUNT(CASE
                      WHEN situacao_execucao = 'Não iniciada'
                           AND data_estimada_conclusao < CURRENT_DATE
                      THEN 1
                 END) as vencidas
        FROM pca
    """)

    result = db.execute(sql_query).fetchone()

    total_pcas = result.total
    pcas_atrasadas = result.atrasadas
    pcas_vencidas = result.vencidas
    pcas_no_prazo = total_pcas - pcas_atrasadas - pcas_vencidas

    print(f"SQL STATS: Total={total_pcas}, Atrasadas={pcas_atrasadas}, Vencidas={pcas_vencidas}, No prazo={pcas_no_prazo}")

    return {
        "total_pcas": total_pcas,
        "pcas_atrasadas": pcas_atrasadas,
        "pcas_vencidas": pcas_vencidas,
        "pcas_no_prazo": pcas_no_prazo
    }




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