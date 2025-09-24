import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authService } from '../../services/auth.service';
import { useNavigate, Link } from 'react-router-dom';

const schema = yup.object({
  username: yup.string().required('Username é obrigatório').min(3, 'Username deve ter pelo menos 3 caracteres'),
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  nome_completo: yup.string().required('Nome completo é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
  password: yup.string().required('Senha é obrigatória').min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: yup.string()
    .required('Confirmação de senha é obrigatória')
    .oneOf([yup.ref('password')], 'Senhas devem ser iguais'),
  nivel_acesso: yup.string().required('Nível de acesso é obrigatório'),
});

interface RegisterFormData {
  username: string;
  email: string;
  nome_completo: string;
  password: string;
  confirmPassword: string;
  nivel_acesso: string;
}


const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string>('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setRegisterError('');
      
      const userData = {
        username: data.username,
        email: data.email,
        nome_completo: data.nome_completo,
        password: data.password,
        nivel_acesso: data.nivel_acesso,
      };

      await authService.register(userData);
      setRegisterSuccess(true);
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error: any) {
      setRegisterError(
        error.response?.data?.detail || 
        'Erro ao criar conta. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (registerSuccess) {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              Conta criada com sucesso! Redirecionando para login...
            </Alert>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h4" sx={{ mb: 2, color: '#004085' }}>
            Sistema de Contratações
          </Typography>
          
          <Typography component="h2" variant="h5" sx={{ mb: 3 }}>
            Criar Nova Conta
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              autoComplete="username"
              autoFocus
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="nome_completo"
              label="Nome Completo"
              autoComplete="name"
              {...register('nome_completo')}
              error={!!errors.nome_completo}
              helperText={errors.nome_completo?.message}
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Nível de Acesso</InputLabel>
              <Select
                {...register('nivel_acesso')}
                error={!!errors.nivel_acesso}
                label="Nível de Acesso"
                defaultValue=""
              >
                <MenuItem value="COORDENADOR">COORDENADOR (Administrador)</MenuItem>
                <MenuItem value="DIPLAN">DIPLAN (Planejamento)</MenuItem>
                <MenuItem value="DIQUALI">DIQUALI (Qualificação)</MenuItem>
                <MenuItem value="DIPLI">DIPLI (Licitação)</MenuItem>
                <MenuItem value="VISITANTE">VISITANTE (Apenas Leitura)</MenuItem>
              </Select>
              {errors.nivel_acesso && (
                <Typography color="error" variant="caption" sx={{ mt: 1, ml: 2 }}>
                  {errors.nivel_acesso.message}
                </Typography>
              )}
            </FormControl>

            <TextField
              margin="normal"
              required
              fullWidth
              label="Senha"
              type="password"
              id="password"
              autoComplete="new-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirmar Senha"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />

            {registerError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {registerError}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Criar Conta'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Já possui uma conta?{' '}
                <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none' }}>
                  Fazer Login
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterForm;