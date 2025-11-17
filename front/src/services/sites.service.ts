import apiClient, { handleApiError } from '@/lib/api-client';
import { Site } from '@/types/admin';

export const sitesService = {
  /**
   * Listar todos os sites
   */
  async getAll(): Promise<Site[]> {
    try {
      const response = await apiClient.get<Site[]>('/sites');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Criar novo site
   */
  async create(data: { nome: string }): Promise<Site> {
    try {
      const response = await apiClient.post<Site>('/sites', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Atualizar site
   */
  async update(id: number, data: { nome: string }): Promise<Site> {
    try {
      const response = await apiClient.put<Site>(`/sites/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Deletar site
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/sites/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Alias para compatibilidade
export const categoriasService = sitesService;

