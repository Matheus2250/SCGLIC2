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
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add,
  Upload,
  FileDownload,
  Visibility,
  Delete,
} from '@mui/icons-material';
import { pcaService } from '../services/pca.service';\nimport { useAuth } from '../store/auth.context';
import { PCA } from '../types';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TableFilters, { FilterField, FilterValues } from '../components/common/TableFilters';
import StatCards from '../components/common/StatCards';
import TableExport from '../components/common/TableExport';
import PCADetailsModal from '../components/common/PCADetailsModal';
import ConfirmDialog from '../components/common/ConfirmDialog';

const Planejamento: React.FC = () => {
  const [pcas, setPcas] = useState<PCA[]>([]);
  const [loading, setLoading] = useState(true);
  const [importDialog, setImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importType, setImportType] = useState<'excel' | 'csv'>('excel');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());\n  const [cycleStatus, setCycleStatus] = useState<'ABERTO' | 'ENCERRADO' | null>(null);\n  const [loadingCycle, setLoadingCycle] = useState<boolean>(false);\n  const { user } = useAuth();

  // Details modal states
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPCA, setSelectedPCA] = useState<PCA | null>(null);
  // Confirm dialog states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('Confirmar exclusão');
  const [confirmDescription, setConfirmDescription] = useState('Tem certeza que deseja excluir esta PCA?');
  
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

  // Get unique areas from PCAs
  const getUniqueAreas = () => {
    if (!pcas || !Array.isArray(pcas) || pcas.length === 0) {
      return [];
    }

    const areas = pcas
      .map(pca => pca.area_requisitante)
      .filter(area => area && area.trim() !== '')
      .filter((area, index, self) => self.indexOf(area) === index)
      .sort();

    return areas.map(area => ({ value: area, label: area }));
  };

  // Filter configuration
  const filterFields: FilterField[] = [
    {
      key: 'area_requisitante',
      label: 'Área Requisitante',
      type: 'select',
      options: getUniqueAreas()
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
  }, [selectedYear]);

  const fetchPCAs = async () => {
    try {
      setLoading(true);
      const data = await pcaService.getAll(0, 10000, selectedYear);
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
      toast.error(`Selecione um arquivo ${importType === 'excel' ? 'Excel' : 'CSV'}`);
      return;
    }

    try {
      setImporting(true);
      const result = importType === 'excel'
        ? await pcaService.importExcel(selectedFile, selectedYear)
        : await pcaService.importCsv(selectedFile, selectedYear);

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
    setConfirmTargetId(id);
    setConfirmTitle('Excluir PCA');
    setConfirmDescription('Tem certeza que deseja excluir esta PCA? Essa ação não poderá ser desfeita.');
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmTargetId) return;
    setConfirmLoading(true);
    try {
      await pcaService.delete(confirmTargetId);
      toast.success('PCA excluída com sucesso!');
      fetchPCAs();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao excluir PCA');
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setConfirmTargetId(null);
    }
  };
  const handleViewDetails = (pca: PCA) => {
    setSelectedPCA(pca);
    setDetailsOpen(true);
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
  const filteredPCAs = (pcas || []).filter(pca => {
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
      if (pca.area_requisitante !== filters.area_requisitante) {
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
  const totalAtrasadas = filteredPCAs.filter(p => p.atrasada).length;
  const totalNoPrazo = filteredPCAs.length - totalAtrasadas;
  const totalValor = filteredPCAs.reduce((acc, p) => acc + (typeof p.valor_total === 'number' ? p.valor_total : (p.valor_total ? Number(p.valor_total as any) : 0)), 0);

  if (loading) {
    return <Typography>Carregando...</Typography>;
  }

  // Generate year options (current year Â± 3 years)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 3; i <= currentYear + 3; i++) {
      years.push(i);
    }
    return years;
  };

  const yearOptions = generateYearOptions();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={3}>
          <Typography variant="h4">
            Planejamento - PCA
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Ano</InputLabel>
            <Select
              value={selectedYear}
              label="Ano"
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {cycleStatus && (
            <Chip
              label={cycleStatus === 'ENCERRADO' ? 'Encerrado' : 'Aberto'}
              color={cycleStatus === 'ENCERRADO' ? 'default' : 'success'}
              variant={cycleStatus === 'ENCERRADO' ? 'outlined' : 'filled'}
              size="small"
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TableExport
            data={filteredPCAs}
            columns={exportColumns}
            filename={`planejamento_pca_${selectedYear}`}
            title={`Relatório de Planejamento - PCA ${selectedYear}`}
          />
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setImportDialog(true)} disabled={cycleStatus === 'ENCERRADO'}>
            Importar Excel
          </Button>
        </Box>
      </Box>


      <StatCards
        items={[
          { label: 'Total filtrado', value: filteredPCAs.length, color: '#0d6efd' },
          { label: 'Atrasadas', value: totalAtrasadas, color: '#ffc107' },
          { label: 'No prazo', value: totalNoPrazo, color: '#20c997' },
          { label: 'Valor total', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValor || 0), color: '#6f42c1' },
        ]}
      />
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
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* VERIFICAÃ‡ÃƒO SEGURA antes do map */}
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
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(pca)}
                      title="Ver detalhes"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
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
        <DialogTitle>Importar PCAs</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Seleção do tipo de arquivo */}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Tipo de arquivo:
            </Typography>
            <ToggleButtonGroup
              value={importType}
              exclusive
              onChange={(_, value) => {
                if (value) {
                  setImportType(value);
                  setSelectedFile(null); // Limpar arquivo selecionado ao trocar tipo
                }
              }}
              sx={{ mb: 2 }}
            >
              <ToggleButton value="excel">
                Excel (.xlsx, .xls)
              </ToggleButton>
              <ToggleButton value="csv">
                CSV (.csv)
              </ToggleButton>
            </ToggleButtonGroup>

            <Divider sx={{ my: 2 }} />

            {/* Informações sobre o tipo selecionado */}
            {importType === 'excel' ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Formato Excel Requerido (.xlsx ou .xls):
                </Typography>
                <Typography variant="body2" component="div">
                  O arquivo deve conter exatamente estas colunas na primeira linha:
                  <br />• <strong>Número da Contratação</strong> - Ex: 1/2025, 2/2025
                  <br />• <strong>Status da Contratação</strong> - Ex: Planejada, Em andamento
                  <br />• <strong>Situação da Execução</strong> - Ex: Não iniciada, Em execução
                  <br />• <strong>Título da Contratação</strong> - Descrição completa
                  <br />• <strong>Categoria da Contratação</strong> - Ex: Serviços, Obras
                  <br />â€¢ <strong>Valor Total</strong> - Formato: 1.000.000,00 ou 1000000.00
                  <br />• <strong>Área Requisitante</strong> - Setor responsável
                  <br />• <strong>Número DFD</strong> - Número do documento
                  <br />• <strong>Data Estimada de Início</strong> - Formato: DD/MM/AAAA
                  <br />• <strong>Data Estimada de Conclusão</strong> - Formato: DD/MM/AAAA
                  <br /><br />
                  <em>Dica: Use o arquivo CSV original e converta para Excel mantendo estes nomes de colunas.</em>
                </Typography>
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Arquivo CSV Original do PCA - Sem Formatação Necessária:
                </Typography>
                <Typography variant="body2">
                  <strong>Simplesmente faça o upload do arquivo CSV original baixado do sistema PCA!</strong>
                  <br /><br />
                  <strong>O que o sistema faz automaticamente:</strong>
                  <br />â€¢ Detecta o encoding correto (Windows-1252, UTF-8, etc.)
                  <br />• Mapeia as colunas automaticamente por posição
                  <br />â€¢ Limpa caracteres especiais corrompidos
                  <br />• Formata datas e valores monetários
                  <br />â€¢ Evita duplicatas (atualiza registros existentes)
                  <br /><br />
                  <em>Não precisa converter, formatar ou alterar o arquivo CSV original!</em>
                </Typography>
              </Alert>
            )}

            {/* Seletor de arquivo */}
            <Input
              type="file"
              inputProps={{
                accept: importType === 'excel' ? '.xlsx,.xls' : '.csv'
              }}
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
          <Button onClick={() => {
            setImportDialog(false);
            setSelectedFile(null);
          }}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={!selectedFile || importing}
          >
            {importing ? 'Importando...' : `Importar ${importType === 'excel' ? 'Excel' : 'CSV'}`}
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








