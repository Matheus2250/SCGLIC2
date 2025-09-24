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
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { accessRequestService, AccessRequestListItem, AccessRequest } from '../services/access-request.service';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const GerenciarUsuarios: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<AccessRequestListItem[]>([]);
  const [allRequests, setAllRequests] = useState<AccessRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'view'>('view');
  const [adminObservations, setAdminObservations] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');

      const [pending, all] = await Promise.all([
        accessRequestService.getPendingRequests(),
        accessRequestService.getAllRequests(0, 100)
      ]);

      setPendingRequests(pending);
      setAllRequests(all);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar requisições');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = async (requestId: string) => {
    try {
      const request = await accessRequestService.getRequestDetails(requestId);
      setSelectedRequest(request);
      setActionType('view');
      setAdminObservations('');
      setDialogOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar detalhes da requisição');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const request = await accessRequestService.getRequestDetails(requestId);
      setSelectedRequest(request);
      setActionType('approve');
      setAdminObservations('');
      setDialogOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar requisição');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const request = await accessRequestService.getRequestDetails(requestId);
      setSelectedRequest(request);
      setActionType('reject');
      setAdminObservations('');
      setDialogOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar requisição');
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);

      if (actionType === 'approve') {
        await accessRequestService.approveRequest(selectedRequest.id, adminObservations);
      } else if (actionType === 'reject') {
        await accessRequestService.rejectRequest(selectedRequest.id, adminObservations);
      }

      setDialogOpen(false);
      await loadRequests();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao processar requisição');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'warning';
      case 'APROVADA': return 'success';
      case 'REJEITADA': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'Pendente';
      case 'APROVADA': return 'Aprovada';
      case 'REJEITADA': return 'Rejeitada';
      default: return status;
    }
  };

  const renderRequestsTable = (requests: AccessRequestListItem[], showActions = false) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Usuário</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Nível Solicitado</TableCell>
            <TableCell>Trabalha na CGLIC</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Data</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.user_nome}</TableCell>
              <TableCell>{request.user_email}</TableCell>
              <TableCell>{request.nivel_solicitado}</TableCell>
              <TableCell>
                <Chip
                  label={request.trabalha_cglic ? 'Sim' : 'Não'}
                  color={request.trabalha_cglic ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={getStatusText(request.status)}
                  color={getStatusColor(request.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {new Date(request.created_at).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Visualizar detalhes">
                    <IconButton
                      size="small"
                      onClick={() => handleViewRequest(request.id)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  {showActions && request.status === 'PENDENTE' && (
                    <>
                      <Tooltip title="Aprovar">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleApproveRequest(request.id)}
                        >
                          <CheckIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rejeitar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {requests.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                Nenhuma requisição encontrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gerenciar Usuários
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`Requisições Pendentes (${pendingRequests.length})`} />
          <Tab label={`Todas as Requisições (${allRequests.length})`} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {renderRequestsTable(pendingRequests, true)}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderRequestsTable(allRequests)}
        </TabPanel>
      </Paper>

      {/* Dialog for request details and actions */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {actionType === 'view' && 'Detalhes da Requisição'}
          {actionType === 'approve' && 'Aprovar Requisição'}
          {actionType === 'reject' && 'Rejeitar Requisição'}
        </DialogTitle>

        <DialogContent>
          {selectedRequest && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Usuário"
                value={selectedRequest.user_nome || ''}
                disabled
                fullWidth
              />

              <TextField
                label="Email"
                value={selectedRequest.user_email || ''}
                disabled
                fullWidth
              />

              <TextField
                label="Nível Solicitado"
                value={selectedRequest.nivel_solicitado}
                disabled
                fullWidth
              />

              <TextField
                label="Trabalha na CGLIC"
                value={selectedRequest.trabalha_cglic ? 'Sim' : 'Não'}
                disabled
                fullWidth
              />

              {selectedRequest.justificativa && (
                <TextField
                  label="Justificativa"
                  value={selectedRequest.justificativa}
                  disabled
                  multiline
                  rows={3}
                  fullWidth
                />
              )}

              <TextField
                label="Status"
                value={getStatusText(selectedRequest.status)}
                disabled
                fullWidth
              />

              <TextField
                label="Data da Solicitação"
                value={new Date(selectedRequest.created_at).toLocaleString('pt-BR')}
                disabled
                fullWidth
              />

              {selectedRequest.observacoes_admin && (
                <TextField
                  label="Observações do Administrador"
                  value={selectedRequest.observacoes_admin}
                  disabled
                  multiline
                  rows={2}
                  fullWidth
                />
              )}

              {selectedRequest.aprovado_por_nome && (
                <TextField
                  label="Aprovado/Rejeitado por"
                  value={selectedRequest.aprovado_por_nome}
                  disabled
                  fullWidth
                />
              )}

              {(actionType === 'approve' || actionType === 'reject') && (
                <TextField
                  label="Observações (opcional)"
                  value={adminObservations}
                  onChange={(e) => setAdminObservations(e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Adicione observações sobre sua decisão..."
                />
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={processing}>
            {actionType === 'view' ? 'Fechar' : 'Cancelar'}
          </Button>

          {actionType === 'approve' && (
            <Button
              onClick={handleConfirmAction}
              color="success"
              variant="contained"
              disabled={processing}
            >
              {processing ? <CircularProgress size={24} /> : 'Aprovar'}
            </Button>
          )}

          {actionType === 'reject' && (
            <Button
              onClick={handleConfirmAction}
              color="error"
              variant="contained"
              disabled={processing}
            >
              {processing ? <CircularProgress size={24} /> : 'Rejeitar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GerenciarUsuarios;