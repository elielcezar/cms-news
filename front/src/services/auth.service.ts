import apiClient, { handleApiError } from '@/lib/api-client';
import { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '@/lib/api-config';
import { LoginResponse, User } from '@/types/admin';

export const authService = {
  /**
   * Fazer login
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/login', {
        email,
        password,
      });

      const { accessToken, refreshToken, user } = response.data;

      // Salvar tokens e usuário no localStorage
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Fazer logout
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Obter usuário atual do localStorage
   */
  getCurrentUser(): User | null {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  },

  /**
   * Verificar se está autenticado
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = this.getCurrentUser();
    return !!(token && user);
  },

  /**
   * Renovar token
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      
      if (!refreshToken) {
        throw new Error('Refresh token não encontrado');
      }

      const response = await apiClient.post<{ accessToken: string }>('/refresh', {
        refreshToken,
      });

      const { accessToken } = response.data;
      localStorage.setItem(TOKEN_KEY, accessToken);

      return accessToken;
    } catch (error) {
      // Se falhar ao renovar, fazer logout
      this.logout();
      throw new Error(handleApiError(error));
    }
  },
};

