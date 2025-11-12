import React, { useEffect, useMemo, useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Warning, Schedule, Error } from '@mui/icons-material';
import { pcaService } from '../services/pca.service';
import { PCA } from '../types';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TableExport from '../components/common/TableExport';
import StatCards from '../components/common/StatCards';
import TableFilters, { FilterField, FilterValues } from '../components/common/TableFilters';

const exportColumns = [
  { key: 'numero_contratacao', label: 'Nº Contratação' },
  { key: 'titulo_contratacao', label: 'Título' },
  { key: 'valor_total', label: 'Valor Total' },
  { key: 'area_requisitante', label: 'Área Requisitante' },
  { key: 'data_estimada_inicio', label: 'Data Início' },
  { key: 'data_estimada_conclusao', label: 'Data Conclusão' },
  { key: 'status', label: 'Status', formatter: (value: any) => value || 'No Prazo' },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
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
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Filtros
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    area_requisitante: '',
    status: '',
    valorMin: null,
    valorMax: null,
    dataInicio: '',
    dataFim: '',
  });

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear - 3; i <= currentYear + 3; i++) years.push(i);
    return years;
  };
  const yearOptions = useMemo(generateYearOptions, []);

  const extractYear = (pca: PCA): number | null => {
    try {
      if (pca?.numero_contratacao) {
        const m = /([0-9]{4})$/.exec(String(pca.numero_contratacao).trim());
        if (m) {
          const y = parseInt(m[1], 10);
          if (y >= 2000 && y <= 2100) return y;
        }
      }
      if (pca?.data_estimada_inicio) {
        const y = new Date(pca.data_estimada_inicio).getFullYear();
        if (!Number.isNaN(y)) return y;
      }
      if (pca?.data_estimada_conclusao) {
        const y = new Date(pca.data_estimada_conclusao).getFullYear();
        if (!Number.isNaN(y)) return y;
      }
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const fetchPCAs = async () => {
      try {
        setLoading(true);
        const [atrasadasData, vencidasData] = await Promise.all([
          pcaService.getAtrasadas(),
          pcaService.getVencidas(),
        ]);
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
    fetchPCAs();
  }, []);

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Filtros
  const handleFilterChange = (key: string, value: string | number | null) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
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

  const getUniqueAreas = () => {
    const allPCAs = [...atrasadas, ...vencidas];
    const areas = allPCAs
      .map(pca => pca.area_requisitante)
      .filter(area => area && area.trim() !== '')
      .filter((area, index, self) => self.indexOf(area) === index)
      .sort();
    return areas.map(area => ({ value: area, label: area }));
  };

  const filterFields: FilterField[] = [
    { key: 'area_requisitante', label: 'Área Requisitante', type: 'select', options: getUniqueAreas() },
    { key: 'status', label: 'Status', type: 'select', options: [ { value: 'atrasada', label: 'Atrasada' }, { value: 'vencida', label: 'Vencida' } ] },
    { key: 'valorMin', label: 'Valor Mínimo', type: 'number', placeholder: '0,00' },
    { key: 'valorMax', label: 'Valor Máximo', type: 'number', placeholder: '0,00' },
    { key: 'dataInicio', label: 'Data Início', type: 'date' },
    { key: 'dataFim', label: 'Data Fim', type: 'date' },
  ];

  const applyFilters = (list: PCA[]) => {
    return list.filter(pca => {
      // Filtro por ano (a partir do número da contratação ou datas)
      if (selectedYear) {
        const y = extractYear(pca);
        if (y !== selectedYear) return false;
      }

      // Busca textual
      if (filters.search) {
        const searchTerm = filters.search.toString().toLowerCase();
        const searchableFields = [
          pca.numero_contratacao,
          pca.titulo_contratacao,
          pca.area_requisitante,
        ].join(' ').toLowerCase();
        if (!searchableFields.includes(searchTerm)) return false;
      }

      // Área
      if (filters.area_requisitante && pca.area_requisitante) {
        if (pca.area_requisitante !== filters.area_requisitante) return false;
      }

      // Status (derivado das listas)
      if (filters.status) {
        const isVencida = vencidas.some(v => v.id === pca.id);
        const isAtrasada = atrasadas.some(a => a.id === pca.id);
        if (filters.status === 'atrasada' && !isAtrasada) return false;
        if (filters.status === 'vencida' && !isVencida) return false;
      }

      // Faixa de valores
      if (filters.valorMin && pca.valor_total && pca.valor_total < Number(filters.valorMin)) return false;
      if (filters.valorMax && pca.valor_total && pca.valor_total > Number(filters.valorMax)) return false;

      // Intervalo de datas (usa data_estimada_conclusao)
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

  const getFilteredPCAs = () => {
    switch (tabValue) {
      case 0:
        return applyFilters([...atrasadas, ...vencidas]);
      case 1:
        return applyFilters(atrasadas);
      case 2:
        return applyFilters(vencidas);
      default:
        return [];
    }
  };

  const filteredPCAs = getFilteredPCAs();
  const paginatedPCAs = filteredPCAs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalValorFiltrado = filteredPCAs.reduce((acc, p) => acc + (typeof p.valor_total === 'number' ? p.valor_total : (p.valor_total ? Number(p.valor_total as any) : 0)), 0);

  const getStatusChip = (pca: PCA) => {
    const isVencida = vencidas.some(v => v.id === pca.id);
    const isAtrasada = atrasadas.some(a => a.id === pca.id);
    if (isVencida) return <Chip icon={<Error />} label="Vencida" color="error" size="small" />;
    if (isAtrasada) return <Chip icon={<Schedule />} label="Atrasada" color="warning" size="small" />;
    return null;
  };

  const getTabIcon = (index: number) => {
    switch (index) {
      case 0: return <Warning />;
      case 1: return <Schedule />;
      case 2: return <Error />;
      default: return <Warning />;
    }
  };

  const getTabCounts = () => {
    const filteredAtrasadas = applyFilters(atrasadas);
    const filteredVencidas = applyFilters(vencidas);
    const total = filteredAtrasadas.length + filteredVencidas.length;
    return { total, atrasadas: filteredAtrasadas.length, vencidas: filteredVencidas.length };
  };

  const { total, atrasadas: countAtrasadas, vencidas: countVencidas } = getTabCounts();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Carregando contratações...</Typography>
      </Box>
    );
  }

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };
  const handleTabChange = (_: any, value: number) => setTabValue(value);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={3}>
          <Typography variant="h4">Contratações Atrasadas e Vencidas</Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Ano</InputLabel>
            <Select value={selectedYear} label="Ano" onChange={(e) => setSelectedYear(Number((e.target as any).value))}>
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <TableExport
          data={filteredPCAs}
          columns={exportColumns}
          filename={`contratacoes_${tabValue === 0 ? 'atrasadas_vencidas' : tabValue === 1 ? 'atrasadas' : 'vencidas'}`}
          title={`Relatório de Contratações ${tabValue === 0 ? 'Atrasadas e Vencidas' : tabValue === 1 ? 'Atrasadas' : 'Vencidas'}`}
        />
      </Box>

      <StatCards
        items={[
          { label: 'Total filtrado', value: filteredPCAs.length, color: '#0d6efd' },
          { label: 'Atrasadas (filtrado)', value: countAtrasadas, color: '#ffc107' },
          { label: 'Vencidas (filtrado)', value: countVencidas, color: '#dc3545' },
          { label: 'Valor total filtrado', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValorFiltrado || 0), color: '#20c997' },
        ]}
      />

      <TableFilters
        fields={filterFields}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        searchPlaceholder="Pesquisar por número, título ou área..."
      />

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth">
          <Tab icon={getTabIcon(0)} label={`Todas (${total})`} iconPosition="start" />
          <Tab icon={getTabIcon(1)} label={`Atrasadas (${countAtrasadas})`} iconPosition="start" />
          <Tab icon={getTabIcon(2)} label={`Vencidas (${countVencidas})`} iconPosition="start" />
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
                  <TableHead sx={{ '& .MuiTableCell-head': { fontWeight: 700 } }}>
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
                        <TableCell>{getStatusChip(pca)}</TableCell>
                        <TableCell><Typography variant="body2" fontWeight="medium">{pca.numero_contratacao}</Typography></TableCell>
                        <TableCell><Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>{pca.titulo_contratacao || 'N/A'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" fontWeight="medium">{formatCurrency(pca.valor_total)}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{pca.area_requisitante || 'N/A'}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{formatDate(pca.data_estimada_inicio)}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color={pca.vencida ? 'error' : pca.atrasada ? 'warning.main' : 'inherit'}>{formatDate(pca.data_estimada_conclusao)}</Typography></TableCell>
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
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`}
              />
            </>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ContratacaoAtrasadas;

