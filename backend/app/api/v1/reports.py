from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Response, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api import deps
from app.core.database import get_db
from app.models.usuario import Usuario
from app.models.pca import PCA
from app.models.qualificacao import Qualificacao
from app.models.licitacao import Licitacao
import pandas as pd
import io
from datetime import datetime, date
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
import matplotlib.pyplot as plt
import seaborn as sns
import base64
from reportlab.platypus import Image
import tempfile
import os

router = APIRouter()

# Mapeamento de campos para labels legíveis
FIELD_LABELS = {
    'numero_contratacao': 'Número da Contratação',
    'titulo_contratacao': 'Título da Contratação',
    'categoria_contratacao': 'Categoria da Contratação',
    'valor_total': 'Valor Total',
    'area_requisitante': 'Área Requisitante',
    'area_demandante': 'Área Demandante',
    'numero_dfd': 'Número DFD',
    'data_estimada_inicio': 'Data Estimada de Início',
    'data_estimada_conclusao': 'Data Estimada de Conclusão',
    'status_contratacao': 'Status da Contratação',
    'situacao_execucao': 'Situação da Execução',
    'atrasada': 'Atrasada',
    'nup': 'NUP',
    'responsavel_instrucao': 'Responsável pela Instrução',
    'modalidade': 'Modalidade',
    'objeto': 'Objeto',
    'palavra_chave': 'Palavra-chave',
    'valor_estimado': 'Valor Estimado',
    'status': 'Status',
    'observacoes': 'Observações',
    'pregoeiro': 'Pregoeiro',
    'valor_homologado': 'Valor Homologado',
    'data_homologacao': 'Data de Homologação',
    'link': 'Link',
    'economia': 'Economia'
}

def format_currency(value):
    """Formatar valor monetário"""
    if value is None or value == 0:
        return 'R$ 0,00'
    return f'R$ {value:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')

def format_date(date_value):
    """Formatar data"""
    if date_value is None:
        return 'N/A'
    if isinstance(date_value, str):
        try:
            date_obj = datetime.strptime(date_value, '%Y-%m-%d')
            return date_obj.strftime('%d/%m/%Y')
        except:
            return date_value
    return date_value.strftime('%d/%m/%Y') if hasattr(date_value, 'strftime') else str(date_value)

def format_boolean(value):
    """Formatar valores booleanos"""
    if value is True:
        return 'Sim'
    elif value is False:
        return 'Não'
    return str(value) if value is not None else 'N/A'

def get_field_label(field_name):
    """Obter label legível para o campo"""
    return FIELD_LABELS.get(field_name, field_name.replace('_', ' ').title())

# Schemas para o relatório customizado
class ReportFilters(BaseModel):
    dateStart: Optional[str] = None
    dateEnd: Optional[str] = None
    status: Optional[List[str]] = None
    minValue: Optional[float] = None
    maxValue: Optional[float] = None
    areasDemandantes: Optional[List[str]] = None

class CustomReportRequest(BaseModel):
    dataSource: str
    selectedFields: List[str]
    charts: List[str]
    filters: ReportFilters


@router.get("/pca")
def export_pca_report(
    format: str = "excel",
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    pcas = db.query(PCA).all()
    
    data = []
    for pca in pcas:
        data.append({
            "Número Contratação": pca.numero_contratacao,
            "Status": pca.status_contratacao,
            "Situação Execução": pca.situacao_execucao,
            "Título": pca.titulo_contratacao,
            "Categoria": pca.categoria_contratacao,
            "Valor Total": float(pca.valor_total) if pca.valor_total else 0,
            "Área Requisitante": pca.area_requisitante,
            "Número DFD": pca.numero_dfd,
            "Data Início": pca.data_estimada_inicio.strftime('%d/%m/%Y') if pca.data_estimada_inicio else None,
            "Data Conclusão": pca.data_estimada_conclusao.strftime('%d/%m/%Y') if pca.data_estimada_conclusao else None,
            "Atrasada": "Sim" if pca.atrasada else "Não",
            "Criado em": pca.created_at.replace(tzinfo=None) if pca.created_at else None
        })
    
    df = pd.DataFrame(data)
    
    # Convert any remaining datetime objects to timezone-naive
    for col in df.columns:
        if df[col].dtype.kind in ['M', 'O']:  # datetime or object columns
            df[col] = df[col].apply(lambda x: x.replace(tzinfo=None) if hasattr(x, 'replace') and hasattr(x, 'tzinfo') and x.tzinfo is not None else x)
    
    if format.lower() == "excel":
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='PCA Report', index=False)
        output.seek(0)
        
        return Response(
            content=output.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=pca_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            }
        )
    
    return {"data": data}


