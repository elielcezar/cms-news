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
  siteId?: number;
  site?: Site;
  createdAt: string;
  updatedAt: string;
}

// Fonte (Feed de notícias para IA)
export interface Fonte {
  id: number;
  titulo: string;
  url: string;
  siteId: number;
  site: Site;
  createdAt: string;
  updatedAt: string;
}

export interface FonteFormData {
  titulo: string;
  url: string;
  siteId: number;
}

// Site
export interface Site {
  id: number;
  nome: string;
  createdAt: string;
  updatedAt: string;
}

// Alias para compatibilidade
export type Categoria = Site;

// Post (antiga Property/Imovel)
export interface Post {
  id: number;
  titulo: string;
  chamada: string;        // Era descricaoCurta
  conteudo: string;       // Era descricaoLonga
  imagens: string[];      // Era fotos - URLs do S3
  urlAmigavel: string;    // Slug para URL amigável
  status: 'RASCUNHO' | 'PUBLICADO';
  destaque: boolean;
  dataPublicacao: string | null;
  createdAt: string;
  updatedAt: string;
  sites?: {
    id: number;
    site: Site;
  }[];
  tags?: {
    id: number;
    tag: Tag;
  }[];
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
  sites?: number[];       // Array de IDs de sites
  tags?: number[];        // Array de IDs de tags
  imagens?: File[];       // Arquivos para upload
  oldImages?: string[];   // URLs existentes
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
