import { useEffect } from 'react';
import { processAllEmbeds, loadPlatformScripts } from './ui/tiptap-extensions/embed-utils';

/**
 * Componente que processa embeds após o conteúdo ser renderizado
 * Use este componente em páginas públicas que exibem posts com embeds
 * 
 * Suporta: YouTube, TikTok, Instagram, Spotify, SoundCloud e outros
 */
export function EmbedProcessor() {
  useEffect(() => {
    // Pequeno delay para garantir que o DOM foi renderizado
    const timer = setTimeout(() => {
      // Detectar plataformas presentes na página
      const platforms: Set<string> = new Set();
      
      // Verificar containers de embed
      const embedContainers = document.querySelectorAll('[data-embed-type]');
      embedContainers.forEach((container) => {
        const platform = container.getAttribute('data-embed-type');
        if (platform) {
          platforms.add(platform);
        }
      });
      
      // Verificar por blockquotes/iframes específicos
      if (document.querySelector('.instagram-media')) {
        platforms.add('instagram');
      }
      if (document.querySelector('.tiktok-embed')) {
        platforms.add('tiktok');
      }
      
      // Carregar scripts necessários para cada plataforma
      platforms.forEach((platform) => {
        loadPlatformScripts(platform);
      });
      
      // Processar todos os embeds
      setTimeout(() => {
        processAllEmbeds();
      }, 100);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return null; // Este componente não renderiza nada
}

