import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Container,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  TextField,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { accessRequestService } from '../../services/access-request.service';

interface PostRegistrationQuestionnaireProps {
  onComplete: () => void;
}

interface AccessRequestData {
  trabalha_cglic: boolean;
  nivel_solicitado: string;
  justificativa?: string;
}

const PostRegistrationQuestionnaire: React.FC<PostRegistrationQuestionnaireProps> = ({
  onComplete,
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [trabalhaCGLIC, setTrabalhaCGLIC] = useState<string>('');
  const [nivelSolicitado, setNivelSolicitado] = useState<string>('');
  const [justificativa, setJustificativa] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleCGLICResponse = () => {
    if (trabalhaCGLIC === 'nao') {
      // Se não trabalha na CGLIC, finaliza o processo
      setSuccess(true);
      setTimeout(() => {
        onComplete();
        navigate('/login');
      }, 2000);
    } else {
      // Se trabalha na CGLIC, vai para o próximo passo
      setStep(2);
    }
  };

  const handleAccessRequest = async () => {
    if (!nivelSolicitado) {
      setError('Por favor, selecione um nível de acesso.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const requestData: AccessRequestData = {
        trabalha_cglic: true,
        nivel_solicitado: nivelSolicitado,
        justificativa: justificativa.trim() || undefined,
      };

      await accessRequestService.createRequest(requestData);
      setSuccess(true);

      // Aguarda 2 segundos e redireciona
      setTimeout(() => {
        onComplete();
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      setError(
        error.response?.data?.detail ||
        'Erro ao enviar requisição de acesso. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Container component="main" maxWidth="sm">
          <Box
            sx={{
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
              {trabalhaCGLIC === 'nao'
                ? 'Conta criada com sucesso! Você pode acessar o sistema como visitante.'
                : 'Requisição de acesso enviada com sucesso! Um administrador irá analisar sua solicitação em breve.'
              }
            </Alert>
            <Typography variant="body2" align="center" sx={{ mt: 1 }}>
              Redirecionando para login...
            </Typography>
          </Paper>
        </Box>
      </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
          <Typography component="h1" variant="h4" sx={{ mb: 1.5, color: '#004085', fontSize: '1.75rem' }}>
            Configuração de Acesso
          </Typography>

          {step === 1 && (
            <>
              <Typography component="h2" variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
                Para configurar seu nível de acesso adequado, precisamos saber:
              </Typography>

              <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
                <FormLabel component="legend" sx={{ mb: 2, fontSize: '1.1rem' }}>
                  Você trabalha na CGLIC (Coordenação-Geral de Licitações e Contratações)?
                </FormLabel>
                <RadioGroup
                  value={trabalhaCGLIC}
                  onChange={(e) => setTrabalhaCGLIC(e.target.value)}
                  sx={{ ml: 2 }}
                >
                  <FormControlLabel
                    value="sim"
                    control={<Radio />}
                    label="Sim, trabalho na CGLIC"
                  />
                  <FormControlLabel
                    value="nao"
                    control={<Radio />}
                    label="Não, não trabalho na CGLIC"
                  />
                </RadioGroup>
              </FormControl>

              {trabalhaCGLIC === 'nao' && (
                <Alert severity="info" sx={{ mb: 3, width: '100%' }}>
                  Como você não trabalha na CGLIC, sua conta será criada com acesso de VISITANTE.
                  Você poderá visualizar os dados do sistema, mas não poderá editá-los.
                </Alert>
              )}

              {trabalhaCGLIC === 'sim' && (
                <Alert severity="info" sx={{ mb: 3, width: '100%' }}>
                  Como você trabalha na CGLIC, poderá solicitar um nível de acesso específico
                  que será analisado por um administrador.
                </Alert>
              )}

              <Button
                variant="contained"
                onClick={handleCGLICResponse}
                disabled={!trabalhaCGLIC}
                sx={{ mt: 2, minWidth: 200 }}
              >
                Continuar
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Typography component="h2" variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
                Solicitação de Nível de Acesso
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Nível de Acesso Solicitado</InputLabel>
                <Select
                  value={nivelSolicitado}
                  onChange={(e) => setNivelSolicitado(e.target.value)}
                  label="Nível de Acesso Solicitado"
                >
                  <MenuItem value="COORDENADOR">COORDENADOR - Acesso total ao sistema</MenuItem>
                  <MenuItem value="DIPLAN">DIPLAN - Módulo de Planejamento</MenuItem>
                  <MenuItem value="DIQUALI">DIQUALI - Módulo de Qualificação</MenuItem>
                  <MenuItem value="DIPLI">DIPLI - Módulo de Licitação</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Justificativa (opcional)"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Descreva brevemente por que você precisa deste nível de acesso..."
                sx={{ mb: 3 }}
              />

              <Alert severity="warning" sx={{ mb: 3, width: '100%' }}>
                Sua solicitação será analisada por um administrador. Enquanto isso,
                você terá acesso como VISITANTE (somente leitura).
              </Alert>

              {error && (
                <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleAccessRequest}
                  disabled={loading || !nivelSolicitado}
                  sx={{ minWidth: 150 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Enviar Solicitação'}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
    </Box>
  );
};

export default PostRegistrationQuestionnaire;