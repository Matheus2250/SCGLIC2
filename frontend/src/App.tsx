import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './store/auth.context';
import { ConfirmProvider } from './components/common/ConfirmProvider';
import PrivateRoute from './components/common/PrivateRoute';
import Header from './components/common/HeaderNew';
import Sidebar from './components/common/Sidebar';
import LoginForm from './components/auth/LoginFormNew';
import RegisterForm from './components/auth/RegisterForm';
import Dashboard from './pages/Dashboard';
import Planejamento from './pages/Planejamento';
import ContratacaoAtrasadas from './pages/ContratacaoAtrasadas';
import EstatisticasPlanejamento from './pages/EstatisticasPlanejamentoNew';
import Qualificacao from './pages/Qualificacao';
import EstatisticasQualificacao from './pages/EstatisticasQualificacao';
import Licitacao from './pages/Licitacao';
import EstatisticasLicitacao from './pages/EstatisticasLicitacao';
import Relatorios from './pages/Relatorios';
import AdminUsuarios from './pages/AdminUsuarios';
import GerenciarUsuarios from './pages/GerenciarUsuarios';
import UserProfile from './pages/UserProfile';

const theme = createTheme({
  palette: {
    primary: { main: '#004085' },
    secondary: { main: '#28a745' },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginInline: 6,
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 64, 133, 0.12)',
          },
        },
      },
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ConfirmProvider>
        <Router future={{ 
          v7_startTransition: true,
          v7_relativeSplatPath: true 
        }}>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <Box sx={{ display: 'flex' }}>
                    <Header onSidebarToggle={handleSidebarToggle} />
                    <Sidebar open={sidebarOpen} />
                    <Box
                      component="main"
                      sx={{
                        flexGrow: 1,
                        bgcolor: 'background.default',
                        p: 3,
                        mt: 8, // Account for AppBar height
                        overflowX: 'hidden',
                        transition: (theme) => theme.transitions.create(['margin'], {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.leavingScreen,
                        }),
                      }}
                    >
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/planejamento" element={
                          <PrivateRoute allowedRoles={['COORDENADOR', 'DIPLAN', 'VISITANTE']}>
                            <Planejamento />
                          </PrivateRoute>
                        } />
                        <Route path="/planejamento/atrasadas" element={
                          <PrivateRoute allowedRoles={['COORDENADOR', 'DIPLAN', 'VISITANTE']}>
                            <ContratacaoAtrasadas />
                          </PrivateRoute>
                        } />
                        <Route path="/planejamento/estatisticas" element={
                          <PrivateRoute allowedRoles={['COORDENADOR', 'DIPLAN', 'VISITANTE']}>
                            <EstatisticasPlanejamento />
                          </PrivateRoute>
                        } />
                        <Route path="/qualificacao" element={
                          <PrivateRoute allowedRoles={['COORDENADOR', 'DIQUALI']}>
                            <Qualificacao />
                          </PrivateRoute>
                        } />
                        <Route path="/qualificacao/estatisticas" element={
                          <PrivateRoute allowedRoles={['COORDENADOR', 'DIQUALI']}>
                            <EstatisticasQualificacao />
                          </PrivateRoute>
                        } />
                        <Route path="/licitacao" element={
                          <PrivateRoute allowedRoles={['COORDENADOR', 'DIPLI']}>
                            <Licitacao />
                          </PrivateRoute>
                        } />
                        <Route path="/licitacao/estatisticas" element={
                          <PrivateRoute allowedRoles={['COORDENADOR', 'DIPLI']}>
                            <EstatisticasLicitacao />
                          </PrivateRoute>
                        } />
                        <Route path="/relatorios" element={<Relatorios />} />
                        <Route path="/perfil" element={<UserProfile />} />
                        <Route path="/admin/usuarios" element={
                          <PrivateRoute allowedRoles={['COORDENADOR']}>
                            <AdminUsuarios />
                          </PrivateRoute>
                        } />
                        <Route path="/admin/gerenciar-usuarios" element={
                          <PrivateRoute allowedRoles={['COORDENADOR']}>
                            <GerenciarUsuarios />
                          </PrivateRoute>
                        } />
                      </Routes>
                    </Box>
                  </Box>
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        </ConfirmProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

