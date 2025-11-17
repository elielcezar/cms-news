// Real authentication service with JWT
import { authService } from '@/services/auth.service';
import { AdminUser } from '@/types/admin';

export type { AdminUser };

export const adminAuth = {
  login: async (email: string, password: string): Promise<{ user?: AdminUser; error?: string }> => {
    try {
      const response = await authService.login(email, password);
      return { user: { ...response.user, role: 'admin' } }; // Adiciona role para compatibilidade
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Erro ao fazer login' };
    }
  },

  logout: () => {
    authService.logout();
  },

  getCurrentUser: (): AdminUser | null => {
    const user = authService.getCurrentUser();
    if (!user) return null;
    return { ...user, role: 'admin' }; // Adiciona role para compatibilidade
  },

  isAuthenticated: (): boolean => {
    return authService.isAuthenticated();
  },
};
