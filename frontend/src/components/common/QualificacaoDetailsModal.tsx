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
} from '@mui/material';
import { Qualificacao } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QualificacaoDetailsModalProps {
  open: boolean;
  onClose: () => void;
  qualificacao: Qualificacao | null;
}

const QualificacaoDetailsModal: React.FC<QualificacaoDetailsModalProps> = ({
  open,
  onClose,
  qualificacao,
}) => {
  if (!qualificacao) {
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
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONCLUIDO':
        return 'success';
      case 'EM ANALISE':
        return 'warning';
      default:
        return 'default';
    }
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
          <Typography variant="h6">Detalhes da Qualificação</Typography>
          <Chip
            label={qualificacao.status}
            color={getStatusColor(qualificacao.status) as any}
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
              {qualificacao.nup || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Número da Contratação
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {qualificacao.numero_contratacao || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Ano
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {qualificacao.ano || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Área Demandante
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {qualificacao.area_demandante || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
              Detalhes da Contratação
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Responsável pela Instrução
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {qualificacao.responsavel_instrucao || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Modalidade
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {qualificacao.modalidade || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">
              Objeto
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {qualificacao.objeto || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Palavra-chave
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {qualificacao.palavra_chave || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Valor Estimado
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold', color: 'success.main' }}>
              {formatCurrency(qualificacao.valor_estimado)}
            </Typography>
          </Grid>

          {qualificacao.observacoes && (
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
                  {qualificacao.observacoes}
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
              {formatDate(qualificacao.created_at)}
            </Typography>
          </Grid>

          {qualificacao.updated_at && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Última Atualização
              </Typography>
              <Typography variant="body2">
                {formatDate(qualificacao.updated_at)}
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

export default QualificacaoDetailsModal;