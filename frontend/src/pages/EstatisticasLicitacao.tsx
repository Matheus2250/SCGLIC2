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
  Gavel,
  CheckCircle,
  HourglassEmpty,
  Cancel,
} from '@mui/icons-material';
import { licitacaoService } from '../services/licitacao.service';
import { LicitacaoStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const EstatisticasLicitacao: React.FC = () => {
  const [licitacaoStats, setLicitacaoStats] = useState<LicitacaoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');

        const licitacaoData = await licitacaoService.getDashboardStats();
        setLicitacaoStats(licitacaoData && typeof licitacaoData === 'object' ? licitacaoData : null);
      } catch (err) {
        console.error('Erro ao carregar estatísticas da licitação:', err);
        setError('Erro ao carregar estatísticas da licitação');
        setLicitacaoStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <Typography>Carregando estatísticas...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const pieData = licitacaoStats ? [
    { name: 'Homologadas', value: licitacaoStats.homologadas, color: '#28a745' },
    { name: 'Em Andamento', value: licitacaoStats.em_andamento, color: '#ffc107' },
    { name: 'Fracassadas', value: licitacaoStats.fracassadas, color: '#dc3545' },
  ] : [];

  const barData = licitacaoStats ? [
    { name: 'Homologadas', value: licitacaoStats.homologadas },
    { name: 'Em Andamento', value: licitacaoStats.em_andamento },
    { name: 'Fracassadas', value: licitacaoStats.fracassadas },
  ] : [];

  const total = licitacaoStats ?
    licitacaoStats.homologadas + licitacaoStats.em_andamento + licitacaoStats.fracassadas : 0;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Estatísticas da Licitação
      </Typography>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Gavel sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h4">{total}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Total de Licitações
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
              <Box>
                <Typography variant="h4">{licitacaoStats?.homologadas || 0}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Homologadas
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <HourglassEmpty sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
              <Box>
                <Typography variant="h4">{licitacaoStats?.em_andamento || 0}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Em Andamento
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Cancel sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
              <Box>
                <Typography variant="h4">{licitacaoStats?.fracassadas || 0}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Fracassadas
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3}>
        {/* Gráfico de Pizza - Status das Licitações */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Status das Licitações
            </Typography>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '90%' }}>
                <Typography color="textSecondary">Nenhum dado disponível</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Gráfico de Barras - Status das Licitações */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Comparativo de Status
            </Typography>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#004085" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '90%' }}>
                <Typography color="textSecondary">Nenhum dado disponível</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Informações Adicionais */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              Relatórios Detalhados
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
              Para análises mais detalhadas das licitações, utilize a seção de Relatórios.
              Lá você pode gerar relatórios personalizados e exportar dados específicos.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EstatisticasLicitacao;