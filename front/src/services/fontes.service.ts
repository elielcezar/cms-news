import apiClient, { handleApiError } from '@/lib/api-client';
import { Fonte, FonteFormData } from '@/types/admin';

export const fontesService = {
  /**
   * Listar todas as fontes
   */
  async getAll(filters?: { siteId?: number; search?: string }): Promise<Fonte[]> {
    try {
      const response = await apiClient.get<Fonte[]>('/fontes', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obter fonte por ID
   */
  async getById(id: number): Promise<Fonte> {
    try {
      const response = await apiClient.get<Fonte>(`/fontes/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Criar nova fonte
   */
  async create(data: FonteFormData): Promise<Fonte> {
    try {
      const response = await apiClient.post<Fonte>('/fontes', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Atualizar fonte
   */
  async update(id: number, data: Partial<FonteFormData>): Promise<Fonte> {
    try {
      const response = await apiClient.put<Fonte>(`/fontes/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Deletar fonte
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/fontes/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

