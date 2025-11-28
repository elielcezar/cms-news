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

  /**
   * Converter pauta em post usando IA
   */
  async convertToPost(id: number): Promise<{ postId: number; message: string }> {
    try {
      const response = await apiClient.post<{ postId: number; message: string }>(
        `/pautas/${id}/converter-em-post`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Marcar pauta como lida
   */
  async markAsRead(id: number): Promise<Pauta> {
    try {
      const response = await apiClient.patch<Pauta>(`/pautas/${id}/marcar-lida`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Disparar busca de novas pautas via N8N
   */
  async gerar(): Promise<{ message: string; status: string }> {
    try {
      const response = await apiClient.post<{ message: string; status: string }>('/pautas/gerar');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Criar pauta manualmente
   */
  async create(data: { assunto: string; resumo: string; fontes: Array<{ nome: string; url: string }> }): Promise<Pauta> {
    try {
      const response = await apiClient.post<Pauta>('/pautas/manual', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

