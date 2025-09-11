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
import { Add, Edit, Delete } from '@mui/icons-material';
import { qualificacaoService } from '../services/qualificacao.service';
import { pcaService } from '../services/pca.service';
import { Qualificacao, PCA } from '../types';
import { toast } from 'react-toastify';

interface FormData {
  nup: string;
  numero_contratacao: string;
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

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta qualificação?')) {
      try {
        await qualificacaoService.delete(id);
        toast.success('Qualificação excluída com sucesso!');
        fetchQualificacoes();
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Erro ao excluir qualificação');
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

  if (loading) {
    return <Typography>Carregando...</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">
          Qualificação
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenModal}>
          Nova Qualificação
        </Button>
      </Box>

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
            {qualificacoes && qualificacoes.length > 0 ? (
              qualificacoes.map((qual) => (
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
                onChange={(e) => handleInputChange('nup', e.target.value)}
                placeholder="Ex: 08001.000001/2024-11"
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
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting 
              ? (isEditMode ? 'Atualizando...' : 'Salvando...') 
              : (isEditMode ? 'Atualizar' : 'Salvar')
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QualificacaoPage;