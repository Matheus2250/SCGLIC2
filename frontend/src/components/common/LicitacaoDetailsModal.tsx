import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  Divider,
  Link,
} from '@mui/material';
import { Licitacao } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LicitacaoDetailsModalProps {
  open: boolean;
  onClose: () => void;
  licitacao: Licitacao | null;
}

const LicitacaoDetailsModal: React.FC<LicitacaoDetailsModalProps> = ({
  open,
  onClose,
  licitacao,
}) => {
  if (!licitacao) {
    return null;
  }

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HOMOLOGADA':
        return 'success';
      case 'EM ANDAMENTO':
        return 'info';
      case 'FRACASSADA':
        return 'error';
      case 'REVOGADA':
        return 'warning';
      default:
        return 'default';
    }
  };

  const calcularEconomiaPercentual = () => {
    if (licitacao.valor_estimado && licitacao.economia) {
      return ((licitacao.economia / licitacao.valor_estimado) * 100).toFixed(2);
    }
    return 0;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Detalhes da Licitação</Typography>
          <Chip
            label={licitacao.status}
            color={getStatusColor(licitacao.status) as any}
            variant="outlined"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Informações Básicas */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
              Informações Básicas
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              NUP
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {licitacao.nup || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Número da Contratação
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {licitacao.numero_contratacao || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Ano
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {licitacao.ano || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Área Demandante
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {licitacao.area_demandante || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
              Detalhes da Licitação
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Responsável pela Instrução
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {licitacao.responsavel_instrucao || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Modalidade
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {licitacao.modalidade || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">
              Objeto
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {licitacao.objeto || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Palavra-chave
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {licitacao.palavra_chave || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Pregoeiro
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {licitacao.pregoeiro || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
              Valores e Economia
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="textSecondary">
              Valor Estimado
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold', color: 'info.main' }}>
              {formatCurrency(licitacao.valor_estimado)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="textSecondary">
              Valor Homologado
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold', color: 'success.main' }}>
              {formatCurrency(licitacao.valor_homologado)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="textSecondary">
              Economia
            </Typography>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {formatCurrency(licitacao.economia)}
              </Typography>
              {licitacao.economia && licitacao.valor_estimado && (
                <Typography variant="body2" color="textSecondary">
                  ({calcularEconomiaPercentual()}% de economia)
                </Typography>
              )}
            </Box>
          </Grid>

          {licitacao.data_homologacao && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Data de Homologação
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {formatDate(licitacao.data_homologacao)}
              </Typography>
            </Grid>
          )}

          {licitacao.link && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Link
              </Typography>
              <Link
                href={licitacao.link}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ mb: 2, display: 'block' }}
              >
                Abrir link da licitação
              </Link>
            </Grid>
          )}

          {licitacao.observacoes && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">
                Observações
              </Typography>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: 'grey.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}
              >
                <Typography variant="body1">
                  {licitacao.observacoes}
                </Typography>
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
              Informações do Sistema
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Data de Criação
            </Typography>
            <Typography variant="body2">
              {formatDateTime(licitacao.created_at)}
            </Typography>
          </Grid>

          {licitacao.updated_at && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Última Atualização
              </Typography>
              <Typography variant="body2">
                {formatDateTime(licitacao.updated_at)}
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LicitacaoDetailsModal;