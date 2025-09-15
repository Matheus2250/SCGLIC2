import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante para CORS com credenciais
});

// Interceptor para adicionar token se existir
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    // Se a resposta deveria ser um array mas não é, retornar array vazio
    if (response.config.method === 'get' && 
        !Array.isArray(response.data) && 
        (response.config.url?.includes('?skip=') || response.config.url?.endsWith('/'))) {
      console.warn('Expected array but got:', response.data, 'for URL:', response.config.url);
      response.data = [];
    }
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;