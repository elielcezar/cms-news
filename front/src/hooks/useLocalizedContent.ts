import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

/**
 * Hook para buscar conteúdo da API com idioma correto
 * Adiciona automaticamente o parâmetro ?lang= nas requisições
 */
export function useLocalizedContent<T>(
  endpoint: string,
  queryKey: string[],
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const { language } = useLanguage();

  return useQuery<T>({
    queryKey: [...queryKey, language],
    queryFn: async () => {
      const separator = endpoint.includes('?') ? '&' : '?';
      const response = await apiClient.get<T>(`${endpoint}${separator}lang=${language}`);
      return response.data;
    },
    ...options,
  } as any);
}

/**
 * Helper para construir URL com idioma
 */
export function useLocalizedUrl() {
  const { language } = useLanguage();

  return (path: string) => {
    // Remove barra inicial se existir
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `/${language}/${cleanPath}`;
  };
}

