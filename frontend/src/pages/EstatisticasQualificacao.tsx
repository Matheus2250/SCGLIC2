import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  HourglassEmpty,
  Assignment,
} from '@mui/icons-material';
import { qualificacaoService } from '../services/qualificacao.service';
import { Qualificacao } from '../types';\nimport DashboardBuilderQualificacao from '../components/common/DashboardBuilderQualificacao';

const EstatisticasQualificacao: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [qualificacoes, setQualificacoes] = useState<Qualificacao[]>([]);

  useEffect(() => {
    const fetchQualificacoes = async () => {
      try {
        setLoading(true);
        const data = await qualificacaoService.getAll(0, 1000);
        setQualificacoes(data);
      } catch (err) {
        setError('Erro ao carregar dados das qualificaÃ§Ãµes');
        console.error('Erro ao buscar qualificaÃ§Ãµes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQualificacoes();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // Calcular estatÃ­sticas reais dos dados
  const stats = {
    total: qualificacoes.length,
    concluidas: qualificacoes.filter(q => q.status === 'CONCLUIDO').length,
    em_analise: qualificacoes.filter(q => q.status === 'EM ANALISE').length,
  };\n\n  return (\n    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        EstatÃ­sticas da QualificaÃ§Ã£o
      </Typography>

      {/* Cards de EstatÃ­sticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Assignment sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h4">{stats.total}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Total de QualificaÃ§Ãµes
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
              <Box>
                <Typography variant="h4">{stats.concluidas}</Typography>
                <Typography variant="body2" color="textSecondary">
                  ConcluÃ­das
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <HourglassEmpty sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
              <Box>
                <Typography variant="h4">{stats.em_analise}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Em AnÃ¡lise
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dados detalhados das qualificaÃ§Ãµes */}
      {qualificacoes.length > 0 ? (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Resumo das QualificaÃ§Ãµes
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Total de {stats.total} qualificaÃ§Ãµes cadastradas no sistema, sendo {stats.concluidas} concluÃ­das
            ({stats.total > 0 ? Math.round((stats.concluidas / stats.total) * 100) : 0}%) e {stats.em_analise} em anÃ¡lise
            ({stats.total > 0 ? Math.round((stats.em_analise / stats.total) * 100) : 0}%).
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            EstatÃ­sticas da QualificaÃ§Ã£o
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
            Nenhuma qualificaÃ§Ã£o encontrada no sistema.
            As estatÃ­sticas aparecerÃ£o quando qualificaÃ§Ãµes forem cadastradas.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default EstatisticasQualificacao;
