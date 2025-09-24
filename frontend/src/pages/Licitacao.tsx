import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  CircularProgress,
  TablePagination,
} from '@mui/material';
import { Add, Edit, Delete, Link as LinkIcon, Visibility } from '@mui/icons-material';
import { licitacaoService } from '../services/licitacao.service';
import { qualificacaoService } from '../services/qualificacao.service';
import { Licitacao, Qualificacao } from '../types';
import LicitacaoDetailsModal from '../components/common/LicitacaoDetailsModal';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TableFilters, { FilterField, FilterValues } from '../components/common/TableFilters';
import TableExport from '../components/common/TableExport';

const LicitacaoPage: React.FC = () => {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qualificacoes, setQualificacoes] = useState<Qualificacao[]>([]);
  const [loadingQualificacoes, setLoadingQualificacoes] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLicitacao, setSelectedLicitacao] = useState<Licitacao | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    area_demandante: '',
    modalidade: '',
    status: '',
    pregoeiro: '',
    valorMinEstimado: null,
    valorMaxEstimado: null,
    valorMinHomologado: null,
    valorMaxHomologado: null,
    dataInicio: '',
    dataFim: '',
  });
  const [formData, setFormData] = useState<Partial<Licitacao>>({
    nup: '',
    numero_contratacao: '',
    area_demandante: '',
    responsavel_instrucao: '',
    modalidade: '',
    objeto: '',
    palavra_chave: '',
    valor_estimado: 0,
    observacoes: '',
    pregoeiro: '',
    valor_homologado: 0,
    data_homologacao: '',
    link: '',
    status: 'EM ANDAMENTO',
  });

  // Get unique areas from licitacoes
  const getUniqueAreas = () => {
    const areas = licitacoes
      .map(lic => lic.area_demandante)
      .filter(area => area && area.trim() !== '')
      .filter((area, index, self) => self.indexOf(area) === index)
      .sort();

    return areas.map(area => ({ value: area, label: area }));
  };

  // Filter configuration
  const filterFields: FilterField[] = [
    {
      key: 'area_demandante',
      label: 'Área Demandante',
      type: 'select',
      options: getUniqueAreas()
    },
    {
      key: 'modalidade',
      label: 'Modalidade',
      type: 'select',
      options: [
        { value: 'Pregão Eletrônico', label: 'Pregão Eletrônico' },
        { value: 'Concorrência', label: 'Concorrência' },
        { value: 'Tomada de Preços', label: 'Tomada de Preços' },
        { value: 'Convite', label: 'Convite' },
        { value: 'Inexigibilidade', label: 'Inexigibilidade' },
        { value: 'Dispensa', label: 'Dispensa' },
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'EM ANDAMENTO', label: 'Em Andamento' },
        { value: 'HOMOLOGADA', label: 'Homologada' },
        { value: 'FRACASSADA', label: 'Fracassada' },
        { value: 'REVOGADA', label: 'Revogada' },
      ]
    },
    {
      key: 'pregoeiro',
      label: 'Pregoeiro',
      type: 'text',
      placeholder: 'Digite o nome do pregoeiro'
    },
    {
      key: 'valorMinEstimado',
      label: 'Valor Estimado Mínimo',
      type: 'number',
      placeholder: '0,00'
    },
    {
      key: 'valorMaxEstimado',
      label: 'Valor Estimado Máximo',
      type: 'number',
      placeholder: '0,00'
    },
    {
      key: 'valorMinHomologado',
      label: 'Valor Homologado Mínimo',
      type: 'number',
      placeholder: '0,00'
    },
    {
      key: 'valorMaxHomologado',
      label: 'Valor Homologado Máximo',
      type: 'number',
      placeholder: '0,00'
    },
    {
      key: 'dataInicio',
      label: 'Data Homologação Início',
      type: 'date'
    },
    {
      key: 'dataFim',
      label: 'Data Homologação Fim',
      type: 'date'
    },
  ];

  // Export columns configuration
  const exportColumns = [
    { key: 'nup', label: 'NUP' },
    { key: 'modalidade', label: 'Modalidade' },
    { key: 'pregoeiro', label: 'Pregoeiro' },
    { key: 'valor_estimado', label: 'Valor Estimado' },
    { key: 'valor_homologado', label: 'Valor Homologado' },
    { 
      key: 'economia', 
      label: 'Economia',
      formatter: (value: number) => value ? `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'N/A'
    },
    { key: 'status', label: 'Status' },
    { key: 'data_homologacao', label: 'Data Homologação' },
    { key: 'area_demandante', label: 'Área Demandante' },
    { key: 'objeto', label: 'Objeto' },
  ];

  useEffect(() => {
    fetchLicitacoes();
    fetchQualificacoes();
  }, []);

  const fetchLicitacoes = async () => {
    try {
      setLoading(true);
      const data = await licitacaoService.getAll();
      // IMPORTANTE: Garantir que sempre seja um array
      setLicitacoes(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Erro ao carregar licitações');
      console.error(error);
      setLicitacoes([]); // Garantir array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const fetchQualificacoes = async () => {
    try {
      setLoadingQualificacoes(true);
      const data = await qualificacaoService.getConcluidas(0, 1000); // Buscar apenas qualificações concluídas
      setQualificacoes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar qualificações:', error);
      setQualificacoes([]);
    } finally {
      setLoadingQualificacoes(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta licitação?')) {
      try {
        await licitacaoService.delete(id);
        toast.success('Licitação excluída com sucesso!');
        fetchLicitacoes();
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Erro ao excluir licitação');
      }
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HOMOLOGADA': return 'success';
      case 'FRACASSADA': return 'error';
      case 'REVOGADA': return 'warning';
      default: return 'info';
    }
  };

  // Função para aplicar máscara no NUP
  const applyNUPMask = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');

    // Limita a 17 dígitos (5+6+4+2)
    const limitedNumbers = numbers.slice(0, 17);

    // Aplica a máscara 00000.000000/0000-00
    if (limitedNumbers.length <= 5) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 11) {
      return limitedNumbers.replace(/(\d{5})(\d{1,6})/, '$1.$2');
    } else if (limitedNumbers.length <= 15) {
      return limitedNumbers.replace(/(\d{5})(\d{6})(\d{1,4})/, '$1.$2/$3');
    } else {
      return limitedNumbers.replace(/(\d{5})(\d{6})(\d{4})(\d{1,2})/, '$1.$2/$3-$4');
    }
  };

  // Função para validar o formato do NUP
  const isValidNUP = (nup: string) => {
    const nupRegex = /^\d{5}\.\d{6}\/\d{4}-\d{2}$/;
    return nupRegex.test(nup);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter functions
  const handleFilterChange = (key: string, value: string | number | null) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      area_demandante: '',
      modalidade: '',
      status: '',
      pregoeiro: '',
      valorMinEstimado: null,
      valorMaxEstimado: null,
      valorMinHomologado: null,
      valorMaxHomologado: null,
      dataInicio: '',
      dataFim: '',
    });
    setPage(0);
  };

  // Apply filters to Licitacoes
  const filteredLicitacoes = licitacoes.filter(lic => {
    // Search filter (searches in multiple fields)
    if (filters.search) {
      const searchTerm = filters.search.toString().toLowerCase();
      const searchableFields = [
        lic.nup,
        lic.modalidade,
        lic.pregoeiro,
        lic.objeto,
        lic.area_demandante,
      ].join(' ').toLowerCase();

      if (!searchableFields.includes(searchTerm)) {
        return false;
      }
    }

    // Area filter
    if (filters.area_demandante && lic.area_demandante) {
      if (lic.area_demandante !== filters.area_demandante) {
        return false;
      }
    }

    // Modalidade filter
    if (filters.modalidade && lic.modalidade) {
      if (lic.modalidade !== filters.modalidade) {
        return false;
      }
    }

    // Status filter
    if (filters.status && lic.status) {
      if (lic.status !== filters.status) {
        return false;
      }
    }

    // Pregoeiro filter
    if (filters.pregoeiro && lic.pregoeiro) {
      if (!lic.pregoeiro.toLowerCase().includes(filters.pregoeiro.toString().toLowerCase())) {
        return false;
      }
    }

    // Valor estimado range filter
    if (filters.valorMinEstimado && lic.valor_estimado && lic.valor_estimado < Number(filters.valorMinEstimado)) {
      return false;
    }
    if (filters.valorMaxEstimado && lic.valor_estimado && lic.valor_estimado > Number(filters.valorMaxEstimado)) {
      return false;
    }

    // Valor homologado range filter
    if (filters.valorMinHomologado && lic.valor_homologado && lic.valor_homologado < Number(filters.valorMinHomologado)) {
      return false;
    }
    if (filters.valorMaxHomologado && lic.valor_homologado && lic.valor_homologado > Number(filters.valorMaxHomologado)) {
      return false;
    }

    // Date range filter (data de homologacao)
    if (filters.dataInicio && lic.data_homologacao) {
      const licDate = new Date(lic.data_homologacao);
      const startDate = new Date(filters.dataInicio.toString());
      if (licDate < startDate) return false;
    }
    if (filters.dataFim && lic.data_homologacao) {
      const licDate = new Date(lic.data_homologacao);
      const endDate = new Date(filters.dataFim.toString());
      if (licDate > endDate) return false;
    }

    return true;
  });

  const paginatedLicitacoes = filteredLicitacoes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleViewDetails = (licitacao: Licitacao) => {
    setSelectedLicitacao(licitacao);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedLicitacao(null);
  };

  if (loading) {
    return <Typography>Carregando...</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">
          Licitação
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TableExport
            data={filteredLicitacoes}
            columns={exportColumns}
            filename="licitacoes"
            title="Relatório de Licitações"
          />
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
          >
            Nova Licitação
          </Button>
        </Box>
      </Box>

      <TableFilters
        fields={filterFields}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        searchPlaceholder="Pesquisar por NUP, modalidade, pregoeiro..."
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>NUP</TableCell>
              <TableCell>Modalidade</TableCell>
              <TableCell>Pregoeiro</TableCell>
              <TableCell>Valor Estimado</TableCell>
              <TableCell>Valor Homologado</TableCell>
              <TableCell>Economia</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* VERIFICAÇÃO SEGURA antes do map */}
            {paginatedLicitacoes && paginatedLicitacoes.length > 0 ? (
              paginatedLicitacoes.map((lic) => (
                <TableRow key={lic.id || lic.nup}>
                  <TableCell>{lic.nup}</TableCell>
                  <TableCell>{lic.modalidade || 'N/A'}</TableCell>
                  <TableCell>{lic.pregoeiro || 'N/A'}</TableCell>
                  <TableCell>{formatCurrency(lic.valor_estimado)}</TableCell>
                  <TableCell>{formatCurrency(lic.valor_homologado)}</TableCell>
                  <TableCell>
                    {lic.economia ? (
                      <Typography 
                        variant="body2" 
                        color="success.main"
                        fontWeight="bold"
                      >
                        {formatCurrency(lic.economia)}
                      </Typography>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={lic.status}
                      color={getStatusColor(lic.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => handleViewDetails(lic)}
                      title="Ver detalhes"
                    >
                      <Visibility />
                    </IconButton>
                    {lic.link && (
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => window.open(lic.link, '_blank')}
                      >
                        <LinkIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditModal(lic)}
                      title="Editar licitação"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(lic.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="textSecondary">
                    {loading ? 'Carregando...' : 'Nenhuma licitação cadastrada'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredLicitacoes.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </TableContainer>

      {/* Modal para Nova/Editar Licitação */}
      <Dialog open={open} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>{isEditMode ? 'Editar Licitação' : 'Nova Licitação'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Dropdown de NUP com busca nas qualificações */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                fullWidth
                loading={loadingQualificacoes}
                options={qualificacoes}
                getOptionLabel={(option) => option.nup}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={key} {...otherProps}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {option.nup}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.objeto} - {option.area_demandante}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                value={qualificacoes.find(q => q.nup === formData.nup) || null}
                onChange={(_, newValue) => {
                  if (newValue) {
                    // Preencher automaticamente os campos relacionados da qualificação selecionada
                    setFormData(prev => ({
                      ...prev,
                      nup: newValue.nup,
                      numero_contratacao: newValue.numero_contratacao,
                      ano: newValue.ano,
                      area_demandante: newValue.area_demandante || '',
                      responsavel_instrucao: newValue.responsavel_instrucao || '',
                      modalidade: newValue.modalidade || '',
                      objeto: newValue.objeto || '',
                      palavra_chave: newValue.palavra_chave || '',
                      valor_estimado: newValue.valor_estimado || 0,
                    }));
                  } else {
                    handleInputChange('nup', '');
                  }
                }}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="NUP *"
                    placeholder="00000.000000/0000-00"
                    value={formData.nup}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Aplicar máscara do NUP
                      const maskedValue = applyNUPMask(value);
                      handleInputChange('nup', maskedValue);

                      // Limpar outros campos quando digitando manualmente
                      if (!qualificacoes.find(q => q.nup === maskedValue)) {
                        setFormData(prev => ({
                          ...prev,
                          nup: maskedValue,
                          numero_contratacao: '',
                          area_demandante: '',
                          responsavel_instrucao: '',
                          modalidade: '',
                          objeto: '',
                          palavra_chave: '',
                          valor_estimado: 0,
                        }));
                      }
                    }}
                    error={formData.nup ? !isValidNUP(formData.nup) : false}
                    helperText={formData.nup && !isValidNUP(formData.nup) ?
                      "Formato inválido. Use: 00000.000000/0000-00" :
                      "Selecione uma qualificação ou digite um NUP válido"
                    }
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingQualificacoes ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* Campo Ano - Readonly, herdado da qualificação */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ano"
                type="number"
                value={formData.ano || new Date().getFullYear()}
                InputProps={{
                  readOnly: true,
                  style: { backgroundColor: '#f5f5f5' }
                }}
                helperText="Herdado automaticamente da qualificação selecionada"
              />
            </Grid>

            {/* Número da Contratação - Preenchido automaticamente */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Número da Contratação (PCA)"
                value={formData.numero_contratacao}
                onChange={(e) => handleInputChange('numero_contratacao', e.target.value)}
                InputProps={{
                  style: formData.nup && formData.numero_contratacao ?
                    { backgroundColor: '#f5f5f5' } : {}
                }}
                helperText="Preenchido automaticamente da qualificação selecionada"
              />
            </Grid>

            {/* Área Demandante - Preenchida automaticamente */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Área Demandante"
                value={formData.area_demandante}
                onChange={(e) => handleInputChange('area_demandante', e.target.value)}
                InputProps={{
                  style: formData.nup && formData.area_demandante ? 
                    { backgroundColor: '#f5f5f5' } : {}
                }}
                helperText="Preenchido automaticamente da qualificação selecionada"
              />
            </Grid>

            {/* Responsável pela Instrução */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Responsável pela Instrução"
                value={formData.responsavel_instrucao}
                onChange={(e) => handleInputChange('responsavel_instrucao', e.target.value)}
              />
            </Grid>

            {/* Modalidade */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Modalidade</InputLabel>
                <Select
                  value={formData.modalidade}
                  onChange={(e) => handleInputChange('modalidade', e.target.value)}
                  label="Modalidade"
                >
                  <MenuItem value="">Selecione...</MenuItem>
                  <MenuItem value="Pregão Eletrônico">Pregão Eletrônico</MenuItem>
                  <MenuItem value="Concorrência">Concorrência</MenuItem>
                  <MenuItem value="Tomada de Preços">Tomada de Preços</MenuItem>
                  <MenuItem value="Convite">Convite</MenuItem>
                  <MenuItem value="Inexigibilidade">Inexigibilidade</MenuItem>
                  <MenuItem value="Dispensa">Dispensa</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Pregoeiro */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pregoeiro"
                value={formData.pregoeiro}
                onChange={(e) => handleInputChange('pregoeiro', e.target.value)}
              />
            </Grid>

            {/* Objeto - Preenchido automaticamente */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Objeto"
                value={formData.objeto}
                onChange={(e) => handleInputChange('objeto', e.target.value)}
                helperText="Preenchido automaticamente da qualificação selecionada"
                InputProps={{
                  style: formData.nup && formData.objeto ? 
                    { backgroundColor: '#f5f5f5' } : {}
                }}
              />
            </Grid>

            {/* Palavra-chave */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Palavra-chave"
                value={formData.palavra_chave}
                onChange={(e) => handleInputChange('palavra_chave', e.target.value)}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as 'HOMOLOGADA' | 'FRACASSADA' | 'EM ANDAMENTO' | 'REVOGADA')}
                  label="Status"
                >
                  <MenuItem value="EM ANDAMENTO">Em Andamento</MenuItem>
                  <MenuItem value="HOMOLOGADA">Homologada</MenuItem>
                  <MenuItem value="FRACASSADA">Fracassada</MenuItem>
                  <MenuItem value="REVOGADA">Revogada</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Valor Estimado */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Valor Estimado (R$)"
                type="number"
                value={formData.valor_estimado || ''}
                onChange={(e) => handleInputChange('valor_estimado', parseFloat(e.target.value) || 0)}
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                  style: formData.nup && formData.valor_estimado ? 
                    { backgroundColor: '#f5f5f5' } : {}
                }}
                helperText="Preenchido automaticamente da qualificação selecionada"
              />
            </Grid>

            {/* Valor Homologado */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Valor Homologado (R$)"
                type="number"
                value={formData.valor_homologado || ''}
                onChange={(e) => handleInputChange('valor_homologado', parseFloat(e.target.value) || 0)}
                InputProps={{
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </Grid>

            {/* Data de Homologação */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Data de Homologação"
                type="date"
                value={formData.data_homologacao || ''}
                onChange={(e) => handleInputChange('data_homologacao', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Economia - Campo somente leitura calculado automaticamente */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Economia"
                value={
                  formData.valor_estimado && formData.valor_homologado && formData.valor_estimado > 0 && formData.valor_homologado > 0
                    ? `R$ ${(formData.valor_estimado - formData.valor_homologado).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}`
                    : 'N/A'
                }
                InputProps={{
                  readOnly: true,
                  style: { backgroundColor: '#f5f5f5' }
                }}
                helperText="Calculado automaticamente (Valor Estimado - Valor Homologado)"
              />
            </Grid>

            {/* Link */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Link da Licitação"
                value={formData.link}
                onChange={(e) => handleInputChange('link', e.target.value)}
                placeholder="https://..."
              />
            </Grid>

            {/* Observações */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observações"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.nup || !isValidNUP(formData.nup)}
          >
            {isEditMode ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de detalhes da licitação */}
      <LicitacaoDetailsModal
        open={detailsOpen}
        onClose={handleCloseDetails}
        licitacao={selectedLicitacao}
      />
    </Box>
  );

  // Funções auxiliares
  function handleInputChange(field: string, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleOpenModal() {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      nup: '',
      numero_contratacao: '',
      area_demandante: '',
      responsavel_instrucao: '',
      modalidade: '',
      objeto: '',
      palavra_chave: '',
      valor_estimado: 0,
      observacoes: '',
      pregoeiro: '',
      valor_homologado: 0,
      data_homologacao: '',
      link: '',
      status: 'EM ANDAMENTO',
    });
    setOpen(true);
  }

  function handleEditModal(licitacao: Licitacao) {
    setIsEditMode(true);
    setEditingId(licitacao.id);
    setFormData({
      ...licitacao,
      data_homologacao: licitacao.data_homologacao ? 
        format(new Date(licitacao.data_homologacao), 'yyyy-MM-dd') : ''
    });
    setOpen(true);
  }

  function handleCloseModal() {
    setOpen(false);
    setIsEditMode(false);
    setEditingId(null);
  }

  async function handleSubmit() {
    try {
      // Preparar dados para envio, garantindo tipos corretos
      const submitData = {
        ...formData,
        // Garantir que os valores numéricos estão corretos
        valor_estimado: formData.valor_estimado || null,
        valor_homologado: formData.valor_homologado || null,
        // Garantir que strings vazias se tornem null
        numero_contratacao: formData.numero_contratacao?.trim() || null,
        area_demandante: formData.area_demandante?.trim() || null,
        responsavel_instrucao: formData.responsavel_instrucao?.trim() || null,
        modalidade: formData.modalidade?.trim() || null,
        objeto: formData.objeto?.trim() || null,
        palavra_chave: formData.palavra_chave?.trim() || null,
        observacoes: formData.observacoes?.trim() || null,
        pregoeiro: formData.pregoeiro?.trim() || null,
        link: formData.link?.trim() || null,
        data_homologacao: formData.data_homologacao && formData.data_homologacao.trim() !== '' ? formData.data_homologacao : null,
      };

      console.log('Dados sendo enviados para API:', submitData);

      if (isEditMode && editingId) {
        await licitacaoService.update(editingId, submitData);
        toast.success('Licitação atualizada com sucesso!');
      } else {
        await licitacaoService.create(submitData as Omit<Licitacao, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'economia'>);
        toast.success('Licitação criada com sucesso!');
      }
      handleCloseModal();
      fetchLicitacoes();
    } catch (error: any) {
      console.error('Erro ao salvar licitação:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar licitação');
    }
  }
};

export default LicitacaoPage;