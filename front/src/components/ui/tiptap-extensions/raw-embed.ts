import { Node } from '@tiptap/core';

export interface RawEmbedOptions {
  inline: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    rawEmbed: {
      setRawEmbed: (options: { html: string; platform?: string }) => ReturnType;
    };
  }
}

/**
 * Extensão genérica para embeds que preserva HTML oficial das plataformas
 * Suporta: YouTube, TikTok, Instagram, Spotify e qualquer outro embed HTML
 */
export const RawEmbed = Node.create<RawEmbedOptions>({
  name: 'rawEmbed',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      inline: false,
    };
  },

  addAttributes() {
    return {
      html: {
        default: '',
      },
      platform: {
        default: 'generic',
      },
    };
  },

  parseHTML() {
    return [
      // Container genérico de embed
      {
        tag: 'div[data-embed-type]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          
          const element = node as HTMLElement;
          const platform = element.getAttribute('data-embed-type') || 'generic';
          const html = element.innerHTML;
          
          return {
            html,
            platform,
          };
        },
      },
      // Blockquote do TikTok
      {
        tag: 'blockquote.tiktok-embed',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          
          const element = node as HTMLElement;
          
          // Pegar o blockquote completo + script seguinte
          let html = element.outerHTML;
          
          // Tentar incluir o script do TikTok se estiver logo após
          const nextSibling = element.nextElementSibling;
          if (nextSibling && nextSibling.tagName === 'SCRIPT' && 
              nextSibling.getAttribute('src')?.includes('tiktok.com/embed.js')) {
            html += nextSibling.outerHTML;
          }
          
          return {
            html,
            platform: 'tiktok',
          };
        },
      },
      // Blockquote do Instagram
      {
        tag: 'blockquote.instagram-media',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          
          const element = node as HTMLElement;
          
          // Pegar o blockquote completo + script seguinte
          let html = element.outerHTML;
          
          // Tentar incluir o script do Instagram se estiver logo após
          const nextSibling = element.nextElementSibling;
          if (nextSibling && nextSibling.tagName === 'SCRIPT' && 
              nextSibling.getAttribute('src')?.includes('instagram.com/embed.js')) {
            html += nextSibling.outerHTML;
          }
          
          return {
            html,
            platform: 'instagram',
          };
        },
      },
      // Iframe do YouTube
      {
        tag: 'iframe[src*="youtube.com"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          
          const element = node as HTMLElement;
          const html = element.outerHTML;
          
          return {
            html,
            platform: 'youtube',
          };
        },
      },
      // Iframe do Spotify
      {
        tag: 'iframe[src*="spotify.com"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          
          const element = node as HTMLElement;
          const html = element.outerHTML;
          
          return {
            html,
            platform: 'spotify',
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const html = node.attrs.html;
    const platform = node.attrs.platform || 'generic';

    return [
      'div',
      {
        'data-embed-type': platform,
        'data-embed-html': '', // Marker para identificar
        class: `embed-container embed-${platform}`,
      },
      // Renderizar HTML bruto preservando estrutura original
      ['div', { 
        class: 'embed-content',
        // O HTML será inserido via innerHTML no próximo passo
      }],
    ];
  },

  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const container = document.createElement('div');
      container.setAttribute('data-embed-type', node.attrs.platform);
      container.className = `embed-container embed-${node.attrs.platform}`;

      const content = document.createElement('div');
      content.className = 'embed-content';
      content.innerHTML = node.attrs.html;

      container.appendChild(content);

      return {
        dom: container,
        contentDOM: null, // Atom node - não editável
      };
    };
  },

  addCommands() {
    return {
      setRawEmbed:
        (options: { html: string; platform?: string }) =>
        ({ commands }) => {
          if (!options.html || !options.html.trim()) {
            return false;
          }

          // Detectar plataforma automaticamente se não fornecida
          const platform = options.platform || detectPlatform(options.html);

          return commands.insertContent({
            type: this.name,
            attrs: {
              html: options.html,
              platform,
            },
          });
        },
    };
  },
});

/**
 * Detecta a plataforma baseado no HTML fornecido
 */
function detectPlatform(html: string): string {
  const lowerHtml = html.toLowerCase();
  
  if (lowerHtml.includes('youtube.com') || lowerHtml.includes('youtu.be')) {
    return 'youtube';
  }
  if (lowerHtml.includes('tiktok-embed') || lowerHtml.includes('tiktok.com')) {
    return 'tiktok';
  }
  if (lowerHtml.includes('instagram-media') || lowerHtml.includes('instagram.com')) {
    return 'instagram';
  }
  if (lowerHtml.includes('spotify.com')) {
    return 'spotify';
  }
  if (lowerHtml.includes('soundcloud.com')) {
    return 'soundcloud';
  }
  
  return 'generic';
}

