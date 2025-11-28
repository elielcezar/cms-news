import apiClient, { handleApiError } from '@/lib/api-client';
import { FeedItem, FeedItemsResponse, FonteComContagem } from '@/types/admin';

export interface FeedFilters {
  page?: number;
  limit?: number;
  fonteId?: number;
  lida?: boolean;
  search?: string;
}

export interface BuscarFeedResponse {
  message: string;
  stats: {
    fontesProcessadas: number;
    fontesComErro: number;
    itensEncontrados: number;
    itensNovos: number;
    itensDuplicados: number;
  };
  status: string;
}

export const feedService = {
  /**
   * Listar feed items com paginação e filtros
   */
  async getAll(filters?: FeedFilters): Promise<FeedItemsResponse> {
    try {
      const response = await apiClient.get<FeedItemsResponse>('/feed', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obter feed item por ID
   */
  async getById(id: number): Promise<FeedItem> {
    try {
      const response = await apiClient.get<FeedItem>(`/feed/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Buscar novos itens de feed de todas as fontes
   */
  async buscar(): Promise<BuscarFeedResponse> {
    try {
      const response = await apiClient.post<BuscarFeedResponse>('/feed/buscar');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Marcar feed item como lido
   */
  async markAsRead(id: number): Promise<FeedItem> {
    try {
      const response = await apiClient.patch<FeedItem>(`/feed/${id}/marcar-lida`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Marcar todos os itens como lidos
   */
  async markAllAsRead(): Promise<{ message: string; count: number }> {
    try {
      const response = await apiClient.patch<{ message: string; count: number }>('/feed/marcar-todas-lidas');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Deletar feed item
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/feed/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Deletar múltiplos feed items
   */
  async deleteMultiple(ids: number[]): Promise<{ message: string; count: number }> {
    try {
      const response = await apiClient.delete<{ message: string; count: number }>('/feed/multiplos', {
        data: { ids }
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Listar fontes com contagem de items
   */
  async getFontes(): Promise<FonteComContagem[]> {
    try {
      const response = await apiClient.get<FonteComContagem[]>('/feed/fontes');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

