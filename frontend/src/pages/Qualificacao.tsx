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
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { qualificacaoService } from '../services/qualificacao.service';
import { pcaService } from '../services/pca.service';
import { Qualificacao, PCA } from '../types';
import { toast } from 'react-toastify';
import TableFilters, { FilterField, FilterValues } from '../components/common/TableFilters';
import TableExport from '../components/common/TableExport';
import QualificacaoDetailsModal from '../components/common/QualificacaoDetailsModal';
import StatCards from '../components/common/StatCards';

interface FormData {
  nup: string;
  numero_contratacao: string;
  ano: number;
  area_demandante: string;
  responsavel_instrucao: string;
  modalidade: string;
  objeto: string;
  palavra_chave: string;
  valor_estimado: string;
  status: 'EM ANALISE' | 'CONCLUIDO';
  observacoes: string;
}

const initialFormData: FormData = {
  nup: '',
  numero_contratacao: '',
  ano: new Date().getFullYear(),
  area_demandante: '',
  responsavel_instrucao: '',
  modalidade: '',
  objeto: '',
  palavra_chave: '',
  valor_estimado: '',
  status: 'EM ANALISE',
  observacoes: '',
};

const QualificacaoPage: React.FC = () => {
  const [qualificacoes, setQualificacoes] = useState<Qualificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [pcas, setPcas] = useState<PCA[]>([]);
  const [loadingPcas, setLoadingPcas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingQualificacao, setEditingQualificacao] = useState<Qualificacao | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Details modal states
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedQualificacao, setSelectedQualificacao] = useState<Qualificacao | null>(null);
  // Confirm dialog states for deletion
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('Excluir qualificação');
  const [confirmDescription, setConfirmDescription] = useState('Tem certeza que deseja excluir esta qualificação?');
  
  // Filter states
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    area_demandante: '',
    modalidade: '',
    status: '',
    responsavel_instrucao: '',
    valorMin: null,
    valorMax: null,
  });

  // Get unique areas from qualifications
  const getUniqueAreas = () => {
    const areas = qualificacoes
      .map(qual => qual.area_demandante)
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
        { value: 'EM ANALISE', label: 'Em Análise' },
        { value: 'CONCLUIDO', label: 'Concluído' },
      ]
    },
    {
      key: 'responsavel_instrucao',
      label: 'Responsável pela Instrução',
      type: 'text',
      placeholder: 'Digite o nome do responsável'
    },
    {
      key: 'valorMin',
      label: 'Valor Mínimo',
      type: 'number',
      placeholder: '0,00'
    },
    {
      key: 'valorMax',
      label: 'Valor Máximo',
      type: 'number',
      placeholder: '0,00'
    },
  ];

  // Export columns configuration
  const exportColumns = [
    { key: 'nup', label: 'NUP' },
    { key: 'numero_contratacao', label: 'Nº Contratação' },
    { key: 'area_demandante', label: 'Área Demandante' },
    { key: 'responsavel_instrucao', label: 'Responsável Instrução' },
    { key: 'modalidade', label: 'Modalidade' },
    { key: 'objeto', label: 'Objeto' },
    { key: 'palavra_chave', label: 'Palavra-chave' },
    { key: 'valor_estimado', label: 'Valor Estimado' },
    { 
      key: 'status', 
      label: 'Status',
      formatter: (value: string) => value === 'EM ANALISE' ? 'Em Análise' : value === 'CONCLUIDO' ? 'Concluído' : value
    },
    { key: 'observacoes', label: 'Observações' },
  ];

  useEffect(() => {
    fetchQualificacoes();
  }, []);

  useEffect(() => {
    if (open) {
      fetchPcas();
    }
  }, [open]);

  const fetchQualificacoes = async () => {
    try {
      setLoading(true);
      const data = await qualificacaoService.getAll();
      // IMPORTANTE: Garantir que sempre seja um array
      setQualificacoes(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Erro ao carregar qualificações');
      console.error(error);
      setQualificacoes([]); // Garantir array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const fetchPcas = async () => {
    try {
      setLoadingPcas(true);
      const data = await pcaService.getAll(0, 1000); // Buscar todos os PCAs
      setPcas(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Erro ao carregar PCAs');
      console.error(error);
      setPcas([]);
    } finally {
      setLoadingPcas(false);
    }
  };

  const handleOpenModal = () => {
    setIsEditMode(false);
    setEditingQualificacao(null);
    setFormData(initialFormData);
    setOpen(true);
  };

  const handleEditModal = (qualificacao: Qualificacao) => {
    setIsEditMode(true);
    setEditingQualificacao(qualificacao);
    setFormData({
      nup: qualificacao.nup,
      numero_contratacao: qualificacao.numero_contratacao,
      ano: qualificacao.ano,
      area_demandante: qualificacao.area_demandante || '',
      responsavel_instrucao: qualificacao.responsavel_instrucao || '',
      modalidade: qualificacao.modalidade || '',
      objeto: qualificacao.objeto || '',
      palavra_chave: qualificacao.palavra_chave || '',
      valor_estimado: qualificacao.valor_estimado ? qualificacao.valor_estimado.toString() : '',
      status: qualificacao.status,
      observacoes: qualificacao.observacoes || '',
    });
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setFormData(initialFormData);
    setIsEditMode(false);
    setEditingQualificacao(null);
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    // aceitamos string ou number (ex: ano é number), e armazenamos coerentemente
    setFormData(prev => ({
      ...prev,
      [field]: value as any
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Validações básicas
      if (!formData.nup.trim()) {
        toast.error('NUP é obrigatório');
        return;
      }

      if (!formData.numero_contratacao.trim()) {
        toast.error('Número da Contratação é obrigatório');
        return;
      }

      // Preparar dados para envio
      const qualificacaoData = {
        nup: formData.nup.trim(),
        numero_contratacao: formData.numero_contratacao,
        ano: formData.ano,
        area_demandante: formData.area_demandante?.trim() || undefined,
        responsavel_instrucao: formData.responsavel_instrucao?.trim() || undefined,
        modalidade: formData.modalidade?.trim() || undefined,
        objeto: formData.objeto?.trim() || undefined,
        palavra_chave: formData.palavra_chave?.trim() || undefined,
        valor_estimado: formData.valor_estimado ? parseFloat(formData.valor_estimado) : undefined,
        status: formData.status,
        observacoes: formData.observacoes?.trim() || undefined,
      };

      if (isEditMode && editingQualificacao) {
        // Atualizar qualificação existente
        await qualificacaoService.update(editingQualificacao.id, qualificacaoData);
        toast.success('Qualificação atualizada com sucesso!');
      } else {
        // Criar nova qualificação
        await qualificacaoService.create(qualificacaoData);
        toast.success('Qualificação criada com sucesso!');
      }

      handleCloseModal();
      fetchQualificacoes();
    } catch (error: any) {
      const action = isEditMode ? 'atualizar' : 'criar';
      toast.error(error.response?.data?.detail || `Erro ao ${action} qualificação`);
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmTargetId(id);
    setConfirmTitle('Excluir qualificação');
    setConfirmDescription('Tem certeza que deseja excluir esta qualificação? Esta ação não poderá ser desfeita.');
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmTargetId) return;
    setConfirmLoading(true);
    try {
      await qualificacaoService.delete(confirmTargetId);
      toast.success('Qualificação excluída com sucesso!');
      fetchQualificacoes();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao excluir qualificação');
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setConfirmTargetId(null);
    }
  };

  const handleViewDetails = (qualificacao: Qualificacao) => {
    setSelectedQualificacao(qualificacao);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedQualificacao(null);
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
      responsavel_instrucao: '',
      valorMin: null,
      valorMax: null,
    });
    setPage(0);
  };

  // Apply filters to Qualificacoes
  const filteredQualificacoes = qualificacoes.filter(qual => {
    // Search filter (searches in multiple fields)
    if (filters.search) {
      const searchTerm = filters.search.toString().toLowerCase();
      const searchableFields = [
        qual.nup,
        qual.numero_contratacao,
        qual.area_demandante,
        qual.modalidade,
        qual.responsavel_instrucao,
        qual.objeto,
        qual.palavra_chave,
      ].join(' ').toLowerCase();
      
      if (!searchableFields.includes(searchTerm)) {
        return false;
      }
    }

    // Area demandante filter
    if (filters.area_demandante && qual.area_demandante) {
      if (qual.area_demandante !== filters.area_demandante) {
        return false;
      }
    }

    // Modalidade filter
    if (filters.modalidade && qual.modalidade) {
      if (qual.modalidade !== filters.modalidade) {
        return false;
      }
    }

    // Status filter
    if (filters.status && qual.status) {
      if (qual.status !== filters.status) {
        return false;
      }
    }

    // Responsavel instrucao filter
    if (filters.responsavel_instrucao && qual.responsavel_instrucao) {
      if (!qual.responsavel_instrucao.toLowerCase().includes(filters.responsavel_instrucao.toString().toLowerCase())) {
        return false;
      }
    }

    // Value range filter
    if (filters.valorMin && qual.valor_estimado && qual.valor_estimado < Number(filters.valorMin)) {
      return false;
    }
    if (filters.valorMax && qual.valor_estimado && qual.valor_estimado > Number(filters.valorMax)) {
      return false;
    }

    return true;
  });

  const paginatedQualificacoes = filteredQualificacoes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Totais para StatCards
  const totalFiltrado = filteredQualificacoes.length;
  const totalEmAnalise = filteredQualificacoes.filter(q => q.status === 'EM ANALISE').length;
  const totalConcluido = filteredQualificacoes.filter(q => q.status === 'CONCLUIDO').length;
  const totalValorEstimado = filteredQualificacoes.reduce(
    (acc, q) => acc + (typeof q.valor_estimado === 'number' ? q.valor_estimado : (q.valor_estimado ? Number(q.valor_estimado as any) : 0)),
    0
  );

  if (loading) {
    return <Typography>Carregando...</Typography>;
  }

  return (
    <Box>
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        loading={confirmLoading}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onClose={() => { setConfirmOpen(false); setConfirmTargetId(null); }}
      />
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">
          Qualificação
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TableExport
            data={filteredQualificacoes}
            columns={exportColumns}
            filename="qualificacoes"
            title="Relatório de Qualificações"
          />
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenModal}>
            Nova Qualificação
          </Button>
        </Box>
      </Box>

      <StatCards
        items={[
          { label: 'Total filtrado', value: totalFiltrado, color: '#0d6efd' },
          { label: 'Em análise (filtrado)', value: totalEmAnalise, color: '#ffc107' },
          { label: 'Concluídas (filtrado)', value: totalConcluido, color: '#20c997' },
          { label: 'Valor estimado (filtrado)', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValorEstimado || 0), color: '#6f42c1' },
        ]}
      />

      <TableFilters
        fields={filterFields}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        searchPlaceholder="Pesquisar por NUP, número da contratação, área..."
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>NUP</TableCell>
              <TableCell>Nº Contratação</TableCell>
              <TableCell>Área Demandante</TableCell>
              <TableCell>Modalidade</TableCell>
              <TableCell>Valor Estimado</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* VERIFICAÇÃO SEGURA antes do map */}
            {paginatedQualificacoes && paginatedQualificacoes.length > 0 ? (
              paginatedQualificacoes.map((qual) => (
                <TableRow key={qual.id || qual.nup}>
                  <TableCell>{qual.nup}</TableCell>
                  <TableCell>{qual.numero_contratacao}</TableCell>
                  <TableCell>{qual.area_demandante || 'N/A'}</TableCell>
                  <TableCell>{qual.modalidade || 'N/A'}</TableCell>
                  <TableCell>{formatCurrency(qual.valor_estimado)}</TableCell>
                  <TableCell>
                    <Chip
                      label={qual.status}
                      color={qual.status === 'CONCLUIDO' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(qual)}
                      title="Ver detalhes"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditModal(qual)}
                      title="Editar qualificação"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(qual.id)}
                      title="Excluir qualificação"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary">
                    {loading ? 'Carregando...' : 'Nenhuma qualificação cadastrada'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredQualificacoes.length}
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

      {/* Modal para Nova/Editar Qualificação */}
      <Dialog open={open} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>{isEditMode ? 'Editar Qualificação' : 'Nova Qualificação'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* NUP - Campo obrigatório */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="NUP *"
                value={formData.nup}
                onChange={(e) => {
                  const value = e.target.value;
                  const maskedValue = applyNUPMask(value);
                  handleInputChange('nup', maskedValue);
                }}
                placeholder="00000.000000/0000-00"
                error={formData.nup ? !isValidNUP(formData.nup) : false}
                helperText={formData.nup && !isValidNUP(formData.nup) ?
                  "Formato inválido. Use: 00000.000000/0000-00" :
                  "Digite apenas números que serão formatados automaticamente"
                }
                inputProps={{
                  pattern: "\\d{5}\\.\\d{6}/\\d{4}-\\d{2}",
                  title: "Formato: 00000.000000/0000-00"
                }}
              />
            </Grid>

            {/* Campo Ano */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ano *"
                type="number"
                value={formData.ano}
                onChange={(e) => handleInputChange('ano', parseInt(e.target.value) || new Date().getFullYear())}
                inputProps={{ min: 2020, max: 2030 }}
                helperText="Ano de execução da contratação"
              />
            </Grid>

            {/* Dropdown de PCA com busca */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                fullWidth
                loading={loadingPcas}
                options={pcas}
                getOptionLabel={(option) => option.numero_contratacao}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={key} {...otherProps}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {option.numero_contratacao}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.titulo_contratacao}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                value={pcas.find(p => p.numero_contratacao === formData.numero_contratacao) || null}
                onChange={(_, newValue) => {
                  if (newValue) {
                    // Preencher automaticamente os campos relacionados do PCA selecionado
                    setFormData(prev => ({
                      ...prev,
                      numero_contratacao: newValue.numero_contratacao,
                      area_demandante: newValue.area_requisitante || '',
                      objeto: newValue.titulo_contratacao || '',
                      valor_estimado: newValue.valor_total ? newValue.valor_total.toString() : '',
                    }));
                  } else {
                    // Limpar apenas o número da contratação se desmarcado
                    handleInputChange('numero_contratacao', '');
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Número da Contratação (PCA) *"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingPcas ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                />
            </Grid>

            {/* Área Demandante - Preenchido automaticamente do PCA */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Área Demandante"
                value={formData.area_demandante}
                onChange={(e) => handleInputChange('area_demandante', e.target.value)}
                helperText="Preenchido automaticamente do PCA selecionado"
                InputProps={{
                  style: formData.numero_contratacao && formData.area_demandante ? 
                    { backgroundColor: '#f5f5f5' } : undefined
                }}
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

            {/* Status */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as 'EM ANALISE' | 'CONCLUIDO')}
                  label="Status"
                >
                  <MenuItem value="EM ANALISE">Em Análise</MenuItem>
                  <MenuItem value="CONCLUIDO">Concluído</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Objeto - Preenchido automaticamente do PCA (Título da Contratação) */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Objeto"
                value={formData.objeto}
                onChange={(e) => handleInputChange('objeto', e.target.value)}
                helperText="Preenchido automaticamente com o título da contratação do PCA"
                InputProps={{
                  style: formData.numero_contratacao && formData.objeto ? 
                    { backgroundColor: '#f5f5f5' } : undefined
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

            {/* Valor Estimado - Preenchido automaticamente do PCA */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Valor Estimado"
                type="number"
                value={formData.valor_estimado}
                onChange={(e) => handleInputChange('valor_estimado', e.target.value)}
                inputProps={{ step: "0.01", min: "0" }}
                placeholder="0.00"
                helperText="Preenchido automaticamente do PCA selecionado"
                InputProps={{
                  style: formData.numero_contratacao && formData.valor_estimado ? 
                    { backgroundColor: '#f5f5f5' } : undefined
                }}
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
          <Button onClick={handleCloseModal} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || !formData.nup || !isValidNUP(formData.nup)}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting
              ? (isEditMode ? 'Atualizando...' : 'Salvando...')
              : (isEditMode ? 'Atualizar' : 'Salvar')
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Qualificacao Details Modal */}
      <QualificacaoDetailsModal
        open={detailsOpen}
        onClose={handleCloseDetails}
        qualificacao={selectedQualificacao}
      />
    </Box>
  );
};

export default QualificacaoPage;
