import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Alert,
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

const Dashboard: React.FC = () => {
  const [pcaStats, setPcaStats] = useState<DashboardStats | null>(null);
  const [licitacaoStats, setLicitacaoStats] = useState<LicitacaoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Buscando estatísticas do dashboard...');
        const [pcaData, licitacaoData] = await Promise.all([
          pcaService.getDashboardStats(),
          licitacaoService.getDashboardStats(),
        ]);
        console.log('Dados PCA recebidos:', pcaData);
        console.log('Dados Licitação recebidos:', licitacaoData);
        
        // Verificar se os dados são válidos
        setPcaStats(pcaData && typeof pcaData === 'object' ? pcaData : null);
        setLicitacaoStats(licitacaoData && typeof licitacaoData === 'object' ? licitacaoData : null);
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
        setError('Erro ao carregar dados do dashboard');
        setPcaStats(null);
        setLicitacaoStats(null);
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assignment color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total PCAs
                  </Typography>
                  <Typography variant="h4">
                    {pcaStats?.total_pcas || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Warning color="error" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    PCAs Atrasadas
                  </Typography>
                  <Typography variant="h4">
                    {pcaStats?.pcas_atrasadas || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Licitações Homologadas
                  </Typography>
                  <Typography variant="h4">
                    {licitacaoStats?.homologadas || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Economia Total
                  </Typography>
                  <Typography variant="h4">
                    R$ {(licitacaoStats?.total_economia || 0).toLocaleString('pt-BR')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Status das PCAs
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Status das Licitações
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={licitacaoBarData}>
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
      </Grid>
    </Box>
  );
};

export default Dashboard;