@router.get("/qualificacao")
def export_qualificacao_report(
    format: str = "excel",
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    qualificacoes = db.query(Qualificacao).all()
    
    data = []
    for qual in qualificacoes:
        data.append({
            "NUP": qual.nup,
            "Número Contratação": qual.numero_contratacao,
            "Área Demandante": qual.area_demandante,
            "Responsável Instrução": qual.responsavel_instrucao,
            "Modalidade": qual.modalidade,
            "Objeto": qual.objeto,
            "Palavra Chave": qual.palavra_chave,
            "Valor Estimado": float(qual.valor_estimado) if qual.valor_estimado else 0,
            "Status": qual.status,
            "Observações": qual.observacoes,
            "Criado em": qual.created_at.replace(tzinfo=None) if qual.created_at else None
        })
    
    df = pd.DataFrame(data)
    
    # Convert any remaining datetime objects to timezone-naive
    for col in df.columns:
        if df[col].dtype.kind in ['M', 'O']:  # datetime or object columns
            df[col] = df[col].apply(lambda x: x.replace(tzinfo=None) if hasattr(x, 'replace') and hasattr(x, 'tzinfo') and x.tzinfo is not None else x)
    
    if format.lower() == "excel":
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Qualificação Report', index=False)
        output.seek(0)
        
        return Response(
            content=output.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=qualificacao_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            }
        )
    
    return {"data": data}


@router.get("/licitacao")
def export_licitacao_report(
    format: str = "excel",
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    licitacoes = db.query(Licitacao).all()
    
    data = []
    for lic in licitacoes:
        data.append({
            "NUP": lic.nup,
            "Número Contratação": lic.numero_contratacao,
            "Área Demandante": lic.area_demandante,
            "Responsável Instrução": lic.responsavel_instrucao,
            "Modalidade": lic.modalidade,
            "Objeto": lic.objeto,
            "Palavra Chave": lic.palavra_chave,
            "Valor Estimado": float(lic.valor_estimado) if lic.valor_estimado else 0,
            "Pregoeiro": lic.pregoeiro,
            "Valor Homologado": float(lic.valor_homologado) if lic.valor_homologado else 0,
            "Data Homologação": lic.data_homologacao.strftime('%d/%m/%Y') if lic.data_homologacao else None,
            "Link": lic.link,
            "Status": lic.status,
            "Economia": float(lic.economia) if lic.economia else 0,
            "Observações": lic.observacoes,
            "Criado em": lic.created_at.replace(tzinfo=None) if lic.created_at else None
        })
    
    df = pd.DataFrame(data)
    
    # Convert any remaining datetime objects to timezone-naive
    for col in df.columns:
        if df[col].dtype.kind in ['M', 'O']:  # datetime or object columns
            df[col] = df[col].apply(lambda x: x.replace(tzinfo=None) if hasattr(x, 'replace') and hasattr(x, 'tzinfo') and x.tzinfo is not None else x)
    
    if format.lower() == "excel":
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Licitação Report', index=False)
        output.seek(0)
        
        return Response(
            content=output.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=licitacao_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            }
        )
    
    return {"data": data}


