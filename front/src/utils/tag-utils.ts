/**
 * Utilitários para manipulação de tags
 */

/**
 * Normaliza uma tag: trim, lowercase, remove caracteres especiais
 */
export function normalizeTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais exceto hífen e espaço
    .replace(/\s+/g, '-') // Substitui espaços por hífen
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens do início e fim
}

/**
 * Valida se uma tag é válida
 */
export function isValidTag(tag: string): boolean {
  const normalized = normalizeTag(tag);
  return normalized.length > 0 && normalized.length <= 50;
}

/**
 * Remove tags duplicadas de um array
 */
export function removeDuplicates(tags: string[]): string[] {
  const normalized = tags.map(normalizeTag).filter(t => t.length > 0);
  return Array.from(new Set(normalized));
}

/**
 * Filtra tags vazias e inválidas
 */
export function filterValidTags(tags: string[]): string[] {
  return tags
    .map(normalizeTag)
    .filter(tag => isValidTag(tag));
}

