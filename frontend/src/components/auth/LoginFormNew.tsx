import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Container, CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../store/auth.context';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import BackgroundSlideshow from './BackgroundSlideshow';

const schema = yup.object({
  email: yup.string().email('Digite um email válido').required('Email é obrigatório'),
  password: yup.string().required('Senha é obrigatória'),
});

interface LoginFormData {
  email: string;
  password: string;
}

const LoginFormNew: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginError, setLoginError] = useState<string>('');

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoginError('');
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (error: any) {
      setLoginError(error.response?.data?.detail || 'Erro ao fazer login');
    }
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      <BackgroundSlideshow />
      <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ mt: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              color: '#fff',
              backdropFilter: 'blur(20px) brightness(200%)',
              WebkitBackdropFilter: 'blur(20px) brightness(200%)',
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderRadius: '20px',
              border: '1px solid #ffffff',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
            }}
          >
            <Typography component="h1" variant="h4" sx={{ mb: 3, color: '#ffffff', textAlign: 'center' }}>
              Sistemas de Informações CGLIC
            </Typography>

            <Typography component="h2" variant="h5" sx={{ mb: 2, color: '#e9ecef', fontWeight: 700, letterSpacing: 0.3 }}>
              Login
            </Typography>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                autoFocus
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    backgroundColor: 'transparent',
                    '& fieldset': { borderColor: '#fff' },
                    '&:hover fieldset': { borderColor: '#fff' },
                    '&.Mui-focused': { backgroundColor: '#00000040' },
                    '&.Mui-focused fieldset': { borderColor: '#fff' },
                    '& input::placeholder': { color: '#fff', opacity: 1 },
                  },
                  '& .MuiInputLabel-root': { color: '#fff' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#fff' },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Senha"
                type="password"
                id="password"
                autoComplete="current-password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    backgroundColor: 'transparent',
                    '& fieldset': { borderColor: '#fff' },
                    '&:hover fieldset': { borderColor: '#fff' },
                    '&.Mui-focused': { backgroundColor: '#00000040' },
                    '&.Mui-focused fieldset': { borderColor: '#fff' },
                    '& input::placeholder': { color: '#fff', opacity: 1 },
                  },
                  '& .MuiInputLabel-root': { color: '#fff' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#fff' },
                }}
              />

              {loginError && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {loginError}
                </Typography>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  '&:hover': { backgroundColor: '#f1f3f5' },
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  borderRadius: '8px',
                }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Entrar'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2">
                  Não possui uma conta?{' '}
                  <Link to="/register" style={{ color: '#e9ecef', textDecoration: 'none', fontWeight: 600 }}>
                    Criar Conta
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginFormNew;
