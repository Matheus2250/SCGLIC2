import React, { useEffect, useMemo, useState } from 'react';
import { Box, Grid, Typography, Card, CardContent, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Assignment, Warning, CheckCircle, TrendingUp } from '@mui/icons-material';
import { pcaService } from '../services/pca.service';
import { PCA } from '../types';
import DashboardBuilder from '../components/common/DashboardBuilder';

type ChartDatum = { name: string; value: number };

const EstatisticasPlanejamento: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [pcas, setPcas] = useState<PCA[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear - 3; y <= currentYear + 3; y++) years.push(y);
    return years;
  };
  const yearOptions = useMemo(generateYearOptions, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await pcaService.getAll(0, 10000, selectedYear);
        setPcas(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Erro ao carregar estatísticas por ano:', e);
        setError('Erro ao carregar Estatísticas do Planejamento');
        setPcas([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedYear]);

  const total = pcas ? pcas.length : 0;
  const atrasadas = pcas ? pcas.filter((p: any) => p.atrasada).length : 0;
  const vencidas = pcas ? pcas.filter((p: any) => p.vencida).length : 0;
  const noPrazo = Math.max(0, total - atrasadas - vencidas);

  const groupCount = (arr: PCA[] | null, key: (p: PCA) => string, fallback: string): ChartDatum[] => {
    if (!arr) return [];
    const map = new Map<string, number>();
    arr.forEach(p => {
      const k = (key(p) || fallback).trim() || fallback;
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  };

  const sumBy = (arr: PCA[] | null, key: (p: PCA) => string, value: (p: PCA) => number, fallback: string): ChartDatum[] => {
    if (!arr) return [];
    const map = new Map<string, number>();
    arr.forEach(p => {
      const k = (key(p) || fallback).trim() || fallback;
      const v = value(p);
      map.set(k, (map.get(k) || 0) + (isFinite(v) ? v : 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  };

  const datasets: Record<string, ChartDatum[]> = {
    'Status (pizza)': [
      { name: 'No Prazo', value: noPrazo },
      { name: 'Atrasadas', value: atrasadas },
      { name: 'Vencidas', value: vencidas },
    ],
    'Situação da Execução': groupCount(pcas, p => (p as any).situacao_execucao || 'Não iniciada', 'Não iniciada'),
    'Categorias': groupCount(pcas, p => (p as any).categoria_contratacao || 'Não informada', 'Não informada'),
    'Valores por Categoria': sumBy(
      pcas,
      p => (p as any).categoria_contratacao || 'Não informada',
      p => typeof (p as any).valor_total === 'number' ? (p as any).valor_total : Number((p as any).valor_total || 0),
      'Não informada'
    ),
    'Status da Contratação': groupCount(pcas, p => (p as any).status_contratacao || 'Não informado', 'Não informado'),
  };

  const defaults = [
    { id: 'w1', title: 'Status das Contratações', type: 'pie' as const, dataset: 'Status (pizza)', md: 6 },
    { id: 'w2', title: 'Situação da Execução', type: 'bar' as const, dataset: 'Situação da Execução', xKey: 'name', yKey: 'value', color: '#004085', md: 6 },
    { id: 'w3', title: 'Contratações por Categoria', type: 'bar' as const, dataset: 'Categorias', xKey: 'name', yKey: 'value', color: '#28a745', md: 6 },
    { id: 'w4', title: 'Valores por Categoria', type: 'bar' as const, dataset: 'Valores por Categoria', xKey: 'name', yKey: 'value', color: '#ffc107', md: 6 },
    { id: 'w5', title: 'Status da Contratação', type: 'bar' as const, dataset: 'Status da Contratação', xKey: 'name', yKey: 'value', color: '#dc3545', md: 12 },
  ];

  if (loading) return <Typography>Carregando estatísticas...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4">Estatísticas do Planejamento</Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Ano</InputLabel>
          <Select value={selectedYear} label="Ano" onChange={(e) => setSelectedYear(Number((e.target as any).value))}>
            {yearOptions.map((year) => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent style={{ display:'flex', alignItems:'center' }}>
            <Assignment style={{ fontSize: 40, color: '#004085', marginRight: 8 }} />
            <Box>
              <Typography variant="h4">{total}</Typography>
              <Typography variant="body2" color="textSecondary">Total de Contratações</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent style={{ display:'flex', alignItems:'center' }}>
            <CheckCircle style={{ fontSize: 40, color: '#28a745', marginRight: 8 }} />
            <Box>
              <Typography variant="h4">{noPrazo}</Typography>
              <Typography variant="body2" color="textSecondary">No Prazo</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent style={{ display:'flex', alignItems:'center' }}>
            <Warning style={{ fontSize: 40, color: '#ffc107', marginRight: 8 }} />
            <Box>
              <Typography variant="h4">{atrasadas}</Typography>
              <Typography variant="body2" color="textSecondary">Atrasadas</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent style={{ display:'flex', alignItems:'center' }}>
            <TrendingUp style={{ fontSize: 40, color: '#dc3545', marginRight: 8 }} />
            <Box>
              <Typography variant="h4">{vencidas}</Typography>
              <Typography variant="body2" color="textSecondary">Vencidas</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2, mb: 4 }}>
        <DashboardBuilder storageKey={'dash:planejamento'} datasets={datasets} defaults={defaults} />
      </Box>
    </Box>
  );
};

export default EstatisticasPlanejamento;

