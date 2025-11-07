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
import DashboardBuilderLicitacao from '../components/common/DashboardBuilderLicitacao';
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
        console.error('Erro ao carregar estatÃ­sticas da licitaÃ§Ã£o:', err);
        setError('Erro ao carregar estatÃ­sticas da licitaÃ§Ã£o');
        setLicitacaoStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <Typography>Carregando estatÃ­sticas...</Typography>;
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
        EstatÃ­sticas da LicitaÃ§Ã£o
      </Typography>

      {/* Cards de EstatÃ­sticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Gavel sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h4">{total}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Total de LicitaÃ§Ãµes
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

      {/* GrÃ¡ficos */}
            <Box sx={{ mt: 2, mb: 4 }}>
        <DashboardBuilderLicitacao storageKey={'dash:licitacao'} />
      </Box>
    </Box>
  );
};

export default EstatisticasLicitacao;
