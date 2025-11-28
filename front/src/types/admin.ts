// Tag
export interface Tag {
  id: number;
  nome: string;
  createdAt: string;
  updatedAt: string;
}

// Pauta (Sugestão de Pauta gerada por IA)
export interface Pauta {
  id: number;
  assunto: string;
  resumo: string;
  fontes: {
    nome: string;
    url: string;
  }[];
  lida: boolean; // Indica se a pauta foi visualizada
  createdAt: string;
  updatedAt: string;
}

// Fonte (Feed de notícias para IA)
export interface Fonte {
  id: number;
  titulo: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface FonteFormData {
  titulo: string;
  url: string;
}

// FeedItem (Notícia extraída de uma fonte)
export interface FeedItem {
  id: number;
  fonteId: number;
  titulo: string;
  url: string;
  chamada: string | null;
  imagemUrl: string | null;
  dataPublicacao: string | null;
  lida: boolean;
  createdAt: string;
  updatedAt: string;
  fonte?: {
    id: number;
    titulo: string;
    url: string;
  };
}

// Resposta paginada de FeedItems
export interface FeedItemsResponse {
  items: FeedItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Fonte com contagem de items para filtro
export interface FonteComContagem {
  id: number;
  titulo: string;
  totalItems: number;
}

// Categoria
export interface Categoria {
  id: number;
  nome: string;
  createdAt: string;
  updatedAt: string;
}

// Alias para compatibilidade (removido após migração completa)
export type Site = Categoria;

// Tradução de Post
export interface PostTranslation {
  id: number;
  postId: number;
  idioma: 'pt' | 'en' | 'es';
  titulo: string;
  chamada: string;
  conteudo: string;
  urlAmigavel: string;
  createdAt: string;
  updatedAt: string;
}

// Post (antiga Property/Imovel) - agora multilíngue
export interface Post {
  id: number;
  imagens: string[];      // URLs do S3
  status: 'RASCUNHO' | 'PUBLICADO';
  destaque: boolean;
  dataPublicacao: string | null;
  idiomaDefault: string;  // Idioma padrão
  createdAt: string;
  updatedAt: string;
  categorias?: {
    id: number;
    categoria: Categoria;
  }[];
  tags?: {
    id: number;
    tag?: Tag; // Formato completo do Prisma
    nome?: string; // Formato simplificado da API pública
  }[];
  translations?: PostTranslation[];
  // Campos de tradução no nível raiz (quando retornado pela API com ?lang)
  titulo?: string;
  chamada?: string;
  conteudo?: string;
  urlAmigavel?: string;
  translationsAvailable?: string[];
}

// Para criar/editar post
export interface PostFormData {
  titulo: string;
  chamada: string;
  conteudo: string;
  urlAmigavel: string;
  status?: 'RASCUNHO' | 'PUBLICADO';
  destaque?: boolean;
  dataPublicacao?: string;
  categorias?: number[];  // Array de IDs de categorias
  tags?: number[];        // Array de IDs de tags
  imagens?: File[];       // Arquivos para upload
  oldImages?: string[];   // URLs existentes
  idioma?: 'pt' | 'en' | 'es';  // Para edição de tradução específica
}

// Para criar/editar tradução
export interface TranslationFormData {
  idioma: 'pt' | 'en' | 'es';
  titulo: string;
  chamada: string;
  conteudo: string;
  urlAmigavel: string;
}

// Usuário
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// Para criar/editar usuário
export interface UserFormData {
  name: string;
  email: string;
  password?: string;
}

// Resposta de Login
export interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Dados de autenticação (para o contexto)
export interface AdminUser extends User {
  role?: 'admin' | 'editor' | 'viewer'; // Mantido para compatibilidade, mas não vem do backend
}

// Respostas da API
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

// MANTIDOS PARA COMPATIBILIDADE TEMPORÁRIA (serão removidos após migração completa)
// Aliases para facilitar transição gradual
export type Property = Post;
export type PropertyFormData = PostFormData;
