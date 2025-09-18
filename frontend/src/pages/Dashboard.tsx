import React from 'react';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';

const Dashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Início
      </Typography>

      <Paper sx={{ p: 4, textAlign: 'center', minHeight: 400 }}>
        <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
          Bem-vindo ao Sistema de Contratações
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Utilize o menu lateral para navegar pelas diferentes seções do sistema.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Dashboard;