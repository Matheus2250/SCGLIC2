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
  IconButton,
} from '@mui/material';
import { Close, ContentCopy } from '@mui/icons-material';
import { PCA } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';

interface PCADetailsModalProps {
  open: boolean;
  onClose: () => void;
  pca: PCA | null;
}

const PCADetailsModal: React.FC<PCADetailsModalProps> = ({
  open,
  onClose,
  pca
}) => {
  if (!pca) return null;

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
      return dateString;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copiado para a área de transferência`);
    });
  };

  const DetailRow = ({ label, value, copyable = false }: { 
    label: string; 
    value: string | number | undefined; 
    copyable?: boolean 
  }) => (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} sm={4}>
        <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
          {label}:
        </Typography>
      </Grid>
      <Grid item xs={12} sm={8}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2">
            {value || 'N/A'}
          </Typography>
          {copyable && value && (
            <IconButton 
              size="small" 
              onClick={() => copyToClipboard(String(value), label)}
              title={`Copiar ${label}`}
            >
              <ContentCopy fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Grid>
    </Grid>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Detalhes da Contratação
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ p: 1 }}>
          {/* Header com informações principais */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              {pca.titulo_contratacao || 'Título não informado'}
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Chip 
                label={pca.atrasada ? 'Atrasada' : 'No Prazo'}
                color={pca.atrasada ? 'error' : 'success'}
                size="small"
              />
              {pca.valor_total && (
                <Chip 
                  label={formatCurrency(pca.valor_total)}
                  variant="outlined"
                  color="primary"
                />
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Informações Básicas */}
          <Typography variant="h6" gutterBottom color="primary">
            Informações da Contratação
          </Typography>
          
          <DetailRow 
            label="Número da Contratação" 
            value={pca.numero_contratacao} 
            copyable 
          />
          <DetailRow 
            label="Título da Contratação" 
            value={pca.titulo_contratacao} 
            copyable 
          />
          <DetailRow 
            label="Status da Contratação" 
            value={pca.status_contratacao} 
          />
          <DetailRow 
            label="Situação da Execução" 
            value={pca.situacao_execucao} 
          />
          <DetailRow 
            label="Categoria da Contratação" 
            value={pca.categoria_contratacao} 
          />
          <DetailRow 
            label="Área Requisitante" 
            value={pca.area_requisitante} 
          />
          <DetailRow 
            label="Número DFD" 
            value={pca.numero_dfd} 
          />

          <Divider sx={{ my: 3 }} />

          {/* Informações Financeiras */}
          <Typography variant="h6" gutterBottom color="primary">
            Valor
          </Typography>
          
          <DetailRow 
            label="Valor Total" 
            value={formatCurrency(pca.valor_total)} 
          />

          <Divider sx={{ my: 3 }} />

          {/* Datas */}
          <Typography variant="h6" gutterBottom color="primary">
            Cronograma
          </Typography>
          
          <DetailRow 
            label="Data Estimada de Início" 
            value={formatDate(pca.data_estimada_inicio)} 
          />
          <DetailRow 
            label="Data Estimada de Conclusão" 
            value={formatDate(pca.data_estimada_conclusao)} 
          />
          <DetailRow 
            label="Status do Prazo" 
            value={pca.atrasada ? 'Atrasada' : 'No Prazo'} 
          />

          {/* Metadados */}
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom color="primary">
            Informações do Sistema
          </Typography>
          
          <DetailRow 
            label="ID" 
            value={pca.id} 
            copyable 
          />
          <DetailRow 
            label="Criado em" 
            value={formatDate(pca.created_at)} 
          />
          <DetailRow 
            label="Atualizado em" 
            value={formatDate(pca.updated_at)} 
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={() => copyToClipboard(JSON.stringify(pca, null, 2), 'Dados completos')}
          variant="outlined"
          size="small"
        >
          Copiar JSON
        </Button>
        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PCADetailsModal;