@router.get("/economia")
def export_economia_report(
    format: str = "excel",
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    licitacoes = db.query(Licitacao).filter(
        Licitacao.economia.isnot(None),
        Licitacao.economia > 0
    ).all()
    
    data = []
    total_economia = 0
    
    for lic in licitacoes:
        economia_valor = float(lic.economia)
        percentual = 0
        if lic.valor_estimado and lic.valor_estimado > 0:
            percentual = round((economia_valor / float(lic.valor_estimado)) * 100, 2)
        
        data.append({
            "NUP": lic.nup,
            "Número Contratação": lic.numero_contratacao,
            "Objeto": lic.objeto,
            "Valor Estimado": float(lic.valor_estimado) if lic.valor_estimado else 0,
            "Valor Homologado": float(lic.valor_homologado) if lic.valor_homologado else 0,
            "Economia (R$)": economia_valor,
            "Percentual Economia (%)": percentual,
            "Data Homologação": lic.data_homologacao.strftime('%d/%m/%Y') if lic.data_homologacao else None,
            "Status": lic.status
        })
        total_economia += economia_valor
    
    if format.lower() == "excel":
        df = pd.DataFrame(data)
        
        # Convert any remaining datetime objects to timezone-naive
        for col in df.columns:
            if df[col].dtype.kind in ['M', 'O']:  # datetime or object columns
                df[col] = df[col].apply(lambda x: x.replace(tzinfo=None) if hasattr(x, 'replace') and hasattr(x, 'tzinfo') and x.tzinfo is not None else x)
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Relatório de Economia', index=False)
            
            # Add summary sheet
            summary_data = [
                {"Métrica": "Total de Licitações com Economia", "Valor": len(data)},
                {"Métrica": "Economia Total (R$)", "Valor": total_economia},
                {"Métrica": "Economia Média por Licitação (R$)", "Valor": round(total_economia / len(data), 2) if data else 0}
            ]
            summary_df = pd.DataFrame(summary_data)
            summary_df.to_excel(writer, sheet_name='Resumo', index=False)
            
        output.seek(0)
        
        return Response(
            content=output.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=economia_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            }
        )
    
    return {
        "data": data,
        "summary": {
            "total_licitacoes": len(data),
            "total_economia": total_economia,
            "economia_media": round(total_economia / len(data), 2) if data else 0
        }
    }


