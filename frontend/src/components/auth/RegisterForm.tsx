import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Container, CircularProgress, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authService } from '../../services/auth.service';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../store/auth.context';
import PostRegistrationQuestionnaire from './PostRegistrationQuestionnaire';
import BackgroundSlideshow from './BackgroundSlideshow';

interface RegisterFormData {
  username: string;
  email: string;
  nome_completo: string;
  password: string;
  confirmPassword: string;
}

const schema: yup.ObjectSchema<RegisterFormData> = yup.object().shape({
  username: yup.string().required('Username é obrigatório').min(3, 'Username deve ter pelo menos 3 caracteres'),
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  nome_completo: yup.string().required('Nome completo é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
  password: yup.string().required('Senha é obrigatória').min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: yup.string().required('Confirmação de senha é obrigatória').oneOf([yup.ref('password')], 'Senhas devem ser iguais'),
});

const inputSx = {
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
};

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string>('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({ resolver: yupResolver(schema) as any });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setRegisterError('');
      const userData = { username: data.username, email: data.email, nome_completo: data.nome_completo, password: data.password, nivel_acesso: 'VISITANTE' };
      await authService.register(userData);
      const loginResponse = await authService.login({ username: data.email, password: data.password });
      login(loginResponse.access_token);
      setRegisterSuccess(true);
      setTimeout(() => setShowQuestionnaire(true), 2000);
    } catch (error: any) {
      setRegisterError(error.response?.data?.detail || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (registerSuccess && showQuestionnaire) {
    return (
      <PostRegistrationQuestionnaire onComplete={() => { setShowQuestionnaire(false); navigate('/login'); }} />
    );
  }

  if (registerSuccess) {
    return (
      <Box sx={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <BackgroundSlideshow />
        <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
          <Box>
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', color: '#fff', backdropFilter: 'blur(16px) saturate(130%)', WebkitBackdropFilter: 'blur(16px) saturate(130%)', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.5)' }}>
              <Typography variant="h5" gutterBottom>
                Conta criada com sucesso!
              </Typography>
              <Typography variant="body2" color="#e9ecef">
                Aguarde, redirecionando para o questionário...
              </Typography>
            </Paper>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <BackgroundSlideshow />
      <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Paper elevation={0} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', color: '#fff', backdropFilter: 'blur(16px) saturate(130%)', WebkitBackdropFilter: 'blur(16px) saturate(130%)', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 12px 40px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <Typography component="h1" variant="h4" sx={{ mb: 1, color: '#ffffff', textAlign: 'center', fontSize: '1.75rem' }}>
              Sistemas de Informações CGLIC
            </Typography>
            <Typography component="h2" variant="h5" sx={{ mb: 2, color: '#e9ecef', fontWeight: 700, letterSpacing: 0.3, fontSize: '1.35rem' }}>
              Criar Nova Conta
            </Typography>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
              <TextField margin="normal" required fullWidth id="username" label="Username" autoComplete="username" {...register('username')} error={!!errors.username} helperText={errors.username?.message} variant="outlined" sx={inputSx} />
              <TextField margin="normal" required fullWidth id="email" label="Email" type="email" autoComplete="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} variant="outlined" sx={inputSx} />
              <TextField margin="normal" required fullWidth id="nome_completo" label="Nome Completo" autoComplete="name" {...register('nome_completo')} error={!!errors.nome_completo} helperText={errors.nome_completo?.message} variant="outlined" sx={inputSx} />
              <TextField margin="normal" required fullWidth label="Senha" type="password" id="password" autoComplete="new-password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} variant="outlined" sx={inputSx} />
              <TextField margin="normal" required fullWidth label="Confirmar Senha" type="password" id="confirmPassword" autoComplete="new-password" {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} variant="outlined" sx={inputSx} />

              {registerError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {registerError}
                </Alert>
              )}

              <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, backgroundColor: '#ffffff', color: '#000000', '&:hover': { backgroundColor: '#f1f3f5' }, textTransform: 'uppercase', fontWeight: 'bold', fontSize: '14px', borderRadius: '8px' }} disabled={isLoading}>
                {isLoading ? <CircularProgress size={24} /> : 'Criar Conta'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#e9ecef' }}>
                  Já possui uma conta?{' '}
                  <Link to="/login" style={{ color: '#e9ecef', textDecoration: 'none', fontWeight: 600 }}>
                    Fazer Login
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

export default RegisterForm;
