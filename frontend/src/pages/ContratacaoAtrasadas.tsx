import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TablePagination,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import {
  Warning,
  Schedule,
  Error,
} from '@mui/icons-material';
import { pcaService } from '../services/pca.service';
import { PCA } from '../types';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TableExport from '../components/common/TableExport';
import TableFilters, { FilterField, FilterValues } from '../components/common/TableFilters';

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

const ContratacaoAtrasadas: React.FC = () => {
  const [atrasadas, setAtrasadas] = useState<PCA[]>([]);
  const [vencidas, setVencidas] = useState<PCA[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);

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
        { value: 'atrasada', label: 'Atrasada' },
        { value: 'vencida', label: 'Vencida' }
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
    { key: 'data_estimada_inicio', label: 'Data Início' },
    { key: 'data_estimada_conclusao', label: 'Data Conclusão' },
    {
      key: 'status',
      label: 'Status',
      formatter: (value: any) => {
        // Status será definido durante a exportação
        return value || 'No Prazo';
      }
    },
  ];

  useEffect(() => {
    fetchPCAs();
  }, []);

  const fetchPCAs = async () => {
    try {
      setLoading(true);

      // Buscar contratações específicas usando endpoints SQL
      const [atrasadasData, vencidasData] = await Promise.all([
        pcaService.getAtrasadas(),
        pcaService.getVencidas()
      ]);

      // Definir dados baseados nos resultados dos endpoints SQL
      setAtrasadas(Array.isArray(atrasadasData) ? atrasadasData : []);
      setVencidas(Array.isArray(vencidasData) ? vencidasData : []);

    } catch (error) {
      toast.error('Erro ao carregar contratações');
      console.error(error);
      setAtrasadas([]);
      setVencidas([]);
    } finally {
      setLoading(false);
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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0); // Reset pagination when changing tabs
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

  // Filter PCAs based on selected tab and filters
  const getFilteredPCAs = () => {
    let basePCAs: PCA[] = [];
    switch (tabValue) {
      case 0: // Todas (atrasadas + vencidas)
        basePCAs = [...atrasadas, ...vencidas];
        break;
      case 1: // Atrasadas
        basePCAs = atrasadas;
        break;
      case 2: // Vencidas
        basePCAs = vencidas;
        break;
      default:
        basePCAs = [];
    }

    // Apply filters
    return basePCAs.filter(pca => {
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
        const isVencida = vencidas.some(v => v.id === pca.id);
        const isAtrasada = atrasadas.some(a => a.id === pca.id);

        if (filters.status === 'atrasada' && !isAtrasada) return false;
        if (filters.status === 'vencida' && !isVencida) return false;
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
  };

  const filteredPCAs = getFilteredPCAs();
  const paginatedPCAs = filteredPCAs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getStatusChip = (pca: PCA) => {
    // Determinar status baseado na lista onde a contratação aparece
    const isVencida = vencidas.some(v => v.id === pca.id);
    const isAtrasada = atrasadas.some(a => a.id === pca.id);

    if (isVencida) {
      return (
        <Chip
          icon={<Error />}
          label="Vencida"
          color="error"
          size="small"
        />
      );
    }
    if (isAtrasada) {
      return (
        <Chip
          icon={<Schedule />}
          label="Atrasada"
          color="warning"
          size="small"
        />
      );
    }
    return null;
  };

  const getTabIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Warning />;
      case 1:
        return <Schedule />;
      case 2:
        return <Error />;
      default:
        return <Warning />;
    }
  };

  const getTabCounts = () => {
    const totalAtrasadas = atrasadas.length;
    const totalVencidas = vencidas.length;
    const total = totalAtrasadas + totalVencidas;

    return { total, atrasadas: totalAtrasadas, vencidas: totalVencidas };
  };

  const { total, atrasadas: countAtrasadas, vencidas: countVencidas } = getTabCounts();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Carregando contratações...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">
          Contratações Atrasadas e Vencidas
        </Typography>
        <TableExport
          data={filteredPCAs}
          columns={exportColumns}
          filename={`contratacoes_${tabValue === 0 ? 'atrasadas_vencidas' : tabValue === 1 ? 'atrasadas' : 'vencidas'}`}
          title={`Relatório de Contratações ${tabValue === 0 ? 'Atrasadas e Vencidas' : tabValue === 1 ? 'Atrasadas' : 'Vencidas'}`}
        />
      </Box>

      {total === 0 ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          Parabéns! Não há contratações atrasadas ou vencidas no momento.
        </Alert>
      ) : (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Foram encontradas {total} contratação(ões) que requerem atenção:
          {countAtrasadas > 0 && ` ${countAtrasadas} atrasada(s)`}
          {countAtrasadas > 0 && countVencidas > 0 && ' e'}
          {countVencidas > 0 && ` ${countVencidas} vencida(s)`}.
        </Alert>
      )}

      <TableFilters
        fields={filterFields}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        searchPlaceholder="Pesquisar por número, título ou área..."
      />

      <Paper>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab
            icon={getTabIcon(0)}
            label={`Todas (${total})`}
            iconPosition="start"
          />
          <Tab
            icon={getTabIcon(1)}
            label={`Atrasadas (${countAtrasadas})`}
            iconPosition="start"
          />
          <Tab
            icon={getTabIcon(2)}
            label={`Vencidas (${countVencidas})`}
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={tabValue} index={tabValue}>
          {filteredPCAs.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary">
                {tabValue === 0 && 'Nenhuma contratação atrasada ou vencida encontrada.'}
                {tabValue === 1 && 'Nenhuma contratação atrasada encontrada.'}
                {tabValue === 2 && 'Nenhuma contratação vencida encontrada.'}
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Nº Contratação</TableCell>
                      <TableCell>Título</TableCell>
                      <TableCell>Valor Total</TableCell>
                      <TableCell>Área Requisitante</TableCell>
                      <TableCell>Data Início</TableCell>
                      <TableCell>Data Conclusão</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedPCAs.map((pca) => (
                      <TableRow key={pca.id || pca.numero_contratacao}>
                        <TableCell>
                          {getStatusChip(pca)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {pca.numero_contratacao}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                            {pca.titulo_contratacao || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(pca.valor_total)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {pca.area_requisitante || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(pca.data_estimada_inicio)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color={pca.vencida ? 'error' : pca.atrasada ? 'warning.main' : 'inherit'}>
                            {formatDate(pca.data_estimada_conclusao)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

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
            </>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ContratacaoAtrasadas;