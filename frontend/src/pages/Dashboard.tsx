import React from 'react';
import RecentActivities from '../components/common/RecentActivities';
import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import { Assignment, CheckCircle, Gavel, Assessment } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const QuickCard: React.FC<{ title: string; description: string; icon: React.ReactNode; color: string; onClick: () => void }> = ({ title, description, icon, color, onClick }) => (
  <Paper onClick={onClick} sx={{ p: 3, height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 6 } }}>
    <Box display="flex" alignItems="center" gap={2}>
      <Box sx={{ bgcolor: color, color: '#fff', width: 48, height: 48, borderRadius: 2, display: 'grid', placeItems: 'center' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
      </Box>
    </Box>
  </Paper>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
        PÃ¡gina Inicial
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Bem-vindo. Selecione abaixo uma Ã¡rea para comeÃ§ar ou use o menu lateral.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} lg={3}>
          <QuickCard title="Planejamento (PCA)" description="Gerencie contrataÃ§Ãµes planejadas e atrasos" icon={<Assignment />} color="#0d6efd" onClick={() => navigate('/planejamento')} />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <QuickCard title="QualificaÃ§Ã£o" description="Acompanhe instruÃ§Ãµes e status" icon={<CheckCircle />} color="#198754" onClick={() => navigate('/qualificacao')} />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <QuickCard title="LicitaÃ§Ã£o" description="Registre e acompanhe pregÃµes" icon={<Gavel />} color="#fd7e14" onClick={() => navigate('/licitacao')} />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <QuickCard title="RelatÃ³rios" description="Gere relatÃ³rios unificados e customizados" icon={<Assessment />} color="#6f42c1" onClick={() => navigate('/relatorios')} />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
          Dicas rÃ¡pidas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          â€¢ Use os atalhos acima para ir direto ao mÃ³dulo desejado.
          <br />â€¢ Nos mÃ³dulos, filtre as tabelas e exporte os resultados.
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/planejamento/atrasadas')}>Ver contrataÃ§Ãµes atrasadas</Button>
      </Paper>

      {/* Atividades Recentes */}
      <RecentActivities />
    </Box>
  );
};

export default Dashboard;

