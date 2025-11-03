import api from './api';

export interface ProfileUpdate {
  nome_completo?: string;
  email?: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

class ProfileService {
  private baseAuth = '/api/v1/auth';

  async updateMe(data: ProfileUpdate) {
    try {
      const res = await api.patch(`${this.baseAuth}/me`, data);
      return res.data;
    } catch (err) {
      // Fallback: alguns backends expõem via PUT em /auth/users/{id}
      throw err;
    }
  }

  async changePassword(payload: PasswordChange) {
    const res = await api.post(`${this.baseAuth}/change-password`, payload);
    return res.data;
  }

  async uploadAvatar(file: File) {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`${this.baseAuth}/me/avatar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data; // esperado: { avatar_url: string }
  }
}

export const profileService = new ProfileService();

