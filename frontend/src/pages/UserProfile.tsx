import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Grid, Avatar, Divider, Alert, CircularProgress, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useAuth } from '../store/auth.context';
import { profileService } from '../services/profile.service';
import { userService } from '../services/user.service';
import { accessRequestService } from '../services/access-request.service';
import { toast } from 'react-toastify';

const levels = [
  { value: 'COORDENADOR', label: 'COORDENADOR' },
  { value: 'DIPLAN', label: 'DIPLAN' },
  { value: 'DIQUALI', label: 'DIQUALI' },
  { value: 'DIPLI', label: 'DIPLI' },
  { value: 'VISITANTE', label: 'VISITANTE' },
];

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [nivelSolicitado, setNivelSolicitado] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    if (user) {
      setNome(user.nome_completo || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const initials = useMemo(() => {
    const parts = (nome || user?.nome_completo || '').split(' ').filter(Boolean);
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
  }, [nome, user]);

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      // Tenta endpoint de perfil; se falhar com 404/405, tenta admin PUT como fallback
      try {
        await profileService.updateMe({ nome_completo: nome.trim(), email: email.trim() });
      } catch (err: any) {
        if (user?.id) {
          await userService.updateUser(user.id, { nome_completo: nome.trim(), email: email.trim() });
        } else {
          throw err;
        }
      }
      toast.success('Perfil atualizado com sucesso');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPass || !newPass) {
      toast.error('Preencha as senhas');
      return;
    }
    if (newPass !== confirmPass) {
      toast.error('A confirmação não coincide');
      return;
    }
    try {
      setSavingPass(true);
      await profileService.changePassword({ current_password: currentPass, new_password: newPass });
      toast.success('Senha atualizada com sucesso');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao alterar senha');
    } finally {
      setSavingPass(false);
    }
  };

  const handleAvatarFile = (file?: File) => {
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const toAbsolute = (url?: string | null) => {
    if (!url) return undefined;
    if (/^https?:\/\//i.test(url)) return url as string;
    const base = import.meta.env.VITE_API_URL || '';
    return `${base}${(url as string).startsWith('/') ? url : `/${url}`}`;
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) {
      toast.error('Selecione uma imagem');
      return;
    }
    try {
      setUploadingAvatar(true);
      const res = await profileService.uploadAvatar(avatarFile);
      if (res?.avatar_url) {
        const abs = toAbsolute(res.avatar_url);
        setAvatarPreview(abs || null);
        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.avatar_url = res.avatar_url; // manter relativo
            localStorage.setItem('user', JSON.stringify(parsed));
          }
        } catch { /* ignore */ }
        toast.success('Foto atualizada');
      } else {
        toast.success('Upload realizado');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao enviar foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSendAccessRequest = async () => {
    if (!nivelSolicitado) {
      toast.error('Selecione o nível solicitado');
      return;
    }
    try {
      setSendingRequest(true);
      await accessRequestService.createRequest({
        trabalha_cglic: true,
        nivel_solicitado: nivelSolicitado,
        justificativa: justificativa.trim() || undefined,
      });
      toast.success('Solicitação enviada para análise');
      setNivelSolicitado('');
      setJustificativa('');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao enviar solicitação');
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Meu Perfil</Typography>

      <Grid container spacing={3}>
        {/* Foto de Perfil */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Foto de Perfil</Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar src={avatarPreview || (user?.avatar_url ? (toAbsolute(user.avatar_url)) : undefined)} sx={{ width: 80, height: 80, fontSize: 28 }}>
                {initials}
              </Avatar>
              <Box>
                <Button variant="outlined" component="label" sx={{ mr: 1 }}>
                  Selecionar
                  <input hidden type="file" accept="image/*" onChange={(e) => handleAvatarFile(e.target.files?.[0] || undefined)} />
                </Button>
                <Button variant="contained" onClick={handleUploadAvatar} disabled={uploadingAvatar || !avatarFile}>
                  {uploadingAvatar ? <CircularProgress size={20} /> : 'Enviar'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Dados Pessoais */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Dados Pessoais</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField label="Nome completo" fullWidth value={nome} onChange={(e) => setNome(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? <CircularProgress size={20} /> : 'Salvar alterações'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Alteração de Senha */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Alterar Senha</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Senha atual" type="password" fullWidth value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Nova senha" type="password" fullWidth value={newPass} onChange={(e) => setNewPass(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Confirmar nova senha" type="password" fullWidth value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" onClick={handleChangePassword} disabled={savingPass}>
                {savingPass ? <CircularProgress size={20} /> : 'Atualizar senha'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Requisição de alteração de cargo */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Solicitar Alteração de Cargo</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Seu nível atual: <b>{user?.nivel_acesso || '—'}</b>. A solicitação será analisada por um administrador.
            </Alert>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Nível solicitado</InputLabel>
              <Select value={nivelSolicitado} label="Nível solicitado" onChange={(e) => setNivelSolicitado(e.target.value)}>
                {levels.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Justificativa (opcional)"
              fullWidth
              multiline
              rows={4}
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
            />
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" onClick={handleSendAccessRequest} disabled={sendingRequest || !nivelSolicitado}>
                {sendingRequest ? <CircularProgress size={20} /> : 'Enviar solicitação'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserProfile;
