import { useState, useEffect } from 'react';
import { accessRequestService } from '../services/access-request.service';
import { useAuth } from '../store/auth.context';

export const usePendingRequests = () => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  const fetchPendingCount = async () => {
    try {
      // Só buscar se for COORDENADOR
      if (user?.nivel_acesso === 'COORDENADOR') {
        const pendingRequests = await accessRequestService.getPendingRequests();
        setPendingCount(pendingRequests.length);
      } else {
        setPendingCount(0);
      }
    } catch (error) {
      console.error('Erro ao buscar requisições pendentes:', error);
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPendingCount();
      // Atualizar a cada 30 segundos
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return { pendingCount, loading, refetch: fetchPendingCount };
};