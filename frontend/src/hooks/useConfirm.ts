import { useConfirmContext } from '../components/common/ConfirmProvider';

export type UseConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

export const useConfirm = () => {
  const { confirm } = useConfirmContext();
  return confirm;
};

