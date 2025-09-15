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
  TablePagination,
} from '@mui/material';
import {
  Add,
  Upload,
  FileDownload,
  Visibility,
  Delete,
} from '@mui/icons-material';
import { pcaService } from '../services/pca.service';
import { PCA } from '../types';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TableFilters, { FilterField, FilterValues } from '../components/common/TableFilters';
import TableExport from '../components/common/TableExport';
import PCADetailsModal from '../components/common/PCADetailsModal';

const Planejamento: React.FC = () => {
  const [pcas, setPcas] = useState<PCA[]>([]);
  const [loading, setLoading] = useState(true);
  const [importDialog, setImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Details modal states
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPCA, setSelectedPCA] = useState<PCA | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    area_requisitante: '',
    status: '',
    valorMin: null,
    valorMax: null,
    dataInicio: '',
    dataFim: '',
  });

  // Filter configuration
  const filterFields: FilterField[] = [
    {
      key: 'area_requisitante',
      label: 'Área Requisitante',
      type: 'text',
      placeholder: 'Digite o nome da área'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'no_prazo', label: 'No Prazo' },
        { value: 'atrasada', label: 'Atrasada' }
      ]
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
    {
      key: 'dataInicio',
      label: 'Data Início',
      type: 'date'
    },
    {
      key: 'dataFim',
      label: 'Data Fim',
      type: 'date'
    },
  ];

  // Export columns configuration
  const exportColumns = [
    { key: 'numero_contratacao', label: 'Nº Contratação' },
    { key: 'titulo_contratacao', label: 'Título' },
    { key: 'valor_total', label: 'Valor Total' },
    { key: 'area_requisitante', label: 'Área Requisitante' },
    { key: 'data_estimada_conclusao', label: 'Data Conclusão' },
    { 
      key: 'atrasada', 
      label: 'Status',
      formatter: (value: boolean) => value ? 'Atrasada' : 'No Prazo'
    },
  ];

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

  const handleViewDetails = (pca: PCA) => {
    setSelectedPCA(pca);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedPCA(null);
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
      area_requisitante: '',
      status: '',
      valorMin: null,
      valorMax: null,
      dataInicio: '',
      dataFim: '',
    });
    setPage(0);
  };

  // Apply filters to PCAs
  const filteredPCAs = pcas.filter(pca => {
    // Search filter (searches in multiple fields)
    if (filters.search) {
      const searchTerm = filters.search.toString().toLowerCase();
      const searchableFields = [
        pca.numero_contratacao,
        pca.titulo_contratacao,
        pca.area_requisitante,
      ].join(' ').toLowerCase();
      
      if (!searchableFields.includes(searchTerm)) {
        return false;
      }
    }

    // Area filter
    if (filters.area_requisitante && pca.area_requisitante) {
      if (!pca.area_requisitante.toLowerCase().includes(filters.area_requisitante.toString().toLowerCase())) {
        return false;
      }
    }

    // Status filter
    if (filters.status) {
      const isAtrasada = pca.atrasada;
      if (filters.status === 'atrasada' && !isAtrasada) return false;
      if (filters.status === 'no_prazo' && isAtrasada) return false;
    }

    // Value range filter
    if (filters.valorMin && pca.valor_total && pca.valor_total < Number(filters.valorMin)) {
      return false;
    }
    if (filters.valorMax && pca.valor_total && pca.valor_total > Number(filters.valorMax)) {
      return false;
    }

    // Date range filter
    if (filters.dataInicio && pca.data_estimada_conclusao) {
      const pcaDate = new Date(pca.data_estimada_conclusao);
      const startDate = new Date(filters.dataInicio.toString());
      if (pcaDate < startDate) return false;
    }
    if (filters.dataFim && pca.data_estimada_conclusao) {
      const pcaDate = new Date(pca.data_estimada_conclusao);
      const endDate = new Date(filters.dataFim.toString());
      if (pcaDate > endDate) return false;
    }

    return true;
  });

  const paginatedPCAs = filteredPCAs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return <Typography>Carregando...</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">
          Planejamento - PCA
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TableExport
            data={filteredPCAs}
            columns={exportColumns}
            filename="planejamento_pca"
            title="Relatório de Planejamento - PCA"
          />
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setImportDialog(true)}
          >
            Importar Excel
          </Button>
        </Box>
      </Box>

      <TableFilters
        fields={filterFields}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        searchPlaceholder="Pesquisar por número, título ou área..."
      />

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
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* VERIFICAÇÃO SEGURA antes do map */}
            {paginatedPCAs && paginatedPCAs.length > 0 ? (
              paginatedPCAs.map((pca) => (
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
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(pca)}
                        title="Ver detalhes"
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(pca.id)}
                        color="error"
                        title="Excluir"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
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
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredPCAs.length}
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

      {/* PCA Details Modal */}
      <PCADetailsModal
        open={detailsOpen}
        onClose={handleCloseDetails}
        pca={selectedPCA}
      />
    </Box>
  );
};

export default Planejamento;