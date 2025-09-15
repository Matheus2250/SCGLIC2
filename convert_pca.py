import pandas as pd
import re
from datetime import datetime
import locale

# Tentar definir locale brasileiro
try:
    locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')
except:
    try:
        locale.setlocale(locale.LC_ALL, 'Portuguese_Brazil.1252')
    except:
        pass

def clean_text(text):
    """Limpa e corrige caracteres especiais corrompidos"""
    if pd.isna(text) or text == '':
        return None
    
    text = str(text)
    # Correções de encoding corrompido comum
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
        'tecnologia': 'tecnologia',
        'informa��o': 'informação',
        'comunica��o': 'comunicação',
        'aquisi��o': 'aquisição',
        'manuten��o': 'manutenção',
        '�rea': 'área',
        'n�mero': 'número',
        'in�cio': 'início',
        'conclus�o': 'conclusão',
        'dura��o': 'duração',
        'licenciamento': 'licenciamento',
        'transfer�ncia': 'transferência',
        'assist�ncia': 'assistência',
        't�cnica': 'técnica',
        'cient�fica': 'científica',
        'implementa��o': 'implementação',
        '�gil': 'ágil',
        'ag�ncias': 'agências',
        'mobili�rios': 'mobiliários',
        'acess�rios': 'acessórios',
        'an�lise': 'análise'
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    return text.strip()

def parse_date(date_str):
    """Converte string de data para formato datetime"""
    if pd.isna(date_str) or date_str == '':
        return None
    
    date_str = str(date_str).strip()
    
    # Tentar diferentes formatos de data
    formats = ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y']
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    
    return None

def parse_currency(value_str):
    """Converte string de valor monetário para float"""
    if pd.isna(value_str) or value_str == '':
        return 0.0
    
    value_str = str(value_str).strip()
    
    # Formato brasileiro: 1.000.000,00 (ponto para milhares, vírgula para decimais)
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

def process_pca_csv():
    """Processa o arquivo CSV e converte para Excel compatível com a tabela PCA"""
    
    print("Lendo arquivo CSV...")
    
    # Ler CSV com encoding Windows-1252 (comum em Excel brasileiro)
    try:
        df = pd.read_csv(
            r'C:\Users\DENIS\OneDrive\Área de Trabalho\sistema_contratacoes\pca_2025 15092025.csv',
            sep=';',
            encoding='windows-1252'
        )
    except:
        try:
            df = pd.read_csv(
                r'C:\Users\DENIS\OneDrive\Área de Trabalho\sistema_contratacoes\pca_2025 15092025.csv',
                sep=';',
                encoding='utf-8'
            )
        except:
            df = pd.read_csv(
                r'C:\Users\DENIS\OneDrive\Área de Trabalho\sistema_contratacoes\pca_2025 15092025.csv',
                sep=';',
                encoding='latin1'
            )
    
    print(f"Arquivo lido com {len(df)} registros")
    print("Colunas encontradas:")
    for i, col in enumerate(df.columns):
        print(f"{i+1}. {col}")
    
    # Mapeamento das colunas do CSV para a tabela PCA
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
    
    # Criar DataFrame limpo
    clean_data = []
    
    print("Processando registros...")
    
    for index, row in df.iterrows():
        try:
            # Extrair dados usando o mapeamento
            record = {}
            
            for col_index, field_name in column_mapping.items():
                if col_index < len(df.columns):
                    raw_value = row.iloc[col_index] if col_index < len(row) else None
                    
                    if field_name in ['data_estimada_inicio', 'data_estimada_conclusao']:
                        record[field_name] = parse_date(raw_value)
                    elif field_name == 'valor_total':
                        record[field_name] = parse_currency(raw_value)
                    else:
                        cleaned_value = clean_text(raw_value)
                        # Se for situacao_execucao e estiver vazio, colocar "Não iniciada"
                        if field_name == 'situacao_execucao' and (cleaned_value is None or cleaned_value == ''):
                            cleaned_value = 'Não iniciada'
                        record[field_name] = cleaned_value
            
            # Só adicionar se tiver número de contratação
            if record.get('numero_contratacao'):
                clean_data.append(record)
                
        except Exception as e:
            print(f"Erro processando linha {index}: {e}")
            continue
    
    print(f"Processados {len(clean_data)} registros válidos")
    
    # Criar DataFrame limpo
    clean_df = pd.DataFrame(clean_data)
    
    # Ordenar colunas na ordem correta para a tabela
    columns_order = [
        'numero_contratacao',
        'status_contratacao', 
        'situacao_execucao',
        'titulo_contratacao',
        'categoria_contratacao',
        'valor_total',
        'area_requisitante',
        'numero_dfd',
        'data_estimada_inicio',
        'data_estimada_conclusao'
    ]
    
    # Reordenar colunas
    clean_df = clean_df.reindex(columns=columns_order)
    
    # Renomear colunas para nomes limpos em português
    clean_df.columns = [
        'Número da Contratação',
        'Status da Contratação',
        'Situação da Execução', 
        'Título da Contratação',
        'Categoria da Contratação',
        'Valor Total',
        'Área Requisitante',
        'Número DFD',
        'Data Estimada de Início',
        'Data Estimada de Conclusão'
    ]
    
    # Salvar como Excel
    output_file = r'C:\Users\DENIS\OneDrive\Área de Trabalho\sistema_contratacoes\PCA_2025_Limpo.xlsx'
    
    print(f"Salvando arquivo Excel: {output_file}")
    
    clean_df.to_excel(output_file, index=False)
    
    print("Arquivo convertido com sucesso!")
    print(f"Total de registros: {len(clean_df)}")
    print(f"Arquivo salvo em: {output_file}")
    
    # Mostrar amostra dos dados
    print("\nAmostra dos dados processados:")
    print(clean_df.head().to_string())
    
    return clean_df

if __name__ == "__main__":
    df = process_pca_csv()