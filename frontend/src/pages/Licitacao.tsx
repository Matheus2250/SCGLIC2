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
} from '@mui/material';
import { Add, Edit, Delete, Link as LinkIcon } from '@mui/icons-material';
import { licitacaoService } from '../services/licitacao.service';
import { qualificacaoService } from '../services/qualificacao.service';
import { Licitacao, Qualificacao } from '../types';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LicitacaoPage: React.FC = () => {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qualificacoes, setQualificacoes] = useState<Qualificacao[]>([]);
  const [loadingQualificacoes, setLoadingQualificacoes] = useState(false);
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

  if (loading) {
    return <Typography>Carregando...</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">
          Licitação
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => handleOpenModal()}
        >
          Nova Licitação
        </Button>
      </Box>

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
            {licitacoes && licitacoes.length > 0 ? (
              licitacoes.map((lic) => (
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
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="NUP *"
                    placeholder="Selecione uma qualificação"
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
            disabled={!formData.nup}
          >
            {isEditMode ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
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