import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './store/auth.context';
import PrivateRoute from './components/common/PrivateRoute';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Dashboard from './pages/Dashboard';
import Planejamento from './pages/Planejamento';
import Qualificacao from './pages/Qualificacao';
import Licitacao from './pages/Licitacao';
import Relatorios from './pages/Relatorios';

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

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
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
                          <PrivateRoute allowedRoles={['COORDENADOR', 'DIPLAN']}>
                            <Planejamento />
                          </PrivateRoute>
                        } />
                        <Route path="/qualificacao" element={
                          <PrivateRoute allowedRoles={['COORDENADOR', 'DIQUALI']}>
                            <Qualificacao />
                          </PrivateRoute>
                        } />
                        <Route path="/licitacao" element={
                          <PrivateRoute allowedRoles={['COORDENADOR', 'DIPLI']}>
                            <Licitacao />
                          </PrivateRoute>
                        } />
                        <Route path="/relatorios" element={<Relatorios />} />
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
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;