import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Assignment,
  Warning,
  CheckCircle,
  TrendingUp,
} from '@mui/icons-material';
import { pcaService } from '../services/pca.service';
import { licitacaoService } from '../services/licitacao.service';
import { DashboardStats, LicitacaoStats } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type FilterType = 'todos' | 'planejamento' | 'qualificacao' | 'licitacao';

const Dashboard: React.FC = () => {
  const [pcaStats, setPcaStats] = useState<DashboardStats | null>(null);
  const [licitacaoStats, setLicitacaoStats] = useState<LicitacaoStats | null>(null);
  const [pcaCharts, setPcaCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<FilterType>('todos');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Buscando estatísticas do dashboard...');
        const [pcaData, licitacaoData, pcaChartsData] = await Promise.all([
          pcaService.getDashboardStats(),
          licitacaoService.getDashboardStats(),
          pcaService.getDashboardCharts(),
        ]);
        console.log('Dados PCA recebidos:', pcaData);
        console.log('Dados Licitação recebidos:', licitacaoData);
        console.log('Dados Charts PCA recebidos:', pcaChartsData);
        
        // Verificar se os dados são válidos
        setPcaStats(pcaData && typeof pcaData === 'object' ? pcaData : null);
        setLicitacaoStats(licitacaoData && typeof licitacaoData === 'object' ? licitacaoData : null);
        setPcaCharts(pcaChartsData && typeof pcaChartsData === 'object' ? pcaChartsData : null);
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
        setError('Erro ao carregar dados do dashboard');
        setPcaStats(null);
        setLicitacaoStats(null);
        setPcaCharts(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <Typography>Carregando...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const pieData = pcaStats ? [
    { name: 'No Prazo', value: pcaStats.pcas_no_prazo, color: '#28a745' },
    { name: 'Atrasadas', value: pcaStats.pcas_atrasadas, color: '#dc3545' },
  ] : [];

  const licitacaoBarData = licitacaoStats ? [
    { name: 'Homologadas', value: licitacaoStats.homologadas },
    { name: 'Em Andamento', value: licitacaoStats.em_andamento },
    { name: 'Fracassadas', value: licitacaoStats.fracassadas },
  ] : [];

  const handleFilterChange = (event: SelectChangeEvent<FilterType>) => {
    setFilter(event.target.value as FilterType);
  };

  const getFilteredStats = () => {
    switch (filter) {
      case 'planejamento':
        return {
          cards: [
            {
              title: 'Total de Contratações',
              value: pcaStats?.total_pcas || 0,
              icon: Assignment,
              color: 'primary' as const
            },
            {
              title: 'Contratações Atrasadas',
              value: pcaStats?.pcas_atrasadas || 0,
              icon: Warning,
              color: 'error' as const
            },
            {
              title: 'Contratações no Prazo',
              value: pcaStats?.pcas_no_prazo || 0,
              icon: CheckCircle,
              color: 'success' as const
            }
          ],
          charts: [
            {
              title: 'Status das Contratações',
              type: 'pie' as const,
              data: pieData
            },
            ...(pcaCharts ? [
              {
                title: 'Situação da Execução',
                type: 'bar' as const,
                data: pcaCharts.situacao_execucao
              },
              {
                title: 'Categoria das Contratações',
                type: 'bar' as const,
                data: pcaCharts.categoria
              },
              {
                title: 'Status das Contratações (Detalhado)',
                type: 'pie' as const,
                data: pcaCharts.status_contratacao
              },
              {
                title: 'Valor por Categoria',
                type: 'bar' as const,
                data: pcaCharts.valor_por_categoria
              }
            ] : [])
          ]
        };
      case 'licitacao':
        return {
          cards: [
            {
              title: 'Licitações Homologadas',
              value: licitacaoStats?.homologadas || 0,
              icon: CheckCircle,
              color: 'success' as const
            },
            {
              title: 'Em Andamento',
              value: licitacaoStats?.em_andamento || 0,
              icon: TrendingUp,
              color: 'primary' as const
            },
            {
              title: 'Fracassadas',
              value: licitacaoStats?.fracassadas || 0,
              icon: Warning,
              color: 'error' as const
            },
            {
              title: 'Economia Total',
              value: `R$ ${(licitacaoStats?.total_economia || 0).toLocaleString('pt-BR')}`,
              icon: TrendingUp,
              color: 'success' as const
            }
          ],
          charts: [
            {
              title: 'Status das Licitações',
              type: 'bar' as const,
              data: licitacaoBarData
            }
          ]
        };
      case 'qualificacao':
        return {
          cards: [
            {
              title: 'Em Análise',
              value: 0,
              icon: Assignment,
              color: 'primary' as const
            },
            {
              title: 'Qualificadas',
              value: 0,
              icon: CheckCircle,
              color: 'success' as const
            },
            {
              title: 'Rejeitadas',
              value: 0,
              icon: Warning,
              color: 'error' as const
            }
          ],
          charts: []
        };
      default:
        return {
          cards: [
            {
              title: 'Total de Contratações',
              value: pcaStats?.total_pcas || 0,
              icon: Assignment,
              color: 'primary' as const
            },
            {
              title: 'Contratações Atrasadas',
              value: pcaStats?.pcas_atrasadas || 0,
              icon: Warning,
              color: 'error' as const
            },
            {
              title: 'Licitações Homologadas',
              value: licitacaoStats?.homologadas || 0,
              icon: CheckCircle,
              color: 'success' as const
            },
            {
              title: 'Economia Total',
              value: `R$ ${(licitacaoStats?.total_economia || 0).toLocaleString('pt-BR')}`,
              icon: TrendingUp,
              color: 'success' as const
            }
          ],
          charts: [
            {
              title: 'Status das Contratações',
              type: 'pie' as const,
              data: pieData
            },
            {
              title: 'Status das Licitações',
              type: 'bar' as const,
              data: licitacaoBarData
            }
          ]
        };
    }
  };

  const filteredStats = getFilteredStats();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="filter-label">Filtrar por Área</InputLabel>
          <Select
            labelId="filter-label"
            value={filter}
            label="Filtrar por Área"
            onChange={handleFilterChange}
          >
            <MenuItem value="todos">Todas as Áreas</MenuItem>
            <MenuItem value="planejamento">Planejamento</MenuItem>
            <MenuItem value="qualificacao">Qualificação</MenuItem>
            <MenuItem value="licitacao">Licitação</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {filteredStats.cards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Grid item xs={12} sm={6} md={filteredStats.cards.length === 3 ? 4 : 3} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <IconComponent color={card.color} sx={{ mr: 2, fontSize: 40 }} />
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        {card.title}
                      </Typography>
                      <Typography variant="h4">
                        {card.value}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredStats.charts.length > 0 && (
        <Grid container spacing={3}>
          {filteredStats.charts.map((chart, index) => (
            <Grid item xs={12} md={filteredStats.charts.length <= 2 ? 6 : 4} key={index}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {chart.title}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {chart.type === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={chart.data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chart.data.map((entry: any, entryIndex: number) => (
                          <Cell key={`cell-${entryIndex}`} fill={entry.color || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  ) : (
                    <BarChart data={chart.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#004085" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;