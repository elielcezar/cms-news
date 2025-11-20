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
   * Buscar tags por nome (para autocomplete)
   */
  async search(query: string): Promise<Tag[]> {
    try {
      const response = await apiClient.get<Tag[]>('/tags', {
        params: { nome: query },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Buscar tag por nome ou criar se não existir
   */
  async createIfNotExists(nome: string): Promise<Tag> {
    try {
      // Buscar tag existente
      const existingTags = await this.search(nome);
      const exactMatch = existingTags.find(
        (tag) => tag.nome.toLowerCase() === nome.toLowerCase()
      );

      if (exactMatch) {
        return exactMatch;
      }

      // Criar nova tag
      return await this.create(nome);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Resolver múltiplas tags: buscar existentes e criar novas
   */
  async resolveTagIds(tagNames: string[]): Promise<number[]> {
    try {
      const tagIds: number[] = [];

      for (const tagName of tagNames) {
        if (!tagName.trim()) continue;

        const tag = await this.createIfNotExists(tagName.trim());
        tagIds.push(tag.id);
      }

      return tagIds;
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

