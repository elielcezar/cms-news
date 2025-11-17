import apiClient, { handleApiError } from '@/lib/api-client';
import { Post, PostFormData } from '@/types/admin';

export const postsService = {
  /**
   * Listar todos os posts
   */
  async getAll(filters?: { site?: string; tag?: string; status?: string }): Promise<Post[]> {
    try {
      const response = await apiClient.get<Post[]>('/posts', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obter post por ID
   */
  async getById(id: number): Promise<Post> {
    try {
      const response = await apiClient.get<Post>(`/posts/id/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obter post por URL amigável
   */
  async getBySlug(slug: string): Promise<Post> {
    try {
      const response = await apiClient.get<Post>(`/posts/${slug}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Criar novo post com upload de imagens
   */
  async create(data: PostFormData): Promise<Post> {
    try {
      const formData = new FormData();
      
      // Adicionar campos de texto obrigatórios
      formData.append('titulo', data.titulo);
      formData.append('chamada', data.chamada);
      formData.append('conteudo', data.conteudo);
      formData.append('urlAmigavel', data.urlAmigavel);
      
      // Adicionar campos opcionais
      if (data.status) formData.append('status', data.status);
      if (data.destaque !== undefined) formData.append('destaque', data.destaque.toString());
      if (data.dataPublicacao) formData.append('dataPublicacao', data.dataPublicacao);
      
      // Adicionar sites e tags como JSON
      if (data.sites && data.sites.length > 0) {
        formData.append('sites', JSON.stringify(data.sites));
      }
      if (data.tags && data.tags.length > 0) {
        formData.append('tags', JSON.stringify(data.tags));
      }

      // Adicionar imagens
      if (data.imagens && data.imagens.length > 0) {
        data.imagens.forEach((file) => {
          formData.append('imagens', file);
        });
      }

      console.log('📦 FormData pronto para enviar post');

      const response = await apiClient.post<Post>('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Atualizar post
   */
  async update(id: number, data: Partial<PostFormData>): Promise<Post> {
    try {
      const formData = new FormData();

      // Adicionar campos de texto
      if (data.titulo) formData.append('titulo', data.titulo);
      if (data.chamada) formData.append('chamada', data.chamada);
      if (data.conteudo) formData.append('conteudo', data.conteudo);
      if (data.urlAmigavel) formData.append('urlAmigavel', data.urlAmigavel);
      if (data.status) formData.append('status', data.status);
      if (data.destaque !== undefined) formData.append('destaque', data.destaque.toString());
      if (data.dataPublicacao) formData.append('dataPublicacao', data.dataPublicacao);
      
      // Adicionar sites e tags
      if (data.sites && data.sites.length > 0) {
        formData.append('sites', JSON.stringify(data.sites));
      }
      if (data.tags && data.tags.length > 0) {
        formData.append('tags', JSON.stringify(data.tags));
      }

      // Adicionar imagens antigas (manter)
      if (data.oldImages && data.oldImages.length > 0) {
        formData.append('oldImages', JSON.stringify(data.oldImages));
      }

      // Adicionar novas imagens
      if (data.imagens && data.imagens.length > 0) {
        data.imagens.forEach((file) => {
          formData.append('imagens', file);
        });
      }

      console.log('📦 [UPDATE] FormData pronto para atualizar post');

      const response = await apiClient.put<Post>(`/posts/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Deletar post
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/posts/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Alias para compatibilidade temporária
export const propertiesService = postsService;

