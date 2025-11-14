import React from 'react';
import RecentActivities from '../components/common/RecentActivitiesNew';
import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import { Assignment, CheckCircle, Gavel, Assessment } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const QuickCard: React.FC<{ title: string; description: string; icon: React.ReactNode; color: string; onClick: () => void }> = ({ title, description, icon, color, onClick }) => (
  <Paper onClick={onClick} sx={{ p: 2, height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 6 } }}>
    <Box display="flex" alignItems="center" gap={1.5}>
      <Box sx={{ bgcolor: color, color: '#fff', width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" sx={{ fontSize: '1.05rem', lineHeight: 1.3 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>{description}</Typography>
      </Box>
    </Box>
  </Paper>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 700 }}>
        Página Inicial
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Bem-vindo. Selecione abaixo uma área para começar ou use o menu lateral.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6} lg={3}>
          <QuickCard title="Planejamento (PCA)" description="Gerencie contratações planejadas e atrasos" icon={<Assignment />} color="#0d6efd" onClick={() => navigate('/planejamento')} />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <QuickCard title="Qualificação" description="Acompanhe instruções e status" icon={<CheckCircle />} color="#198754" onClick={() => navigate('/qualificacao')} />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <QuickCard title="Licitação" description="Registre e acompanhe pregões" icon={<Gavel />} color="#fd7e14" onClick={() => navigate('/licitacao')} />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <QuickCard title="Relatórios" description="Gere relatórios unificados e customizados" icon={<Assessment />} color="#6f42c1" onClick={() => navigate('/relatorios')} />
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2, flexShrink: 0 }}>
        <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 700, fontSize: '1.1rem' }}>
          Dicas rápidas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          • Use os atalhos acima para ir direto ao módulo desejado.
          <br />• Nos módulos, filtre as tabelas e exporte os resultados.
        </Typography>
        <Button variant="outlined" size="small" onClick={() => navigate('/planejamento/atrasadas')}>Ver contratações atrasadas</Button>
      </Paper>

      {/* Atividades Recentes */}
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <RecentActivities />
      </Box>
    </Box>
  );
};

export default Dashboard;
