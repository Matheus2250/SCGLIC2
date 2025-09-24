import api from './api';

export interface AccessRequest {
  id: string;
  user_id: string;
  nivel_solicitado: string;
  trabalha_cglic: boolean;
  justificativa?: string;
  status: 'PENDENTE' | 'APROVADA' | 'REJEITADA';
  observacoes_admin?: string;
  aprovado_por_id?: string;
  created_at: string;
  updated_at?: string;
  user_nome?: string;
  user_email?: string;
  aprovado_por_nome?: string;
}

export interface AccessRequestCreate {
  nivel_solicitado: string;
  trabalha_cglic: boolean;
  justificativa?: string;
}

export interface AccessRequestUpdate {
  status: string;
  observacoes_admin?: string;
}

export interface AccessRequestListItem {
  id: string;
  user_nome: string;
  user_email: string;
  nivel_solicitado: string;
  trabalha_cglic: boolean;
  status: string;
  created_at: string;
}

class AccessRequestService {
  private baseURL = '/api/v1/access-requests/';

  async createRequest(data: AccessRequestCreate): Promise<AccessRequest> {
    const response = await api.post(this.baseURL, data);
    return response.data;
  }

  async getMyRequests(): Promise<AccessRequest[]> {
    const response = await api.get(`${this.baseURL}my-requests`);
    return response.data;
  }

  async getPendingRequests(): Promise<AccessRequestListItem[]> {
    const response = await api.get(`${this.baseURL}pending`);
    return response.data;
  }

  async getAllRequests(skip: number = 0, limit: number = 100): Promise<AccessRequestListItem[]> {
    const response = await api.get(`${this.baseURL}?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  async getRequestDetails(requestId: string): Promise<AccessRequest> {
    const response = await api.get(`${this.baseURL}${requestId}`);
    return response.data;
  }

  async approveRequest(requestId: string, observacoes?: string): Promise<AccessRequest> {
    const response = await api.post(`${this.baseURL}${requestId}/approve`, {
      status: 'APROVADA',
      observacoes_admin: observacoes,
    });
    return response.data;
  }

  async rejectRequest(requestId: string, observacoes?: string): Promise<AccessRequest> {
    const response = await api.post(`${this.baseURL}${requestId}/reject`, {
      status: 'REJEITADA',
      observacoes_admin: observacoes,
    });
    return response.data;
  }

  async deleteRequest(requestId: string): Promise<void> {
    await api.delete(`${this.baseURL}${requestId}`);
  }
}

export const accessRequestService = new AccessRequestService();