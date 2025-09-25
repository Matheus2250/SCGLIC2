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
import { Qualificacao } from '../types';

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
        setError('Erro ao carregar dados das qualificações');
        console.error('Erro ao buscar qualificações:', err);
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

  // Calcular estatísticas reais dos dados
  const stats = {
    total: qualificacoes.length,
    concluidas: qualificacoes.filter(q => q.status === 'CONCLUIDO').length,
    em_analise: qualificacoes.filter(q => q.status === 'EM ANALISE').length,
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
                <Typography variant="h4">{stats.total}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Total de Qualificações
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
                  Concluídas
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
                  Em Análise
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dados detalhados das qualificações */}
      {qualificacoes.length > 0 ? (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            📊 Resumo das Qualificações
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Total de {stats.total} qualificações cadastradas no sistema, sendo {stats.concluidas} concluídas
            ({stats.total > 0 ? Math.round((stats.concluidas / stats.total) * 100) : 0}%) e {stats.em_analise} em análise
            ({stats.total > 0 ? Math.round((stats.em_analise / stats.total) * 100) : 0}%).
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            📊 Estatísticas da Qualificação
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
            Nenhuma qualificação encontrada no sistema.
            As estatísticas aparecerão quando qualificações forem cadastradas.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default EstatisticasQualificacao;