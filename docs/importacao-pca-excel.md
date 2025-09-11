# 📊 Guia de Importação de PCA via Excel

Este documento descreve como preparar e importar dados de PCA (Plano de Contratações Anuais) através de arquivos Excel no Sistema de Gestão de Contratações Públicas.

## 🎯 Requisitos do Arquivo

### Formatos Aceitos
- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)

### Estrutura Obrigatória
- Primeira linha deve conter os **cabeçalhos das colunas**
- Cada linha subsequente representa um PCA
- Evitar células mescladas ou formatação complexa

## 📋 Colunas Aceitas

### ✅ Nomes de Colunas Recomendados

| Coluna | Nome no Excel | Obrigatório | Tipo | Exemplo |
|--------|---------------|-------------|------|---------|
| 1 | `Número da Contratação` | **SIM** | Texto | PCA001/2024 |
| 2 | `Status da Contratação` | Não | Texto | Em Planejamento |
| 3 | `Situação da Execução` | Não | Texto | No Prazo |
| 4 | `Título da Contratação` | Não | Texto | Aquisição de Material de Escritório |
| 5 | `Categoria da Contratação` | Não | Texto | Material de Consumo |
| 6 | `Valor Total` | Não | Número | 150000.50 |
| 7 | `Área Requisitante` | Não | Texto | Secretaria de Administração |
| 8 | `Número DFD` | Não | Texto | DFD001/2024 |
| 9 | `Data Estimada de Início` | Não | Data | 15/01/2024 |
| 10 | `Data Estimada de Conclusão` | Não | Data | 30/06/2024 |

### 🔄 Nomes Alternativos Aceitos

O sistema também aceita os nomes das colunas em formato "snake_case":

- `numero_contratacao` *(obrigatório)*
- `status_contratacao`
- `situacao_execucao`
- `titulo_contratacao`
- `categoria_contratacao`
- `valor_total`
- `area_requisitante`
- `numero_dfd`
- `data_estimada_inicio`
- `data_estimada_conclusao`

## 📅 Formatos de Data

### Formatos Aceitos:
- **DD/MM/AAAA** (ex: 15/01/2024)
- **AAAA-MM-DD** (ex: 2024-01-15)
- **DD-MM-AAAA** (ex: 15-01-2024)

### ❌ Evitar:
- Datas em formato texto (ex: "15 de janeiro de 2024")
- Datas em formato americano MM/DD/AAAA
- Células com fórmulas de data complexas

## 💰 Formato de Valores Monetários

### ✅ Correto:
- `150000.50` (número decimal)
- `1500000` (número inteiro)
- `0` ou `0.00` (zero)

### ❌ Evitar:
- `R$ 150.000,50` (formatação monetária)
- `150.000,50` (separador de milhares)
- `150,000.50` (formato americano)
- Células com fórmulas

## 🔧 Processo de Importação

### Como Importar:

1. **Acesse** o sistema e faça login
2. **Navegue** para a página "Planejamento"
3. **Clique** no botão "Importar Excel"
4. **Selecione** seu arquivo Excel
5. **Aguarde** o processamento
6. **Verifique** o resultado na mensagem de sucesso

### Comportamento do Sistema:

- **Registros Novos**: Serão criados automaticamente
- **Registros Existentes**: Serão atualizados com os novos dados
- **Duplicatas**: Identificadas pelo "Número da Contratação"
- **Erros**: Reportados com detalhes da linha problemática

## ⚠️ Validações e Regras

### Campo Obrigatório:
- **`Número da Contratação`** deve ser único e não pode estar vazio

### Regras de Negócio:
- PCAs com data de conclusão anterior à data atual são marcados como "atrasados"
- Valores monetários devem ser positivos
- Datas de conclusão devem ser posteriores às datas de início

### Tratamento de Erros:
- Linhas com erros são ignoradas
- Sistema reporta até 5 primeiros erros encontrados
- Processo continua mesmo com alguns erros

## 📊 Exemplo de Arquivo Excel

### Estrutura Recomendada:

| Número da Contratação | Status da Contratação | Título da Contratação | Valor Total | Data Estimada de Conclusão |
|----------------------|----------------------|----------------------|-------------|----------------------------|
| PCA001/2024 | Em Planejamento | Material de Escritório | 50000.00 | 30/06/2024 |
| PCA002/2024 | Em Licitação | Reforma do Prédio | 300000.00 | 15/12/2024 |
| PCA003/2024 | Concluído | Equipamentos de TI | 75000.50 | 30/03/2024 |

## 🆘 Solução de Problemas

### Problemas Comuns:

**"Número da contratação não informado"**
- Verifique se a coluna está nomeada corretamente
- Certifique-se de que não há células vazias

**"Erro ao processar arquivo"**
- Verifique se o arquivo está no formato Excel correto
- Remova formatação especial ou células mescladas
- Salve o arquivo novamente

**"Arquivo Excel está vazio"**
- Certifique-se de que há dados na planilha
- Verifique se a primeira linha contém os cabeçalhos

### Dicas de Performance:
- Limite arquivos a **1000 registros** por importação
- Para volumes maiores, divida em múltiplos arquivos
- Teste primeiro com um arquivo pequeno (5-10 registros)

## 📞 Suporte

Para dúvidas ou problemas com a importação:
1. Verifique este guia primeiro
2. Teste com um arquivo de exemplo pequeno
3. Entre em contato com o administrador do sistema

---

**Versão do documento**: 1.0  
**Data da última atualização**: Janeiro 2025  
**Sistema**: Gestão de Contratações Públicas v1.0