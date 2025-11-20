/**
 * Utilitários para gerenciar embeds de plataformas sociais
 */

/**
 * Detecta a plataforma baseado no HTML ou URL fornecido
 */
export function detectEmbedPlatform(htmlOrUrl: string): 'youtube' | 'tiktok' | 'instagram' | 'spotify' | 'soundcloud' | 'generic' {
  const lower = htmlOrUrl.toLowerCase();
  
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return 'youtube';
  }
  if (lower.includes('tiktok-embed') || lower.includes('tiktok.com')) {
    return 'tiktok';
  }
  if (lower.includes('instagram-media') || lower.includes('instagram.com')) {
    return 'instagram';
  }
  if (lower.includes('spotify.com')) {
    return 'spotify';
  }
  if (lower.includes('soundcloud.com')) {
    return 'soundcloud';
  }
  
  return 'generic';
}

/**
 * Carrega script externo se ainda não estiver carregado
 */
export function loadScript(src: string, id?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Verificar se o script já existe
    if (id && document.getElementById(id)) {
      resolve();
      return;
    }
    
    // Verificar se já existe script com mesmo src
    const existingScript = Array.from(document.getElementsByTagName('script'))
      .find(script => script.src === src);
    
    if (existingScript) {
      resolve();
      return;
    }
    
    // Criar novo script
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    
    if (id) {
      script.id = id;
    }
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    
    document.body.appendChild(script);
  });
}

/**
 * Carrega scripts necessários para uma plataforma específica
 */
export async function loadPlatformScripts(platform: string): Promise<void> {
  try {
    switch (platform) {
      case 'tiktok':
        await loadScript('https://www.tiktok.com/embed.js', 'tiktok-embed-script');
        // Processar embeds do TikTok
        setTimeout(() => {
          if (window.tiktokEmbed) {
            window.tiktokEmbed.lib.render();
          }
        }, 100);
        break;
        
      case 'instagram':
        await loadScript('https://www.instagram.com/embed.js', 'instagram-embed-script');
        // Processar embeds do Instagram
        setTimeout(() => {
          if (window.instgrm) {
            window.instgrm.Embeds.process();
          }
        }, 100);
        break;
        
      // YouTube e Spotify usam apenas iframe, não precisam de scripts
      case 'youtube':
      case 'spotify':
      case 'soundcloud':
      default:
        // Nenhum script necessário
        break;
    }
  } catch (error) {
    console.error(`[Embed Utils] Erro ao carregar scripts para ${platform}:`, error);
  }
}

/**
 * Processa todos os embeds na página
 * Útil após carregar conteúdo dinamicamente
 */
export function processAllEmbeds(): void {
  // Processar TikTok
  if (window.tiktokEmbed) {
    try {
      window.tiktokEmbed.lib.render();
    } catch (error) {
      console.error('[Embed Utils] Erro ao processar TikTok:', error);
    }
  }
  
  // Processar Instagram
  if (window.instgrm) {
    try {
      window.instgrm.Embeds.process();
    } catch (error) {
      console.error('[Embed Utils] Erro ao processar Instagram:', error);
    }
  }
}

/**
 * Valida se o HTML contém tags permitidas para embeds
 */
export function validateEmbedHTML(html: string): { valid: boolean; error?: string } {
  if (!html || !html.trim()) {
    return { valid: false, error: 'HTML vazio' };
  }
  
  const allowedTags = ['blockquote', 'iframe', 'script', 'a', 'div', 'section', 'p', 'svg', 'g', 'path'];
  const allowedDomains = [
    'youtube.com',
    'youtu.be',
    'tiktok.com',
    'instagram.com',
    'spotify.com',
    'soundcloud.com',
  ];
  
  // Verificar se contém pelo menos uma tag permitida
  const hasValidTag = allowedTags.some(tag => 
    html.toLowerCase().includes(`<${tag}`) || 
    html.toLowerCase().includes(`<${tag} `)
  );
  
  if (!hasValidTag) {
    return { valid: false, error: 'HTML não contém tags de embed válidas' };
  }
  
  // Verificar se é de um domínio permitido (para iframes e links)
  const hasAllowedDomain = allowedDomains.some(domain => 
    html.toLowerCase().includes(domain)
  );
  
  if (!hasAllowedDomain) {
    return { valid: false, error: 'Domínio não permitido. Use apenas YouTube, TikTok, Instagram, Spotify ou SoundCloud.' };
  }
  
  return { valid: true };
}

/**
 * Extrai informações básicas do embed
 */
export function extractEmbedInfo(html: string): {
  platform: string;
  title?: string;
  url?: string;
} {
  const platform = detectEmbedPlatform(html);
  
  // Tentar extrair URL
  let url: string | undefined;
  const urlMatch = html.match(/(?:href|src|cite)=["']([^"']+)["']/i);
  if (urlMatch) {
    url = urlMatch[1];
  }
  
  // Tentar extrair título
  let title: string | undefined;
  const titleMatch = html.match(/title=["']([^"']+)["']/i);
  if (titleMatch) {
    title = titleMatch[1];
  }
  
  return {
    platform,
    title,
    url,
  };
}

// Tipagem global para scripts de embed
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
    tiktokEmbed?: {
      lib: {
        render: () => void;
      };
    };
  }
}

