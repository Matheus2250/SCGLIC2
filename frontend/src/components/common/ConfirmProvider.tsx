import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  // For future style variations per action (e.g., error/success)
  // color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
};

type ConfirmContextType = {
  confirm: (options?: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const resolverRef = useRef<(value: boolean) => void>();

  const confirm = useCallback((opts?: ConfirmOptions) => {
    setOptions({
      title: 'Confirmação',
      description: 'Tem certeza que deseja prosseguir?',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      ...(opts || {}),
    });
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setLoading(false);
    resolverRef.current?.(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      setLoading(true);
      resolverRef.current?.(true);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={open}
        title={options.title}
        description={options.description}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        loading={loading}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirmContext = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirmContext must be used within a ConfirmProvider');
  }
  return ctx;
};

