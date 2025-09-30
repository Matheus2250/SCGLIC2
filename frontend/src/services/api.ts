import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Disabled for CORS compatibility
});

// Interceptor para adicionar token se existir
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Forçar cache refresh para DELETE requests
    if (config.method?.toLowerCase() === 'delete') {
      config.headers['Cache-Control'] = 'no-cache';
      config.headers['Pragma'] = 'no-cache';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros e garantir arrays
api.interceptors.response.use(
  (response) => {
    // Verificar se a resposta é null ou undefined e deveria ser um array
    if (response.config.method === 'get') {
      // Para endpoints que retornam listas, garantir que sempre retorne array
      // Excluir endpoints que retornam objetos individuais
      const isListEndpoint = (
        response.config.url?.includes('/users') ||
        response.config.url?.includes('?skip=') ||
        response.config.url?.endsWith('/')
      ) || (
        (response.config.url?.includes('requests') ||
         response.config.url?.includes('pca') ||
         response.config.url?.includes('qualificacao') ||
         response.config.url?.includes('licitacao')) &&
        response.config.url?.includes('?skip=') // Apenas listas com paginação
      );

      const isObjectEndpoint =
        response.config.url?.includes('/dashboard/') ||
        /\/[a-f0-9-]{36}$/.test(response.config.url || ''); // UUID no final da URL

      if (isListEndpoint && !isObjectEndpoint) {

        if (response.data === null || response.data === undefined || !Array.isArray(response.data)) {
          console.warn('Expected array but got:', response.data, 'for URL:', response.config.url);
          response.data = [];
        }
      }
    }
    return response;
  },
  (error) => {
    console.error('API Error:', error);

    // Se não há resposta do servidor
    if (!error.response) {
      console.error('Network error or server unavailable:', error.message);
      return Promise.reject({
        message: 'Erro de conexão com o servidor',
        response: { data: { detail: 'Não foi possível conectar ao servidor' } }
      });
    }

    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Se a resposta do erro é vazia ou malformada
    if (!error.response.data || error.response.data === '') {
      error.response.data = {
        detail: `Erro no servidor (${error.response.status || 'desconhecido'})`
      };
    }

    return Promise.reject(error);
  }
);

export { api };
export default api;