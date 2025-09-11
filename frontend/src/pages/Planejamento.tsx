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
  Alert,
  Input,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Upload,
  FileDownload,
} from '@mui/icons-material';
import { pcaService } from '../services/pca.service';
import { PCA } from '../types';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Planejamento: React.FC = () => {
  const [pcas, setPcas] = useState<PCA[]>([]);
  const [loading, setLoading] = useState(true);
  const [importDialog, setImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchPCAs();
  }, []);

  const fetchPCAs = async () => {
    try {
      setLoading(true);
      const data = await pcaService.getAll();
      // IMPORTANTE: Garantir que sempre seja um array
      setPcas(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Erro ao carregar PCAs');
      console.error(error);
      setPcas([]); // Garantir array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo Excel');
      return;
    }

    try {
      setImporting(true);
      const result = await pcaService.importExcel(selectedFile);
      toast.success(result.message);
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => toast.warning(error));
      }
      fetchPCAs();
      setImportDialog(false);
      setSelectedFile(null);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao importar arquivo');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta PCA?')) {
      try {
        await pcaService.delete(id);
        toast.success('PCA excluída com sucesso!');
        fetchPCAs();
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Erro ao excluir PCA');
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

  if (loading) {
    return <Typography>Carregando...</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">
          Planejamento - PCA
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setImportDialog(true)}
          >
            Importar Excel
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nº Contratação</TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Valor Total</TableCell>
              <TableCell>Área Requisitante</TableCell>
              <TableCell>Data Conclusão</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* VERIFICAÇÃO SEGURA antes do map */}
            {pcas && pcas.length > 0 ? (
              pcas.map((pca) => (
                <TableRow key={pca.id || pca.numero_contratacao}>
                  <TableCell>{pca.numero_contratacao}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {pca.titulo_contratacao || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatCurrency(pca.valor_total)}</TableCell>
                  <TableCell>{pca.area_requisitante || 'N/A'}</TableCell>
                  <TableCell>{formatDate(pca.data_estimada_conclusao)}</TableCell>
                  <TableCell>
                    <Chip
                      label={pca.atrasada ? 'Atrasada' : 'No Prazo'}
                      color={pca.atrasada ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDelete(pca.id)}
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
                    {loading ? 'Carregando...' : 'Nenhuma PCA encontrada. Importe um arquivo Excel para começar.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Import Dialog */}
      <Dialog open={importDialog} onClose={() => setImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Importar PCAs do Excel</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Selecione um arquivo Excel (.xlsx ou .xls) com as colunas: numero_contratacao, 
              titulo_contratacao, valor_total, area_requisitante, etc.
            </Alert>
            <Input
              type="file"
              inputProps={{ accept: '.xlsx,.xls' }}
              onChange={(e) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files[0]) {
                  setSelectedFile(target.files[0]);
                }
              }}
              fullWidth
            />
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Arquivo selecionado: {selectedFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            variant="contained"
            disabled={!selectedFile || importing}
          >
            {importing ? 'Importando...' : 'Importar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Planejamento;