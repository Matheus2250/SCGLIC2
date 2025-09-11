import { api } from './api';
import { Usuario, LoginRequest, LoginResponse } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);
    
    const response = await api.post<LoginResponse>('/api/v1/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  async getMe(): Promise<Usuario> {
    const response = await api.get<Usuario>('/api/v1/auth/me');
    return response.data;
  },

  async register(userData: {
    username: string;
    email: string;
    password: string;
    nome_completo: string;
    nivel_acesso: string;
  }): Promise<Usuario> {
    const response = await api.post<Usuario>('/api/v1/auth/register', userData);
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};