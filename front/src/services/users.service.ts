import apiClient, { handleApiError } from '@/lib/api-client';
import { User, UserFormData } from '@/types/admin';

export const usersService = {
  /**
   * Listar todos os usuários
   */
  async getAll(): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/usuarios');
      // Garantir que retornamos um array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obter usuário por ID
   */
  async getById(id: number): Promise<User> {
    try {
      const response = await apiClient.get<User>(`/usuarios/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Criar novo usuário
   */
  async create(data: UserFormData): Promise<User> {
    try {
      const response = await apiClient.post<User>('/usuarios', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Atualizar usuário
   */
  async update(id: number, data: Partial<UserFormData>): Promise<User> {
    try {
      const response = await apiClient.put<User>(`/usuarios/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Deletar usuário
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/usuarios/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

