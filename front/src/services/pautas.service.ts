import apiClient, { handleApiError } from '@/lib/api-client';
import { Pauta } from '@/types/admin';

export const pautasService = {
  /**
   * Listar todas as pautas
   */
  async getAll(filters?: { siteId?: number; search?: string }): Promise<Pauta[]> {
    try {
      const response = await apiClient.get<Pauta[]>('/pautas', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obter pauta por ID
   */
  async getById(id: number): Promise<Pauta> {
    try {
      const response = await apiClient.get<Pauta>(`/pautas/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Deletar pauta
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/pautas/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

