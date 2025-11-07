import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Tooltip,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import ConfirmDialog from '../components/common/ConfirmDialog';
import {
  Edit,
  Delete,
  PersonAdd,
  AdminPanelSettings,
} from '@mui/icons-material';
import { userService, UsuarioUpdate } from '../services/user.service';
import { authService } from '../services/auth.service';
import { Usuario } from '../types';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);

  // Confirm dialog states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetUser, setConfirmTargetUser] = useState<Usuario | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('Confirmar exclusão');
  const [confirmDescription, setConfirmDescription] = useState('Tem certeza que deseja excluir este usuário?');

  // Estados para modal de edição
  const [editDialog, setEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [editForm, setEditForm] = useState<UsuarioUpdate>({});

  // Estados para modal de criação
  const [createDialog, setCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    nome_completo: '',
    nivel_acesso: 'VISITANTE',
    ativo: true,
  });

  const nivelAccessoOptions = [
    { value: 'COORDENADOR', label: 'Coordenador', color: 'error' },
    { value: 'DIPLAN', label: 'DIPLAN', color: 'primary' },
    { value: 'DIQUALI', label: 'DIQUALI', color: 'secondary' },
    { value: 'DIPLI', label: 'DIPLI', color: 'warning' },
    { value: 'VISITANTE', label: 'Visitante', color: 'default' },
  ];

  useEffect(() => {
    fetchCurrentUser();
    fetchUsuarios();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const user = await authService.getMe();
      setCurrentUser(user);
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error);
    }
  };

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
      console.error(error);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: Usuario) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      nome_completo: user.nome_completo,
      nivel_acesso: user.nivel_acesso,
      ativo: user.ativo,
    });
    setEditDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await userService.updateUser(selectedUser.id, editForm);
      toast.success('Usuário atualizado com sucesso!');
      setEditDialog(false);
      fetchUsuarios();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar usuário');
    }
  };

  const handleDeleteUser = (user: Usuario) => {
    if (user.id === currentUser?.id) {
      toast.error('Você não pode excluir sua própria conta');
      return;
    }
    setConfirmTargetUser(user);
    setConfirmTitle('Excluir usuário');
    setConfirmDescription(`Tem certeza que deseja excluir o usuário "${user.nome_completo}"? Essa ação não poderá ser desfeita.`);
    setConfirmOpen(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!confirmTargetUser) return;
    setConfirmLoading(true);
    try {
      await userService.deleteUser(confirmTargetUser.id);
      toast.success('Usuário excluído com sucesso!');
      fetchUsuarios();
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Erro ao excluir usuário';
      toast.error(errorMessage);
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setConfirmTargetUser(null);
    }
  };

  const handleCreateUser = async () => {
    try {
      await authService.register(createForm);
      toast.success('Usuário criado com sucesso!');
      setCreateDialog(false);
      setCreateForm({
        username: '',
        email: '',
        password: '',
        nome_completo: '',
        nivel_acesso: 'VISITANTE',
        ativo: true,
      });
      fetchUsuarios();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao criar usuário');
    }
  };

  const getNivelAccessoLabel = (nivel: string) => {
    return nivelAccessoOptions.find(option => option.value === nivel)?.label || nivel;
  };

  const getNivelAccessoColor = (nivel: string): any => {
    return nivelAccessoOptions.find(option => option.value === nivel)?.color || 'default';
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  // Verificar se o usuário atual é administrador
  if (currentUser && currentUser.nivel_acesso !== 'COORDENADOR') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Acesso negado. Apenas usuários com nível COORDENADOR podem acessar esta página.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Carregando usuários...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <AdminPanelSettings color="primary" />
          <Typography variant="h4">
            Administração de Usuários
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setCreateDialog(true)}
        >
          Novo Usuário
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Você está visualizando esta página como <strong>COORDENADOR</strong>.
        Apenas usuários com este nível podem gerenciar outros usuários.
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome Completo</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Nível de Acesso</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Criado em</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {usuario.nome_completo}
                  </Typography>
                </TableCell>
                <TableCell>{usuario.username}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>
                  <Chip
                    label={getNivelAccessoLabel(usuario.nivel_acesso)}
                    color={getNivelAccessoColor(usuario.nivel_acesso)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={usuario.ativo ? 'Ativo' : 'Inativo'}
                    color={usuario.ativo ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(usuario.created_at)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Editar usuário">
                    <IconButton
                      size="small"
                      onClick={() => handleEditUser(usuario)}
                      color="primary"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {usuario.id !== currentUser?.id && (
                    <Tooltip title="Excluir usuário">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(usuario)}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de Edição */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Usuário</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Completo"
                value={editForm.nome_completo || ''}
                onChange={(e) => setEditForm({ ...editForm, nome_completo: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Username"
                value={editForm.username || ''}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Nível de Acesso</InputLabel>
                <Select
                  value={editForm.nivel_acesso || ''}
                  onChange={(e) => setEditForm({ ...editForm, nivel_acesso: e.target.value })}
                  label="Nível de Acesso"
                >
                  {nivelAccessoOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editForm.ativo || false}
                    onChange={(e) => setEditForm({ ...editForm, ativo: e.target.checked })}
                  />
                }
                label="Usuário Ativo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancelar</Button>
          <Button onClick={handleUpdateUser} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Criação */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Usuário</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Completo"
                value={createForm.nome_completo}
                onChange={(e) => setCreateForm({ ...createForm, nome_completo: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Username"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Senha"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Nível de Acesso</InputLabel>
                <Select
                  value={createForm.nivel_acesso}
                  onChange={(e) => setCreateForm({ ...createForm, nivel_acesso: e.target.value })}
                  label="Nível de Acesso"
                >
                  {nivelAccessoOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={createForm.ativo}
                    onChange={(e) => setCreateForm({ ...createForm, ativo: e.target.checked })}
                  />
                }
                label="Usuário Ativo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateUser} variant="contained">
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        loading={confirmLoading}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleConfirmDeleteUser}
        onClose={() => setConfirmOpen(false)}
      />
    </Box>
  );
};

export default AdminUsuarios;
