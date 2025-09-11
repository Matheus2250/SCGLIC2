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
from datetime import datetime

router = APIRouter()

# Schemas para o relatório customizado
class ReportFilters(BaseModel):
    dateStart: Optional[str] = None
    dateEnd: Optional[str] = None
    status: Optional[List[str]] = None
    minValue: Optional[float] = None
    maxValue: Optional[float] = None

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
                    # Tratar datas
                    if hasattr(value, 'strftime'):
                        if value.tzinfo:
                            value = value.replace(tzinfo=None)
                        row_data[field] = value.strftime('%d/%m/%Y') if 'data' in field.lower() else value
                    # Tratar valores monetários
                    elif field in ['valor_total', 'valor_estimado', 'valor_homologado', 'economia'] and value:
                        row_data[field] = float(value)
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
        
        # Gerar HTML
        html_content = generate_html_report(
            df=df,
            config=config,
            chart_data_list=chart_data_list,
            data_source_label=get_data_source_label(config.dataSource)
        )
        
        return Response(
            content=html_content,
            media_type="text/html",
            headers={
                "Content-Disposition": f"attachment; filename=relatorio_customizado_{config.dataSource}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
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
            summary_data = []
            
            for col in numeric_columns:
                summary_data.append({
                    'Campo': col,
                    'Total': df[col].sum(),
                    'Média': df[col].mean(),
                    'Máximo': df[col].max(),
                    'Mínimo': df[col].min()
                })
            
            return summary_data
        
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


def generate_html_report(df: pd.DataFrame, config: CustomReportRequest, chart_data_list: List[Dict], data_source_label: str) -> str:
    """Gera o relatório em HTML com gráficos Chart.js"""
    
    # Converter DataFrame para HTML table
    table_html = df.to_html(classes='table table-striped table-hover', table_id='dataTable', escape=False, index=False)
    
    # Preparar dados dos gráficos para JavaScript
    charts_js = ""
    chart_containers = ""
    
    for i, chart_info in enumerate(chart_data_list):
        chart_id = f"chart_{i}"
        chart_type = chart_info['type']
        chart_data = chart_info['data']
        chart_title = chart_info['title']
        
        # Container do gráfico
        chart_containers += f'''
        <div class="col-md-6 mb-4">
            <div class="card">
                <div class="card-header">
                    <h5>{chart_title}</h5>
                </div>
                <div class="card-body">
                    <canvas id="{chart_id}" width="400" height="200"></canvas>
                </div>
            </div>
        </div>
        '''
        
        # JavaScript para gerar o gráfico
        if chart_type == 'status_distribution':
            charts_js += f'''
            // {chart_title}
            const ctx_{i} = document.getElementById('{chart_id}').getContext('2d');
            new Chart(ctx_{i}, {{
                type: 'pie',
                data: {{
                    labels: {chart_data.get('Status', [])},
                    datasets: [{{
                        data: {chart_data.get('Quantidade', [])},
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                        ]
                    }}]
                }},
                options: {{
                    responsive: true,
                    plugins: {{
                        legend: {{
                            position: 'bottom'
                        }}
                    }}
                }}
            }});
            '''
            
        elif chart_type == 'value_timeline':
            charts_js += f'''
            // {chart_title}
            const ctx_{i} = document.getElementById('{chart_id}').getContext('2d');
            new Chart(ctx_{i}, {{
                type: 'line',
                data: {{
                    labels: {chart_data.get('Mes', [])},
                    datasets: [{{
                        label: 'Valor',
                        data: {chart_data.get('Valor', [])},
                        borderColor: '#36A2EB',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.1
                    }}]
                }},
                options: {{
                    responsive: true,
                    scales: {{
                        y: {{
                            beginAtZero: true,
                            ticks: {{
                                callback: function(value) {{
                                    return 'R$ ' + value.toLocaleString('pt-BR');
                                }}
                            }}
                        }}
                    }}
                }}
            }});
            '''
            
        elif chart_type == 'category_comparison':
            charts_js += f'''
            // {chart_title}
            const ctx_{i} = document.getElementById('{chart_id}').getContext('2d');
            new Chart(ctx_{i}, {{
                type: 'bar',
                data: {{
                    labels: {chart_data.get('Categoria', [])},
                    datasets: [{{
                        label: 'Valor',
                        data: {chart_data.get('Valor', [])},
                        backgroundColor: '#4BC0C0'
                    }}]
                }},
                options: {{
                    responsive: true,
                    scales: {{
                        y: {{
                            beginAtZero: true,
                            ticks: {{
                                callback: function(value) {{
                                    return 'R$ ' + value.toLocaleString('pt-BR');
                                }}
                            }}
                        }}
                    }}
                }}
            }});
            '''
    
    # Filtros ativos
    active_filters = []
    if config.filters.dateStart:
        active_filters.append(f"Data Início: {config.filters.dateStart}")
    if config.filters.dateEnd:
        active_filters.append(f"Data Fim: {config.filters.dateEnd}")
    if config.filters.minValue:
        active_filters.append(f"Valor Mínimo: R$ {config.filters.minValue:,.2f}")
    if config.filters.maxValue:
        active_filters.append(f"Valor Máximo: R$ {config.filters.maxValue:,.2f}")
    if config.filters.status:
        active_filters.append(f"Status: {', '.join(config.filters.status)}")
    
    filters_html = ""
    if active_filters:
        filters_html = f'''
        <div class="alert alert-info">
            <h6>Filtros Aplicados:</h6>
            <ul class="mb-0">
                {"".join([f"<li>{f}</li>" for f in active_filters])}
            </ul>
        </div>
        '''
    
    # Template HTML completo
    html_template = f'''
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório Customizado - {data_source_label}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
        <link href="https://cdn.datatables.net/1.11.5/css/dataTables.bootstrap5.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem 0; }}
            .stats-card {{ background: #f8f9fa; border-left: 4px solid #007bff; }}
            .table-responsive {{ max-height: 500px; overflow-y: auto; }}
            @media print {{
                .no-print {{ display: none !important; }}
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="container">
                <div class="row">
                    <div class="col-12">
                        <h1 class="mb-0"><i class="bi bi-bar-chart-fill text-white me-2"></i>Relatório Customizado</h1>
                        <p class="mb-0 opacity-75">Fonte de Dados: {data_source_label}</p>
                        <small class="opacity-75">Gerado em: {datetime.now().strftime('%d/%m/%Y às %H:%M:%S')}</small>
                    </div>
                </div>
            </div>
        </div>

        <div class="container mt-4">
            
            {filters_html}
            
            <!-- Resumo Estatístico -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <h3 class="text-primary">{len(df)}</h3>
                            <p class="mb-0">Total de Registros</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <h3 class="text-success">{len(config.selectedFields)}</h3>
                            <p class="mb-0">Campos Selecionados</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <h3 class="text-info">{len(chart_data_list)}</h3>
                            <p class="mb-0">Gráficos</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <h3 class="text-warning">{len(active_filters)}</h3>
                            <p class="mb-0">Filtros Ativos</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Gráficos -->
            {f'<h2 class="mb-4"><i class="bi bi-graph-up text-success me-2"></i>Visualizações</h2><div class="row">{chart_containers}</div>' if chart_containers else ''}

            <!-- Tabela de Dados -->
            <div class="mb-4">
                <h2 class="mb-3"><i class="bi bi-table text-info me-2"></i>Dados</h2>
                <div class="table-responsive">
                    {table_html}
                </div>
            </div>

            <!-- Botões de Ação -->
            <div class="row no-print mb-4">
                <div class="col-12 text-center">
                    <button onclick="window.print()" class="btn btn-primary btn-lg me-2">
                        <i class="bi bi-printer me-1"></i>Imprimir
                    </button>
                    <button onclick="exportToPDF()" class="btn btn-success btn-lg">
                        <i class="bi bi-file-earmark-pdf me-1"></i>Salvar como PDF
                    </button>
                </div>
            </div>
        </div>

        <footer class="bg-light py-3 mt-5">
            <div class="container text-center">
                <small class="text-muted">
                    Sistema de Gestão de Contratações Públicas - Relatório gerado automaticamente
                </small>
            </div>
        </footer>

        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
        <script src="https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js"></script>
        <script src="https://cdn.datatables.net/1.11.5/js/dataTables.bootstrap5.min.js"></script>
        
        <script>
            // Inicializar DataTable
            $(document).ready(function() {{
                $('#dataTable').DataTable({{
                    language: {{
                        url: 'https://cdn.datatables.net/plug-ins/1.11.5/i18n/pt-BR.json'
                    }},
                    pageLength: 25,
                    responsive: true,
                    dom: 'Bfrtip',
                    buttons: ['copy', 'csv', 'excel', 'pdf']
                }});
            }});

            // Gerar gráficos
            {charts_js}

            // Função para exportar como PDF
            function exportToPDF() {{
                window.print();
            }}
        </script>
    </body>
    </html>
    '''
    
    return html_template