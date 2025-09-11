import { api } from './api';
import { Qualificacao } from '../types';

export const qualificacaoService = {
  async getAll(skip = 0, limit = 100): Promise<Qualificacao[]> {
    const response = await api.get<Qualificacao[]>(`/api/v1/qualificacao?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async getById(id: string): Promise<Qualificacao> {
    const response = await api.get<Qualificacao>(`/api/v1/qualificacao/${id}`);
    return response.data;
  },

  async create(qualificacao: Omit<Qualificacao, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<Qualificacao> {
    const response = await api.post<Qualificacao>('/api/v1/qualificacao', qualificacao);
    return response.data;
  },

  async update(id: string, qualificacao: Partial<Qualificacao>): Promise<Qualificacao> {
    const response = await api.put<Qualificacao>(`/api/v1/qualificacao/${id}`, qualificacao);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/v1/qualificacao/${id}`);
  },

  async getByPCA(numeroContratacao: string): Promise<Qualificacao[]> {
    const response = await api.get<Qualificacao[]>(`/api/v1/qualificacao/by-pca/${numeroContratacao}`);
    return response.data;
  },

  async getConcluidas(skip = 0, limit = 1000): Promise<Qualificacao[]> {
    const response = await api.get<Qualificacao[]>(`/api/v1/qualificacao/concluidas?skip=${skip}&limit=${limit}`);
    return response.data;
  },
};