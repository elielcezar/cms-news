// Configuração da API
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3004/api',
  timeout: 60000, // 60 segundos (necessário para geração de IA multilíngue)
  headers: {
    'Content-Type': 'application/json',
  },
};

export const TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'user_data';

