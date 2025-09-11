import { api } from './api';
import { Licitacao, LicitacaoStats } from '../types';

export const licitacaoService = {
  async getAll(skip = 0, limit = 100): Promise<Licitacao[]> {
    const response = await api.get<Licitacao[]>(`/api/v1/licitacao?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async getById(id: string): Promise<Licitacao> {
    const response = await api.get<Licitacao>(`/api/v1/licitacao/${id}`);
    return response.data;
  },

  async create(licitacao: Omit<Licitacao, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'economia'>): Promise<Licitacao> {
    const response = await api.post<Licitacao>('/api/v1/licitacao', licitacao);
    return response.data;
  },

  async update(id: string, licitacao: Partial<Licitacao>): Promise<Licitacao> {
    const response = await api.put<Licitacao>(`/api/v1/licitacao/${id}`, licitacao);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/v1/licitacao/${id}`);
  },

  async getDashboardStats(): Promise<LicitacaoStats> {
    const response = await api.get<LicitacaoStats>('/api/v1/licitacao/dashboard/stats');
    return response.data;
  },

  async getEconomiaRelatorio(): Promise<{
    licitacoes: Array<{
      nup: string;
      numero_contratacao: string;
      objeto: string;
      valor_estimado: number;
      valor_homologado: number;
      economia: number;
      percentual_economia: number;
    }>;
    total_economia: number;
    total_licitacoes_com_economia: number;
  }> {
    const response = await api.get('/api/v1/licitacao/economia/relatorio');
    return response.data;
  },
};