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
  CheckCircle,
  HourglassEmpty,
  Cancel,
  Assignment,
} from '@mui/icons-material';

const EstatisticasQualificacao: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Simular carregamento por enquanto
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Typography>Carregando estatísticas...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // Dados mockados para demonstração
  const mockStats = {
    total: 0,
    aprovadas: 0,
    em_analise: 0,
    rejeitadas: 0,
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Estatísticas da Qualificação
      </Typography>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Assignment sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h4">{mockStats.total}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Total de Qualificações
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
                <Typography variant="h4">{mockStats.aprovadas}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Aprovadas
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
                <Typography variant="h4">{mockStats.em_analise}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Em Análise
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
                <Typography variant="h4">{mockStats.rejeitadas}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Rejeitadas
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Mensagem informativa */}
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          📊 Estatísticas da Qualificação
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
          Esta seção será desenvolvida quando o módulo de Qualificação for implementado.
          Aqui serão exibidos gráficos e estatísticas sobre os processos de qualificação.
        </Typography>
      </Paper>
    </Box>
  );
};

export default EstatisticasQualificacao;