@router.get("/areas-demandantes")
def get_areas_demandantes(
    data_source: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    """Retorna lista de áreas demandantes disponíveis para a fonte de dados"""
    model_map = {
        'pca': PCA,
        'qualificacao': Qualificacao,
        'licitacao': Licitacao
    }

    if data_source not in model_map:
        raise HTTPException(status_code=400, detail="Fonte de dados inválida")

    model = model_map[data_source]

    # Buscar campo correto de área demandante
    area_field = None
    if hasattr(model, 'area_requisitante'):
        area_field = model.area_requisitante
    elif hasattr(model, 'area_demandante'):
        area_field = model.area_demandante

    if area_field is None:
        return {"areas": []}

    # Buscar áreas únicas
    areas = db.query(area_field).distinct().filter(area_field.isnot(None)).all()
    areas_list = [area[0] for area in areas if area[0]]

    return {"areas": sorted(areas_list)}


@router.post("/custom")
def generate_custom_report(
    config: CustomReportRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    try:
        # Mapear fontes de dados para modelos
        model_map = {
            'pca': PCA,
            'qualificacao': Qualificacao,
            'licitacao': Licitacao
        }
        
        if config.dataSource not in model_map:
            raise HTTPException(status_code=400, detail="Fonte de dados inválida")
        
        model = model_map[config.dataSource]
        query = db.query(model)
        
        # Aplicar filtros
        if config.filters.dateStart:
            date_start = datetime.strptime(config.filters.dateStart, '%Y-%m-%d')
            if hasattr(model, 'created_at'):
                query = query.filter(model.created_at >= date_start)
            elif hasattr(model, 'data_estimada_inicio'):
                query = query.filter(model.data_estimada_inicio >= date_start)
        
        if config.filters.dateEnd:
            date_end = datetime.strptime(config.filters.dateEnd, '%Y-%m-%d')
            if hasattr(model, 'created_at'):
                query = query.filter(model.created_at <= date_end)
            elif hasattr(model, 'data_estimada_conclusao'):
                query = query.filter(model.data_estimada_conclusao <= date_end)
        
        if config.filters.minValue and hasattr(model, 'valor_total'):
            query = query.filter(model.valor_total >= config.filters.minValue)
        elif config.filters.minValue and hasattr(model, 'valor_estimado'):
            query = query.filter(model.valor_estimado >= config.filters.minValue)
        
        if config.filters.maxValue and hasattr(model, 'valor_total'):
            query = query.filter(model.valor_total <= config.filters.maxValue)
        elif config.filters.maxValue and hasattr(model, 'valor_estimado'):
            query = query.filter(model.valor_estimado <= config.filters.maxValue)
        
        if config.filters.status:
            if hasattr(model, 'status'):
                query = query.filter(model.status.in_(config.filters.status))
            elif hasattr(model, 'status_contratacao'):
                query = query.filter(model.status_contratacao.in_(config.filters.status))

        # Filtro por área demandante
        if config.filters.areasDemandantes:
            if hasattr(model, 'area_requisitante'):
                query = query.filter(model.area_requisitante.in_(config.filters.areasDemandantes))
            elif hasattr(model, 'area_demandante'):
                query = query.filter(model.area_demandante.in_(config.filters.areasDemandantes))
        
        # Executar query
        records = query.all()
        
        if not records:
            raise HTTPException(status_code=404, detail="Nenhum registro encontrado com os filtros aplicados")
        
        # Preparar dados para DataFrame
        data = []
        for record in records:
            row_data = {}
            for field in config.selectedFields:
                if hasattr(record, field):
                    value = getattr(record, field)
                    # Tratar datas (datetime/date) com segurança
                    if hasattr(value, 'strftime'):
                        tz = getattr(value, 'tzinfo', None)
                        if tz:
                            try:
                                value = value.replace(tzinfo=None)
                            except Exception:
                                pass
                        row_data[field] = value.strftime('%d/%m/%Y') if ('data' in field.lower() or isinstance(value, (datetime, date))) else value
                    # Tratar valores monetários
                    elif field in ['valor_total', 'valor_estimado', 'valor_homologado', 'economia'] and value:
                        row_data[field] = float(value)
                    # Tratar campo atrasada (boolean para texto)
                    elif field == 'atrasada':
                        row_data[field] = "Sim" if value else "Não"
                    else:
                        row_data[field] = value
                else:
                    row_data[field] = None
            data.append(row_data)
        
        # Criar DataFrame
        df = pd.DataFrame(data)
        
        # Gerar dados para gráficos
        chart_data_list = []
        if config.charts:
            for chart_type in config.charts:
                try:
                    chart_data = generate_chart_data(df, chart_type, config.dataSource)
                    if chart_data:
                        chart_data_list.append({
                            'type': chart_type,
                            'data': chart_data,
                            'title': get_chart_title(chart_type)
                        })
                except Exception as e:
                    print(f"Erro ao gerar gráfico {chart_type}: {str(e)}")
                    continue
        
        # Gerar PDF
        pdf_content = generate_pdf_report(
            df=df,
            config=config,
            chart_data_list=chart_data_list,
            data_source_label=get_data_source_label(config.dataSource)
        )

        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=relatorio_customizado_{config.dataSource}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao gerar relatório customizado: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


def generate_chart_data(df: pd.DataFrame, chart_type: str, data_source: str) -> Optional[Dict]:
    """Gera dados para diferentes tipos de gráficos"""
    try:
        if chart_type == "status_distribution":
            status_col = 'status' if 'status' in df.columns else 'status_contratacao'
            if status_col in df.columns:
                status_counts = df[status_col].value_counts()
                return {
                    'Status': status_counts.index.tolist(),
                    'Quantidade': status_counts.values.tolist()
                }
        
        elif chart_type == "value_timeline":
            value_col = next((col for col in ['valor_total', 'valor_estimado', 'valor_homologado'] if col in df.columns), None)
            date_col = next((col for col in df.columns if 'data' in col.lower()), None)
            
            if value_col and date_col:
                # Agrupar por mês
                df_copy = df.copy()
                df_copy[date_col] = pd.to_datetime(df_copy[date_col], errors='coerce')
                monthly_data = df_copy.groupby(df_copy[date_col].dt.to_period('M'))[value_col].sum()
                
                return {
                    'Mes': [str(period) for period in monthly_data.index],
                    'Valor': monthly_data.values.tolist()
                }
        
        elif chart_type == "category_comparison":
            category_col = next((col for col in ['categoria_contratacao', 'modalidade'] if col in df.columns), None)
            value_col = next((col for col in ['valor_total', 'valor_estimado'] if col in df.columns), None)
            
            if category_col and value_col:
                category_data = df.groupby(category_col)[value_col].sum()
                return {
                    'Categoria': category_data.index.tolist(),
                    'Valor': category_data.values.tolist()
                }
        
        elif chart_type == "summary_table":
            numeric_columns = df.select_dtypes(include=['number']).columns
            if len(numeric_columns) > 0:
                # Retornar dados para gráfico de barras com estatísticas
                col = numeric_columns[0]  # Usar a primeira coluna numérica
                return {
                    'Estatistica': ['Total', 'Média', 'Máximo', 'Mínimo'],
                    'Valor': [
                        float(df[col].sum()) if not pd.isna(df[col].sum()) else 0,
                        float(df[col].mean()) if not pd.isna(df[col].mean()) else 0,
                        float(df[col].max()) if not pd.isna(df[col].max()) else 0,
                        float(df[col].min()) if not pd.isna(df[col].min()) else 0
                    ]
                }
            else:
                # Se não há colunas numéricas, mostrar contagem por status
                status_col = 'status' if 'status' in df.columns else 'status_contratacao'
                if status_col in df.columns:
                    status_counts = df[status_col].value_counts()
                    return {
                        'Estatistica': status_counts.index.tolist()[:4],
                        'Valor': status_counts.values.tolist()[:4]
                    }
                return None
        
        return None
        
    except Exception as e:
        print(f"Erro ao gerar dados do gráfico {chart_type}: {str(e)}")
        return None


def get_chart_title(chart_type: str) -> str:
    """Retorna o título do gráfico baseado no tipo"""
    titles = {
        'status_distribution': 'Distribuição por Status',
        'value_timeline': 'Valores ao Longo do Tempo',
        'category_comparison': 'Comparação por Categoria/Modalidade',
        'summary_table': 'Tabela Resumo'
    }
    return titles.get(chart_type, chart_type)


def get_data_source_label(data_source: str) -> str:
    """Retorna o label da fonte de dados"""
    labels = {
        'pca': 'Planejamento (PCA)',
        'qualificacao': 'Qualificação',
        'licitacao': 'Licitação'
    }
    return labels.get(data_source, data_source)


def generate_pdf_report(df: pd.DataFrame, config: CustomReportRequest, chart_data_list: List[Dict], data_source_label: str) -> bytes:
    """Gera o relatório em PDF com gráficos e formatação profissional"""

    # Criar buffer de bytes para o PDF
    buffer = io.BytesIO()

    # Configurar documento PDF em paisagem para tabelas
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=40,
        leftMargin=40,
        topMargin=60,
        bottomMargin=40
    )

    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=HexColor('#495057'),
        spaceAfter=30,
        alignment=1  # Centralizado
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=HexColor('#6c757d'),
        spaceAfter=20,
        alignment=1
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=HexColor('#495057'),
        spaceAfter=15
    )

    # Lista de elementos do PDF
    elements = []

    # Cabeçalho
    elements.append(Paragraph("RELATÓRIO GERENCIAL", title_style))
    elements.append(Paragraph(f"{data_source_label}", subtitle_style))
    elements.append(Paragraph(f"Data de Emissão: {datetime.now().strftime('%d/%m/%Y às %H:%M:%S')}", styles['Normal']))
    elements.append(Spacer(1, 20))

    # Filtros aplicados
    active_filters = []
    if config.filters.dateStart:
        active_filters.append(f"Data Início: {format_date(config.filters.dateStart)}")
    if config.filters.dateEnd:
        active_filters.append(f"Data Fim: {format_date(config.filters.dateEnd)}")
    if config.filters.minValue:
        active_filters.append(f"Valor Mínimo: {format_currency(config.filters.minValue)}")
    if config.filters.maxValue:
        active_filters.append(f"Valor Máximo: {format_currency(config.filters.maxValue)}")
    if config.filters.status:
        active_filters.append(f"Status: {', '.join(config.filters.status)}")
    if config.filters.areasDemandantes:
        active_filters.append(f"Áreas Demandantes: {', '.join(config.filters.areasDemandantes)}")

    if active_filters:
        elements.append(Paragraph("FILTROS APLICADOS:", heading_style))
        for filter_text in active_filters:
            elements.append(Paragraph(f"• {filter_text}", styles['Normal']))
        elements.append(Spacer(1, 15))

    # Resumo estatístico
    elements.append(Paragraph("RESUMO ESTATÍSTICO:", heading_style))
    stats_data = [
        ['Métrica', 'Valor'],
        ['Total de Registros', str(len(df))],
        ['Campos Selecionados', str(len(config.selectedFields))],
        ['Visualizações', str(len(chart_data_list))],
        ['Filtros Aplicados', str(len(active_filters))]
    ]

    stats_table = Table(stats_data, colWidths=[3*inch, 2*inch])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#f8f9fa')),
        ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#495057')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#ffffff')),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#dee2e6'))
    ]))
    elements.append(stats_table)
    elements.append(Spacer(1, 20))

    # Gerar gráficos
    chart_images = []
    if chart_data_list:
        elements.append(Paragraph("ANÁLISE GRÁFICA:", heading_style))

        for chart_info in chart_data_list:
            chart_type = chart_info['type']
            chart_data = chart_info['data']
            chart_title = chart_info['title']

            # Criar gráfico com matplotlib
            plt.figure(figsize=(8, 6))
            sns.set_style("whitegrid")

            if chart_type == 'status_distribution':
                labels = chart_data.get('Status', [])
                values = chart_data.get('Quantidade', [])
                if labels and values:
                    plt.pie(values, labels=labels, autopct='%1.1f%%', startangle=90)
                    plt.title(chart_title, fontsize=14, fontweight='bold')

            elif chart_type == 'value_timeline':
                months = chart_data.get('Mes', [])
                values = chart_data.get('Valor', [])
                if months and values:
                    plt.plot(months, values, marker='o', linewidth=2, markersize=6)
                    plt.title(chart_title, fontsize=14, fontweight='bold')
                    plt.xlabel('Mês')
                    plt.ylabel('Valor (R$)')
                    plt.xticks(rotation=45)
                    plt.gca().yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'R$ {x:,.0f}'))

            elif chart_type == 'category_comparison':
                categories = chart_data.get('Categoria', [])
                values = chart_data.get('Valor', [])
                if categories and values:
                    plt.bar(categories, values, color='#16a34a', alpha=0.8)
                    plt.title(chart_title, fontsize=14, fontweight='bold')
                    plt.xlabel('Categoria')
                    plt.ylabel('Valor (R$)')
                    plt.xticks(rotation=45, ha='right')
                    plt.gca().yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'R$ {x:,.0f}'))

            elif chart_type == 'summary_table':
                stats = chart_data.get('Estatistica', [])
                values = chart_data.get('Valor', [])
                if stats and values:
                    colors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04']
                    plt.bar(stats, values, color=colors[:len(stats)], alpha=0.8)
                    plt.title(chart_title, fontsize=14, fontweight='bold')
                    plt.xlabel('Estatística')
                    plt.ylabel('Valor (R$)')
                    plt.xticks(rotation=45, ha='right')
                    plt.gca().yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'R$ {x:,.0f}'))

            plt.tight_layout()

            # Salvar gráfico em arquivo temporário
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_file:
                plt.savefig(tmp_file.name, dpi=150, bbox_inches='tight')
                chart_images.append(tmp_file.name)

            plt.close()

        # Adicionar gráficos ao PDF
        for img_path in chart_images:
            try:
                img = Image(img_path, width=6*inch, height=4*inch)
                elements.append(img)
                elements.append(Spacer(1, 15))
            except:
                pass  # Se houver erro na imagem, pula

    # Quebra de página antes da tabela
    elements.append(PageBreak())

    # Tabela de dados
    elements.append(Paragraph("DADOS DETALHADOS:", heading_style))

    if not df.empty:
        # Preparar dados da tabela com formatação
        table_data = []

        # Cabeçalhos com labels legíveis
        headers = [get_field_label(col) for col in df.columns]
        table_data.append(headers)

        # Dados formatados
        for _, row in df.iterrows():
            formatted_row = []
            for col in df.columns:
                value = row[col]

                # Aplicar formatação baseada no tipo de campo
                if col in ['valor_total', 'valor_estimado', 'valor_homologado', 'economia']:
                    formatted_value = format_currency(value)
                elif col in ['data_estimada_inicio', 'data_estimada_conclusao', 'data_homologacao']:
                    formatted_value = format_date(value)
                elif col == 'atrasada':
                    formatted_value = format_boolean(value)
                else:
                    formatted_value = str(value) if value is not None else 'N/A'

                # Limitar tamanho do texto para não quebrar a tabela
                if len(formatted_value) > 30:
                    formatted_value = formatted_value[:27] + '...'

                formatted_row.append(formatted_value)

            table_data.append(formatted_row)

        # Calcular largura das colunas dinamicamente
        num_cols = len(headers)
        available_width = 10 * inch  # Largura disponível em paisagem
        col_width = available_width / num_cols
        col_widths = [col_width] * num_cols

        # Criar tabela
        data_table = Table(table_data, colWidths=col_widths, repeatRows=1)
        data_table.setStyle(TableStyle([
            # Estilo do cabeçalho
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#f8f9fa')),
            ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#495057')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),

            # Estilo dos dados
            ('BACKGROUND', (0, 1), (-1, -1), HexColor('#ffffff')),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#dee2e6')),

            # Zebra striping
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#ffffff'), HexColor('#f8f9fa')]),

            # Quebra de texto
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))

        elements.append(data_table)
    else:
        elements.append(Paragraph("Nenhum dado encontrado com os filtros aplicados.", styles['Normal']))

    # Rodapé
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Sistema de Contratações Públicas - Documento Oficial",
                             ParagraphStyle('Footer', parent=styles['Normal'],
                                          fontSize=10, textColor=HexColor('#6c757d'),
                                          alignment=1)))

    # Construir PDF
    doc.build(elements)

    # Limpar arquivos temporários de gráficos
    for img_path in chart_images:
        try:
            os.unlink(img_path)
        except:
            pass

    # Retornar bytes do PDF
    buffer.seek(0)
    return buffer.getvalue()
