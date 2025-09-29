import { api } from './api';
import { Usuario } from '../types';

export interface UsuarioUpdate {
  username?: string;
  email?: string;
  nome_completo?: string;
  nivel_acesso?: string;
  ativo?: boolean;
}

export const userService = {
  async getAllUsers(): Promise<Usuario[]> {
    const response = await api.get<Usuario[]>('/api/v1/auth/users');
    return response.data;
  },

  async getUserById(id: string): Promise<Usuario> {
    const response = await api.get<Usuario>(`/api/v1/auth/users/${id}`);
    return response.data;
  },

  async updateUser(id: string, userData: UsuarioUpdate): Promise<Usuario> {
    const response = await api.put<Usuario>(`/api/v1/auth/users/${id}`, userData);
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    console.log('UserService: Deletando usuário com ID:', id);
    const response = await api.delete(`/api/v1/auth/users/${id}`);
    console.log('UserService: Resposta da exclusão:', response);
    return response.data;
  },
};