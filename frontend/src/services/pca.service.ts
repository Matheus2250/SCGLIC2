import { api } from './api';
import { PCA, DashboardStats } from '../types';

export const pcaService = {
  async getAll(skip = 0, limit = 100, ano?: number): Promise<PCA[]> {
    const anoParam = ano && ano >= 2000 && ano <= 2100 ? `&ano=${ano}` : '';
    const response = await api.get<PCA[]>(`/api/v1/pca?skip=${skip}&limit=${limit}${anoParam}`);
    return response.data;
  },

  async getById(id: string): Promise<PCA> {
    const response = await api.get<PCA>(`/api/v1/pca/${id}`);
    return response.data;
  },

  async create(pca: Omit<PCA, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'atrasada'>): Promise<PCA> {
    const response = await api.post<PCA>('/api/v1/pca', pca);
    return response.data;
  },

  async update(id: string, pca: Partial<PCA>): Promise<PCA> {
    const response = await api.put<PCA>(`/api/v1/pca/${id}`, pca);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/v1/pca/${id}`);
  },

  async importExcel(file: File, ano?: number): Promise<{ message: string; errors?: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    if (ano && ano >= 2000 && ano <= 2100) {
      formData.append('ano', String(ano));
    }

    const response = await api.post('/api/v1/pca/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async importCsv(file: File, ano?: number): Promise<{ message: string; errors?: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    if (ano && ano >= 2000 && ano <= 2100) {
      formData.append('ano', String(ano));
    }

    const response = await api.post('/api/v1/pca/import-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/api/v1/pca/dashboard/stats');
    return response.data;
  },

  async getAtrasadas(): Promise<PCA[]> {
    const response = await api.get<PCA[]>('/api/v1/pca/atrasadas');
    return response.data;
  },

  async getVencidas(): Promise<PCA[]> {
    const response = await api.get<PCA[]>('/api/v1/pca/vencidas');
    return response.data;
  },

  async getDashboardCharts(): Promise<{
    situacao_execucao: { name: string; value: number }[];
    categoria: { name: string; value: number }[];
    status_contratacao: { name: string; value: number }[];
    valor_por_categoria: { name: string; value: number }[];
  }> {
    const response = await api.get('/api/v1/pca/dashboard/charts');
    return response.data;
  },
};
