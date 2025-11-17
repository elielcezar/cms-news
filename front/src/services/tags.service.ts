import apiClient, { handleApiError } from '@/lib/api-client';
import { Tag } from '@/types/admin';

export const tagsService = {
  /**
   * Listar todas as tags
   */
  async getAll(): Promise<Tag[]> {
    try {
      const response = await apiClient.get<Tag[]>('/tags');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Criar nova tag
   */
  async create(nome: string): Promise<Tag> {
    try {
      const response = await apiClient.post<Tag>('/tags', { nome });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Atualizar tag
   */
  async update(id: number, nome: string): Promise<Tag> {
    try {
      const response = await apiClient.put<Tag>(`/tags/${id}`, { nome });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Deletar tag
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/tags/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

