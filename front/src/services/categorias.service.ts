import apiClient, { handleApiError } from '@/lib/api-client';
import { Categoria } from '@/types/admin';

export const categoriasService = {
  /**
   * Listar todas as categorias
   */
  async getAll(): Promise<Categoria[]> {
    try {
      const response = await apiClient.get<Categoria[]>('/categorias');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Criar nova categoria
   */
  async create(data: { nome: string }): Promise<Categoria> {
    try {
      const response = await apiClient.post<Categoria>('/categorias', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Atualizar categoria
   */
  async update(id: number, data: { nome: string }): Promise<Categoria> {
    try {
      const response = await apiClient.put<Categoria>(`/categorias/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Deletar categoria
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/categorias/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Alias para compatibilidade (remover após migração completa)
export const sitesService = categoriasService;

