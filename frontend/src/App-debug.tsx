import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Container } from '@mui/material';

// Importar apenas componentes básicos para teste
import Dashboard from './pages/Dashboard';
import Planejamento from './pages/Planejamento';
import Qualificacao from './pages/Qualificacao';
import Licitacao from './pages/Licitacao';

// COMENTAR temporariamente o AuthProvider problemático
// import { AuthProvider } from './store/auth.context';

const theme = createTheme({
  palette: {
    primary: {
      main: '#004085',
    },
    secondary: {
      main: '#28a745',
    },
  },
});

// Layout simples sem sidebar/header
function SimpleLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        🔧 Debug Mode - Sistema de Contratações
      </Typography>
      {children}
    </Container>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* REMOVER temporariamente AuthProvider */}
      <Router>
        <SimpleLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/planejamento" element={<Planejamento />} />
            <Route path="/qualificacao" element={<Qualificacao />} />
            <Route path="/licitacao" element={<Licitacao />} />
          </Routes>
        </SimpleLayout>
      </Router>
    </ThemeProvider>
  );
}

export default App;