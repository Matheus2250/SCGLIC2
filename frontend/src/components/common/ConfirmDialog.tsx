import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, CircularProgress } from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = 'Confirmação',
  description = 'Tem certeza que deseja prosseguir?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  loading = false,
  onConfirm,
  onClose,
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (e) {
      // onConfirm should handle errors and toasts; swallow here
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body1">{description}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{cancelText}</Button>
        <Button variant="contained" color="error" onClick={handleConfirm} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : null}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
