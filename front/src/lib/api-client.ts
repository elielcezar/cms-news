import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, TOKEN_KEY, REFRESH_TOKEN_KEY } from './api-config';

// Criar instância do axios
const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

// Interceptor para adicionar token JWT em todas as requisições
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de resposta
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Se o erro for 401 (não autorizado) e ainda não tentamos renovar o token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        
        if (refreshToken) {
          // Tentar renovar o token
          const response = await axios.post(`${API_CONFIG.baseURL}/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          
          // Salvar novo token
          localStorage.setItem(TOKEN_KEY, accessToken);

          // Atualizar header da requisição original
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          // Tentar novamente a requisição original
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Se falhar ao renovar, fazer logout
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem('user_data');
        
        // Redirecionar para login
        window.location.href = '/admin/login';
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Helper para tratar erros da API
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // Erros de resposta da API
    if (error.response) {
      const message = error.response.data?.error || error.response.data?.message;
      
      if (message) {
        return message;
      }

      // Mensagens padrão por código de status
      switch (error.response.status) {
        case 400:
          return 'Dados inválidos. Verifique as informações e tente novamente.';
        case 401:
          return 'Sessão expirada. Faça login novamente.';
        case 403:
          return 'Você não tem permissão para realizar esta ação.';
        case 404:
          return 'Recurso não encontrado.';
        case 409:
          return 'Conflito de dados. Este registro já existe.';
        case 500:
          return 'Erro interno do servidor. Tente novamente mais tarde.';
        default:
          return 'Ocorreu um erro inesperado.';
      }
    }
    
    // Erros de rede
    if (error.request) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }
  }

  return 'Ocorreu um erro inesperado.';
};

