import React, { useState } from 'react';
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
  Language
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { api } from '../services/api';

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

const Relatorios: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    dataSource: '',
    selectedFields: [],
    charts: [],
    filters: {}
  });
  const [generating, setGenerating] = useState(false);

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
        Construtor de Relatórios
      </Typography>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Crie relatórios HTML interativos com gráficos, tabelas e filtros personalizados
      </Typography>

      <Paper sx={{ p: 3 }}>
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
      </Paper>
    </Box>
  );
};

export default Relatorios;