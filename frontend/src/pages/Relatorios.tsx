import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Checkbox,
  TextField,
  Paper,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
} from '@mui/material';
import {
  FileDownload,
  Assessment,
  TrendingUp,
  Assignment,
  BarChart,
  PieChart,
  Timeline,
  TableChart,
  Language,
  Search,
  AccountTree,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { pcaService } from '../services/pca.service';
import { qualificacaoService } from '../services/qualificacao.service';
import { licitacaoService } from '../services/licitacao.service';
import { PCA, Qualificacao, Licitacao } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportConfig {
  dataSource: string;
  selectedFields: string[];
  charts: string[];
  filters: {
    dateStart?: string;
    dateEnd?: string;
    status?: string[];
    minValue?: number;
    maxValue?: number;
  };
}

interface UnifiedReportData {
  searchTerm: string;
  pca?: PCA;
  qualificacao?: Qualificacao;
  licitacao?: Licitacao;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Relatorios: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    dataSource: '',
    selectedFields: [],
    charts: [],
    filters: {}
  });
  const [generating, setGenerating] = useState(false);

  // Estados para relatório unificado
  const [unifiedSearchTerm, setUnifiedSearchTerm] = useState('');
  const [unifiedData, setUnifiedData] = useState<UnifiedReportData | null>(null);
  const [unifiedLoading, setUnifiedLoading] = useState(false);

  // Estados para autocomplete
  const [searchOptions, setSearchOptions] = useState<Array<{value: string, label: string, type: string, source: string}>>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Definição dos campos disponíveis para cada fonte de dados
  const fieldOptions = {
    pca: [
      { value: 'numero_contratacao', label: 'Número Contratação' },
      { value: 'titulo_contratacao', label: 'Título' },
      { value: 'categoria_contratacao', label: 'Categoria' },
      { value: 'valor_total', label: 'Valor Total' },
      { value: 'area_requisitante', label: 'Área Requisitante' },
      { value: 'numero_dfd', label: 'Número DFD' },
      { value: 'data_estimada_inicio', label: 'Data Início' },
      { value: 'data_estimada_conclusao', label: 'Data Conclusão' },
      { value: 'status_contratacao', label: 'Status' },
      { value: 'situacao_execucao', label: 'Situação Execução' },
      { value: 'atrasada', label: 'Atrasada' },
    ],
    qualificacao: [
      { value: 'nup', label: 'NUP' },
      { value: 'numero_contratacao', label: 'Número Contratação' },
      { value: 'area_demandante', label: 'Área Demandante' },
      { value: 'responsavel_instrucao', label: 'Responsável Instrução' },
      { value: 'modalidade', label: 'Modalidade' },
      { value: 'objeto', label: 'Objeto' },
      { value: 'palavra_chave', label: 'Palavra Chave' },
      { value: 'valor_estimado', label: 'Valor Estimado' },
      { value: 'status', label: 'Status' },
      { value: 'observacoes', label: 'Observações' },
    ],
    licitacao: [
      { value: 'nup', label: 'NUP' },
      { value: 'numero_contratacao', label: 'Número Contratação' },
      { value: 'area_demandante', label: 'Área Demandante' },
      { value: 'responsavel_instrucao', label: 'Responsável Instrução' },
      { value: 'modalidade', label: 'Modalidade' },
      { value: 'objeto', label: 'Objeto' },
      { value: 'valor_estimado', label: 'Valor Estimado' },
      { value: 'pregoeiro', label: 'Pregoeiro' },
      { value: 'valor_homologado', label: 'Valor Homologado' },
      { value: 'data_homologacao', label: 'Data Homologação' },
      { value: 'link', label: 'Link' },
      { value: 'status', label: 'Status' },
      { value: 'economia', label: 'Economia' },
      { value: 'observacoes', label: 'Observações' },
    ]
  };

  const chartOptions = [
    { value: 'status_distribution', label: 'Distribuição por Status', icon: <PieChart /> },
    { value: 'value_timeline', label: 'Valores ao Longo do Tempo', icon: <Timeline /> },
    { value: 'category_comparison', label: 'Comparação por Categoria/Modalidade', icon: <BarChart /> },
    { value: 'summary_table', label: 'Tabela Resumo', icon: <TableChart /> },
  ];

  const dataSourceOptions = [
    { value: 'pca', label: 'Planejamento (PCA)', icon: <Assignment /> },
    { value: 'qualificacao', label: 'Qualificação', icon: <Assessment /> },
    { value: 'licitacao', label: 'Licitação', icon: <TrendingUp /> },
  ];

  // Carregar opções de busca na inicialização
  useEffect(() => {
    loadSearchOptions();
  }, []);

  const loadSearchOptions = async () => {
    try {
      setLoadingOptions(true);

      // Buscar todos os dados das três fontes
      const [pcaData, qualificacaoData, licitacaoData] = await Promise.all([
        pcaService.getAll().catch(() => []),
        qualificacaoService.getAll().catch(() => []),
        licitacaoService.getAll().catch(() => [])
      ]);

      const options: Array<{value: string, label: string, type: string, source: string}> = [];

      // Adicionar números de contratação do PCA
      if (Array.isArray(pcaData)) {
        pcaData.forEach(pca => {
          if (pca.numero_contratacao) {
            options.push({
              value: pca.numero_contratacao,
              label: `${pca.numero_contratacao} - ${pca.titulo_contratacao || 'PCA'}`,
              type: 'Número da Contratação',
              source: 'Planejamento (PCA)'
            });
          }
        });
      }

      // Adicionar NUPs e números de contratação da Qualificação
      if (Array.isArray(qualificacaoData)) {
        qualificacaoData.forEach(qual => {
          if (qual.nup) {
            options.push({
              value: qual.nup,
              label: `${qual.nup} - ${qual.objeto || 'Qualificação'}`,
              type: 'NUP',
              source: 'Qualificação'
            });
          }
          if (qual.numero_contratacao && !options.find(o => o.value === qual.numero_contratacao)) {
            options.push({
              value: qual.numero_contratacao,
              label: `${qual.numero_contratacao} - ${qual.objeto || 'Qualificação'}`,
              type: 'Número da Contratação',
              source: 'Qualificação'
            });
          }
        });
      }

      // Adicionar NUPs e números de contratação da Licitação
      if (Array.isArray(licitacaoData)) {
        licitacaoData.forEach(lic => {
          if (lic.nup && !options.find(o => o.value === lic.nup)) {
            options.push({
              value: lic.nup,
              label: `${lic.nup} - ${lic.objeto || 'Licitação'}`,
              type: 'NUP',
              source: 'Licitação'
            });
          }
          if (lic.numero_contratacao && !options.find(o => o.value === lic.numero_contratacao)) {
            options.push({
              value: lic.numero_contratacao,
              label: `${lic.numero_contratacao} - ${lic.objeto || 'Licitação'}`,
              type: 'Número da Contratação',
              source: 'Licitação'
            });
          }
        });
      }

      // Organizar por tipo e depois por valor
      options.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
        return a.value.localeCompare(b.value);
      });
      setSearchOptions(options);

    } catch (error) {
      console.error('Erro ao carregar opções de busca:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);

      const response = await api.post('/api/v1/reports/custom', reportConfig, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: 'text/html'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_customizado_${reportConfig.dataSource}_${new Date().getTime()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Relatório gerado com sucesso!');

      // Reset para permitir gerar novo relatório
      setActiveStep(0);
      setReportConfig({
        dataSource: '',
        selectedFields: [],
        charts: [],
        filters: {}
      });

    } catch (error) {
      toast.error('Erro ao gerar relatório HTML');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  // Funções para relatório unificado
  const handleUnifiedSearch = async () => {
    if (!unifiedSearchTerm.trim()) {
      toast.warning('Digite um NUP ou número da contratação');
      return;
    }

    try {
      setUnifiedLoading(true);
      setUnifiedData(null);

      // Buscar em todas as três bases
      const [pcaData, qualificacaoData, licitacaoData] = await Promise.all([
        pcaService.getAll().catch(() => []),
        qualificacaoService.getAll().catch(() => []),
        licitacaoService.getAll().catch(() => [])
      ]);

      // Filtrar dados por NUP ou número da contratação
      const searchTerm = unifiedSearchTerm.trim();

      // Primeiro, encontrar a qualificação que faz a ligação entre NUP e número da contratação
      const qualificacao = Array.isArray(qualificacaoData) ? qualificacaoData.find(q =>
        q.nup === searchTerm || q.numero_contratacao === searchTerm
      ) : undefined;

      // Encontrar a licitação baseada no NUP ou número da contratação
      const licitacao = Array.isArray(licitacaoData) ? licitacaoData.find(l =>
        l.nup === searchTerm || l.numero_contratacao === searchTerm
      ) : undefined;

      // Para encontrar o PCA, usar o número da contratação da qualificação se encontrou por NUP
      let pca = undefined;
      if (Array.isArray(pcaData)) {
        // Se pesquisou diretamente por número da contratação
        pca = pcaData.find(p => p.numero_contratacao === searchTerm);

        // Se não encontrou e tem qualificação, usar o número da contratação da qualificação
        if (!pca && qualificacao && qualificacao.numero_contratacao) {
          pca = pcaData.find(p => p.numero_contratacao === qualificacao.numero_contratacao);
        }
      }

      if (!pca && !qualificacao && !licitacao) {
        toast.warning('Nenhum dado encontrado para este NUP/número da contratação');
        return;
      }

      setUnifiedData({
        searchTerm,
        pca,
        qualificacao,
        licitacao
      });

      toast.success('Dados encontrados com sucesso!');

    } catch (error) {
      toast.error('Erro ao buscar dados');
      console.error(error);
    } finally {
      setUnifiedLoading(false);
    }
  };

  const handleGenerateUnifiedReport = () => {
    if (!unifiedData) return;

    // Gerar HTML do relatório
    const reportHtml = generateUnifiedReportHTML(unifiedData);

    // Criar e baixar arquivo
    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_unificado_${unifiedData.searchTerm}_${new Date().getTime()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Relatório unificado gerado com sucesso!');
  };

  const generateUnifiedReportHTML = (data: UnifiedReportData): string => {
    const formatCurrency = (value: number | undefined) => {
      if (!value) return 'N/A';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return 'N/A';
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    };

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório Unificado - ${data.searchTerm}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1976d2; padding-bottom: 20px; }
        .section { margin-bottom: 30px; background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .section h2 { color: #1976d2; margin-top: 0; }
        .field { margin-bottom: 10px; }
        .field strong { color: #424242; }
        .no-data { color: #666; font-style: italic; text-align: center; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #1976d2; color: white; }
        .summary { background: #e3f2fd; border-left: 4px solid #1976d2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório Unificado do Processo</h1>
        <h2>NUP/Contratação: ${data.searchTerm}</h2>
        <p>Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
    </div>

    ${data.pca ? `
    <div class="section">
        <h2>PLANEJAMENTO (PCA)</h2>
        <div class="field"><strong>Número da Contratação:</strong> ${data.pca.numero_contratacao || 'N/A'}</div>
        <div class="field"><strong>Título:</strong> ${data.pca.titulo_contratacao || 'N/A'}</div>
        <div class="field"><strong>Categoria:</strong> ${data.pca.categoria_contratacao || 'N/A'}</div>
        <div class="field"><strong>Valor Total:</strong> ${formatCurrency(data.pca.valor_total)}</div>
        <div class="field"><strong>Área Requisitante:</strong> ${data.pca.area_requisitante || 'N/A'}</div>
        <div class="field"><strong>Data Estimada Início:</strong> ${formatDate(data.pca.data_estimada_inicio)}</div>
        <div class="field"><strong>Data Estimada Conclusão:</strong> ${formatDate(data.pca.data_estimada_conclusao)}</div>
        <div class="field"><strong>Status:</strong> ${data.pca.status_contratacao || 'N/A'}</div>
        <div class="field"><strong>Situação Execução:</strong> ${data.pca.situacao_execucao || 'N/A'}</div>
    </div>
    ` : '<div class="section"><h2>PLANEJAMENTO (PCA)</h2><div class="no-data">Nenhum dado de planejamento encontrado</div></div>'}

    ${data.qualificacao ? `
    <div class="section">
        <h2>QUALIFICAÇÃO</h2>
        <div class="field"><strong>NUP:</strong> ${data.qualificacao.nup || 'N/A'}</div>
        <div class="field"><strong>Número da Contratação:</strong> ${data.qualificacao.numero_contratacao || 'N/A'}</div>
        <div class="field"><strong>Área Demandante:</strong> ${data.qualificacao.area_demandante || 'N/A'}</div>
        <div class="field"><strong>Responsável Instrução:</strong> ${data.qualificacao.responsavel_instrucao || 'N/A'}</div>
        <div class="field"><strong>Modalidade:</strong> ${data.qualificacao.modalidade || 'N/A'}</div>
        <div class="field"><strong>Objeto:</strong> ${data.qualificacao.objeto || 'N/A'}</div>
        <div class="field"><strong>Palavra-chave:</strong> ${data.qualificacao.palavra_chave || 'N/A'}</div>
        <div class="field"><strong>Valor Estimado:</strong> ${formatCurrency(data.qualificacao.valor_estimado)}</div>
        <div class="field"><strong>Status:</strong> ${data.qualificacao.status || 'N/A'}</div>
        <div class="field"><strong>Observações:</strong> ${data.qualificacao.observacoes || 'N/A'}</div>
    </div>
    ` : '<div class="section"><h2>QUALIFICAÇÃO</h2><div class="no-data">Nenhum dado de qualificação encontrado</div></div>'}

    ${data.licitacao ? `
    <div class="section">
        <h2>LICITAÇÃO</h2>
        <div class="field"><strong>NUP:</strong> ${data.licitacao.nup || 'N/A'}</div>
        <div class="field"><strong>Número da Contratação:</strong> ${data.licitacao.numero_contratacao || 'N/A'}</div>
        <div class="field"><strong>Área Demandante:</strong> ${data.licitacao.area_demandante || 'N/A'}</div>
        <div class="field"><strong>Modalidade:</strong> ${data.licitacao.modalidade || 'N/A'}</div>
        <div class="field"><strong>Pregoeiro:</strong> ${data.licitacao.pregoeiro || 'N/A'}</div>
        <div class="field"><strong>Valor Estimado:</strong> ${formatCurrency(data.licitacao.valor_estimado)}</div>
        <div class="field"><strong>Valor Homologado:</strong> ${formatCurrency(data.licitacao.valor_homologado)}</div>
        <div class="field"><strong>Economia:</strong> ${formatCurrency(data.licitacao.economia)}</div>
        <div class="field"><strong>Data Homologação:</strong> ${formatDate(data.licitacao.data_homologacao)}</div>
        <div class="field"><strong>Status:</strong> ${data.licitacao.status || 'N/A'}</div>
        <div class="field"><strong>Link:</strong> ${data.licitacao.link ? `<a href="${data.licitacao.link}" target="_blank">${data.licitacao.link}</a>` : 'N/A'}</div>
        <div class="field"><strong>Observações:</strong> ${data.licitacao.observacoes || 'N/A'}</div>
    </div>
    ` : '<div class="section"><h2>LICITAÇÃO</h2><div class="no-data">Nenhum dado de licitação encontrado</div></div>'}

    <div class="section summary">
        <h2>RESUMO DO PROCESSO</h2>
        <table>
            <tr><th>Etapa</th><th>Status</th><th>Valor</th></tr>
            <tr>
                <td>Planejamento</td>
                <td>${data.pca ? 'Concluído' : 'Não encontrado'}</td>
                <td>${data.pca ? formatCurrency(data.pca.valor_total) : 'N/A'}</td>
            </tr>
            <tr>
                <td>Qualificação</td>
                <td>${data.qualificacao ? 'Concluído' : 'Não encontrado'}</td>
                <td>${data.qualificacao ? formatCurrency(data.qualificacao.valor_estimado) : 'N/A'}</td>
            </tr>
            <tr>
                <td>Licitação</td>
                <td>${data.licitacao ? 'Concluído' : 'Não encontrado'}</td>
                <td>${data.licitacao ? formatCurrency(data.licitacao.valor_homologado) : 'N/A'}</td>
            </tr>
        </table>
    </div>
</body>
</html>`;
  };

  const steps = [
    'Selecionar Fonte de Dados',
    'Escolher Campos',
    'Configurar Gráficos',
    'Aplicar Filtros',
    'Gerar Relatório'
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Sistema de Relatórios
      </Typography>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Gere relatórios unificados ou customize relatórios específicos por área
      </Typography>

      <Paper sx={{ p: 0 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab
            icon={<AccountTree />}
            label="Relatório Unificado"
            iconPosition="start"
          />
          <Tab
            icon={<Assessment />}
            label="Construtor Customizado"
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* Relatório Unificado */}
          <Box>
            <Typography variant="h5" gutterBottom>
              Relatório Unificado por NUP/Contratação
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Digite um NUP ou número da contratação para gerar um relatório completo juntando dados de
              Planejamento, Qualificação e Licitação
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Autocomplete
                fullWidth
                freeSolo
                loading={loadingOptions}
                options={searchOptions}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.value}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={key} {...otherProps}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Typography variant="body2" fontWeight="bold">
                          {option.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.type} - {option.source}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {option.label.split(' - ')[1]}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                value={searchOptions.find(option => option.value === unifiedSearchTerm) || unifiedSearchTerm}
                onChange={(_, newValue) => {
                  if (typeof newValue === 'string') {
                    setUnifiedSearchTerm(newValue);
                  } else if (newValue) {
                    setUnifiedSearchTerm(newValue.value);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="NUP ou Número da Contratação"
                    placeholder="Digite ou selecione..."
                    onChange={(e) => setUnifiedSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUnifiedSearch()}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingOptions ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
              <Button
                variant="contained"
                startIcon={unifiedLoading ? <CircularProgress size={20} /> : <Search />}
                onClick={handleUnifiedSearch}
                disabled={unifiedLoading}
                sx={{ minWidth: 150 }}
              >
                {unifiedLoading ? 'Buscando...' : 'Buscar'}
              </Button>
            </Box>

            {unifiedData && (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  Dados encontrados para: <strong>{unifiedData.searchTerm}</strong>
                  <br />
                  <small>
                    Planejamento: {unifiedData.pca ? '✅' : '❌'} |
                    Qualificação: {unifiedData.qualificacao ? '✅' : '❌'} |
                    Licitação: {unifiedData.licitacao ? '✅' : '❌'}
                  </small>
                </Alert>

                <Grid container spacing={3}>
                  {/* Planejamento */}
                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <Assignment color="primary" />
                          <Typography variant="h6">Planejamento</Typography>
                        </Box>
                        {unifiedData.pca ? (
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              <strong>Número:</strong> {unifiedData.pca.numero_contratacao}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Título:</strong> {unifiedData.pca.titulo_contratacao}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Valor:</strong> {unifiedData.pca.valor_total?.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              })}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Área:</strong> {unifiedData.pca.area_requisitante}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography color="textSecondary" variant="body2">
                            Nenhum dado encontrado
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Qualificação */}
                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <Assessment color="success" />
                          <Typography variant="h6">Qualificação</Typography>
                        </Box>
                        {unifiedData.qualificacao ? (
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              <strong>NUP:</strong> {unifiedData.qualificacao.nup}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Modalidade:</strong> {unifiedData.qualificacao.modalidade}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Valor:</strong> {unifiedData.qualificacao.valor_estimado?.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              })}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Status:</strong> {unifiedData.qualificacao.status}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography color="textSecondary" variant="body2">
                            Nenhum dado encontrado
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Licitação */}
                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <TrendingUp color="warning" />
                          <Typography variant="h6">Licitação</Typography>
                        </Box>
                        {unifiedData.licitacao ? (
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              <strong>Pregoeiro:</strong> {unifiedData.licitacao.pregoeiro}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Valor Homologado:</strong> {unifiedData.licitacao.valor_homologado?.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              })}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Economia:</strong> {unifiedData.licitacao.economia?.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              })}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Status:</strong> {unifiedData.licitacao.status}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography color="textSecondary" variant="body2">
                            Nenhum dado encontrado
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<FileDownload />}
                    onClick={handleGenerateUnifiedReport}
                  >
                    Gerar Relatório Unificado (HTML)
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Construtor Customizado */}
          <Box sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Passo 1: Selecionar Fonte de Dados */}
          <Step>
            <StepLabel>Selecionar Fonte de Dados</StepLabel>
            <StepContent>
              <Typography sx={{ mb: 2 }}>
                Escolha qual tipo de dados você deseja incluir no relatório:
              </Typography>
              <Grid container spacing={2}>
                {dataSourceOptions.map((option) => (
                  <Grid item xs={12} md={4} key={option.value}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: reportConfig.dataSource === option.value ? 2 : 1,
                        borderColor: reportConfig.dataSource === option.value ? 'primary.main' : 'divider'
                      }}
                      onClick={() => setReportConfig(prev => ({ ...prev, dataSource: option.value }))}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2}>
                          {option.icon}
                          <Typography variant="h6">{option.label}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mb: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!reportConfig.dataSource}
                >
                  Continuar
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Passo 2: Escolher Campos */}
          <Step>
            <StepLabel>Escolher Campos</StepLabel>
            <StepContent>
              <Typography sx={{ mb: 2 }}>
                Selecione quais campos deseja incluir na tabela do relatório:
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Campos da Tabela</InputLabel>
                <Select
                  multiple
                  value={reportConfig.selectedFields}
                  onChange={(e) => setReportConfig(prev => ({ 
                    ...prev, 
                    selectedFields: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value 
                  }))}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const field = fieldOptions[reportConfig.dataSource as keyof typeof fieldOptions]?.find(f => f.value === value);
                        return <Chip key={value} label={field?.label || value} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {reportConfig.dataSource && fieldOptions[reportConfig.dataSource as keyof typeof fieldOptions]?.map((field) => (
                    <MenuItem key={field.value} value={field.value}>
                      {field.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ mb: 1 }}>
                <Button
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={reportConfig.selectedFields.length === 0}
                >
                  Continuar
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Passo 3: Configurar Gráficos */}
          <Step>
            <StepLabel>Configurar Gráficos</StepLabel>
            <StepContent>
              <Typography sx={{ mb: 2 }}>
                Escolha quais gráficos e visualizações incluir no relatório:
              </Typography>
              <Grid container spacing={2}>
                {chartOptions.map((chart) => (
                  <Grid item xs={12} md={6} key={chart.value}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={reportConfig.charts.includes(chart.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setReportConfig(prev => ({
                                ...prev,
                                charts: [...prev.charts, chart.value]
                              }));
                            } else {
                              setReportConfig(prev => ({
                                ...prev,
                                charts: prev.charts.filter(c => c !== chart.value)
                              }));
                            }
                          }}
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          {chart.icon}
                          {chart.label}
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mb: 1, mt: 2 }}>
                <Button
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Continuar
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Passo 4: Aplicar Filtros */}
          <Step>
            <StepLabel>Aplicar Filtros</StepLabel>
            <StepContent>
              <Typography sx={{ mb: 2 }}>
                Configure filtros para refinar os dados do relatório:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data Início"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={reportConfig.filters.dateStart || ''}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      filters: { ...prev.filters, dateStart: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data Fim"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={reportConfig.filters.dateEnd || ''}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      filters: { ...prev.filters, dateEnd: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Valor Mínimo"
                    type="number"
                    value={reportConfig.filters.minValue || ''}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      filters: { ...prev.filters, minValue: parseFloat(e.target.value) || undefined }
                    }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Valor Máximo"
                    type="number"
                    value={reportConfig.filters.maxValue || ''}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      filters: { ...prev.filters, maxValue: parseFloat(e.target.value) || undefined }
                    }))}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mb: 1, mt: 2 }}>
                <Button
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Continuar
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Passo 5: Gerar Relatório */}
          <Step>
            <StepLabel>Gerar Relatório</StepLabel>
            <StepContent>
              <Typography sx={{ mb: 2 }}>
                Revise suas configurações e gere o relatório customizado:
              </Typography>
              
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>Resumo da Configuração</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography><strong>Fonte de Dados:</strong> {dataSourceOptions.find(d => d.value === reportConfig.dataSource)?.label}</Typography>
                <Typography><strong>Campos Selecionados:</strong> {reportConfig.selectedFields.length}</Typography>
                <Typography><strong>Gráficos:</strong> {reportConfig.charts.length}</Typography>
                <Typography><strong>Filtros Ativos:</strong> {Object.keys(reportConfig.filters).filter(k => reportConfig.filters[k as keyof typeof reportConfig.filters]).length}</Typography>
              </Paper>

              <Box sx={{ mb: 1 }}>
                <Button
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Language />}
                  onClick={handleGenerateReport}
                  disabled={generating}
                >
                  {generating ? 'Gerando...' : 'Gerar Relatório HTML'}
                </Button>
              </Box>
            </StepContent>
          </Step>
          </Stepper>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Relatorios;