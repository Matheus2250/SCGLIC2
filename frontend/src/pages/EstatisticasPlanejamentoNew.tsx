import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, Card, CardContent, Alert } from '@mui/material';
import { Assignment, Warning, CheckCircle, TrendingUp } from '@mui/icons-material';
import { pcaService } from '../services/pca.service';
import { DashboardStats } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DashboardBuilder from '../components/common/DashboardBuilder';

const EstatisticasPlanejamento: React.FC = () => {
  const [pcaStats, setPcaStats] = useState<DashboardStats | null>(null);
  const [pcaCharts, setPcaCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');
        const [pcaData, pcaChartsData] = await Promise.all([
          pcaService.getDashboardStats(),
          pcaService.getDashboardCharts(),
        ]);
        setPcaStats(pcaData && typeof pcaData === 'object' ? pcaData : null);
        setPcaCharts(pcaChartsData && typeof pcaChartsData === 'object' ? pcaChartsData : null);
      } catch (err) {
        console.error('Erro ao carregar Estatísticas do Planejamento:', err);
        setError('Erro ao carregar Estatísticas do Planejamento');
        setPcaStats(null);
        setPcaCharts(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Typography>Carregando estatísticas...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const pieData = pcaStats ? [
    { name: 'No Prazo', value: pcaStats.pcas_no_prazo, color: '#28a745' },
    { name: 'Atrasadas', value: pcaStats.pcas_atrasadas, color: '#ffc107' },
    { name: 'Vencidas', value: pcaStats.pcas_vencidas, color: '#dc3545' },
  ] : [];

  const datasets: any = {
    'Status (pizza)': pieData,
    'Situação da Execução': pcaCharts?.situacao_execucao || [],
    'Categorias': pcaCharts?.categoria || [],
    'Valores por Categoria': pcaCharts?.valor_por_categoria || [],
    'Status da Contratação': pcaCharts?.status_contratacao || [],
  };

  const defaults = [
    { id: 'w1', title: 'Status das Contratações', type: 'pie' as const, dataset: 'Status (pizza)', md: 6 },
    { id: 'w2', title: 'Situação da Execução', type: 'bar' as const, dataset: 'Situação da Execução', xKey: 'name', yKey: 'value', color: '#004085', md: 6 },
    { id: 'w3', title: 'Contratações por Categoria', type: 'bar' as const, dataset: 'Categorias', xKey: 'name', yKey: 'value', color: '#28a745', md: 6 },
    { id: 'w4', title: 'Valores por Categoria', type: 'bar' as const, dataset: 'Valores por Categoria', xKey: 'name', yKey: 'value', color: '#ffc107', md: 6 },
    { id: 'w5', title: 'Status da Contratação', type: 'bar' as const, dataset: 'Status da Contratação', xKey: 'name', yKey: 'value', color: '#dc3545', md: 12 },
  ];

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Estatísticas do Planejamento</Typography>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent sx={{ display:'flex', alignItems:'center' }}>
            <Assignment sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h4">{pcaStats?.total_pcas || 0}</Typography>
              <Typography variant="body2" color="textSecondary">Total de Contratações</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent sx={{ display:'flex', alignItems:'center' }}>
            <CheckCircle sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
            <Box>
              <Typography variant="h4">{pcaStats?.pcas_no_prazo || 0}</Typography>
              <Typography variant="body2" color="textSecondary">No Prazo</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent sx={{ display:'flex', alignItems:'center' }}>
            <Warning sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
            <Box>
              <Typography variant="h4">{pcaStats?.pcas_atrasadas || 0}</Typography>
              <Typography variant="body2" color="textSecondary">Atrasadas</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent sx={{ display:'flex', alignItems:'center' }}>
            <TrendingUp sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
            <Box>
              <Typography variant="h4">{pcaStats?.pcas_vencidas || 0}</Typography>
              <Typography variant="body2" color="textSecondary">Vencidas</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* Painel personalizável */}
      <Box sx={{ mt: 2, mb: 4 }}>
        <DashboardBuilder storageKey={'dash:planejamento'} datasets={datasets} defaults={defaults} />
      </Box>

      {/* Gráficos padrão (mantidos) */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Status das Contratações</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Situação da Execução</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={pcaCharts?.situacao_execucao || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#004085" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Contratações por Categoria</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={pcaCharts?.categoria || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#28a745" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Valores por Categoria</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={pcaCharts?.valor_por_categoria || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip formatter={(v) => formatCurrency(Number(v)) as any} />
                <Legend />
                <Bar dataKey="value" fill="#ffc107" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Status da Contratação</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={pcaCharts?.status_contratacao || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#dc3545" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EstatisticasPlanejamento;
