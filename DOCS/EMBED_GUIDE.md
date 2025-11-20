# 🎬 Guia de Uso: Sistema de Embeds Universal

## ✅ Implementação Completa

O sistema de embeds foi reimplementado usando uma abordagem **universal** que preserva o código HTML oficial das plataformas.

---

## 🎯 O Que Mudou?

### Antes (Problemático)
- ❌ 3 extensões separadas (YouTube, TikTok, Instagram)
- ❌ HTML gerado manualmente (incompleto)
- ❌ TikTok mostrava vídeos relacionados
- ❌ Instagram não funcionava
- ❌ Não suportava Spotify

### Agora (Solução Definitiva)
- ✅ **1 extensão genérica** (`RawEmbed`)
- ✅ **HTML oficial** das plataformas
- ✅ TikTok mostra vídeo completo com descrição
- ✅ Instagram funciona em produção
- ✅ **Spotify, SoundCloud** e outras plataformas suportadas
- ✅ Sistema simples e manutenível

---

## 🚀 Como Usar

### Passo 1: Obter Código de Embed

Vá até a plataforma e copie o código oficial:

#### YouTube
1. Abra o vídeo no YouTube
2. Clique em **"Compartilhar"**
3. Clique em **"Incorporar"**
4. **Copie o código** (iframe completo)

```html
<iframe width="560" height="315" src="https://www.youtube.com/embed/..." ...></iframe>
```

#### TikTok
1. Abra o vídeo no TikTok
2. Clique em **"..."** (três pontos)
3. Clique em **"Embed"**
4. **Copie o código** (blockquote + script)

```html
<blockquote class="tiktok-embed" cite="..." data-video-id="...">
  <section>
    <a target="_blank" ...>@user</a> Descrição completa...
  </section>
</blockquote>
<script async src="https://www.tiktok.com/embed.js"></script>
```

#### Instagram
1. Abra o post no Instagram
2. Clique em **"..."** (três pontos)
3. Clique em **"Embed"**
4. **Copie o código** (blockquote + script)

```html
<blockquote class="instagram-media" data-instgrm-permalink="...">
  ...conteúdo completo...
</blockquote>
<script async src="//www.instagram.com/embed.js"></script>
```

#### Spotify
1. Abra música/playlist/álbum no Spotify
2. Clique em **"..."** → **"Share"** → **"Embed track/playlist"**
3. **Copie o iframe**

```html
<iframe src="https://open.spotify.com/embed/..." width="100%" height="352" ...></iframe>
```

---

### Passo 2: Inserir no Editor

#### Método A: Botão de Embed (Recomendado)

1. No editor, clique no botão **📹 Embed** (ícone de vídeo)
2. Cole o código completo no campo de texto
3. O sistema detecta automaticamente a plataforma
4. Clique em **"Inserir Embed"**
5. ✅ Pronto!

#### Método B: Modo HTML (Alternativo)

1. Clique no botão **`</>`** (Modo HTML)
2. Cole o código de embed onde desejar
3. Volte ao modo visual
4. ✅ Embed preservado!

---

## 📋 Exemplos de Códigos Válidos

### YouTube ✅
```html
<iframe width="560" height="315" src="https://www.youtube.com/embed/KWaj_gDh9tc" 
        title="YouTube video player" frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen></iframe>
```

### TikTok ✅
```html
<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@user/video/123..." 
            data-video-id="123..." style="max-width: 605px;min-width: 325px;">
  <section>
    <a target="_blank" title="@user" href="...">@user</a> 
    Descrição do vídeo aqui
    <a title="hashtag" href="#">#hashtag</a>
  </section>
</blockquote>
<script async src="https://www.tiktok.com/embed.js"></script>
```

### Instagram ✅
```html
<blockquote class="instagram-media" data-instgrm-captioned 
            data-instgrm-permalink="https://www.instagram.com/reel/ABC123/..." 
            data-instgrm-version="14" 
            style="background:#FFF; border:0; ...">
  <div style="padding:16px;">
    <!-- Conteúdo completo do Instagram -->
  </div>
</blockquote>
<script async src="//www.instagram.com/embed.js"></script>
```

### Spotify ✅
```html
<iframe style="border-radius:12px" 
        src="https://open.spotify.com/embed/album/..." 
        width="100%" height="352" frameBorder="0" 
        allowfullscreen="" 
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
        loading="lazy"></iframe>
```

---

## ⚡ Recursos

### Detecção Automática
O sistema detecta automaticamente:
- 📹 YouTube (`youtube.com`)
- 🎵 TikTok (`tiktok-embed`)
- 📷 Instagram (`instagram-media`)
- 🎧 Spotify (`spotify.com`)
- 🎵 SoundCloud (`soundcloud.com`)

### Validação
O sistema valida:
- ✅ HTML contém tags permitidas
- ✅ Domínio é de plataforma conhecida
- ✅ Estrutura básica está correta

### Processamento de Scripts
Scripts são carregados automaticamente:
- TikTok: `tiktok.com/embed.js`
- Instagram: `instagram.com/embed.js`
- YouTube/Spotify: Apenas iframe (sem scripts)

---

## 🎨 Aparência

### No Editor
- Container com borda ao passar mouse
- Badge indicando plataforma (canto superior direito)
- Embed renderizado em tempo real

### No Site Publicado
- Embeds totalmente funcionais
- Responsivos em todos os dispositivos
- Estilos nativos preservados

---

## 🔧 Solução de Problemas

### Embed não aparece no editor?

**Causas possíveis:**
1. HTML inválido ou incompleto
2. Faltou copiar o `<script>` junto

**Solução:**
- Cole o código **completo** (blockquote + script)
- Use o código **oficial** da plataforma

### TikTok mostra vídeos relacionados?

**Causa:**
- Código antigo/incompleto (só iframe)

**Solução:**
- Use o código **oficial** do TikTok (com blockquote completo)
- Deve incluir descrição, hashtags e links

### Instagram mostra "Post removido"?

**Causa:**
- Post privado/deletado
- Testando em localhost (Instagram bloqueia)

**Solução:**
- Use post de conta **pública**
- Teste em **produção** com HTTPS

### Embed não salva/desaparece ao recarregar?

**Causa:**
- Banco não salvou HTML

**Solução:**
- Salve o post após inserir
- Verifique console para erros

---

## 📱 Frontend Público

Para páginas públicas que exibem posts:

```tsx
import { EmbedProcessor } from '@/components/EmbedProcessor';

function PostPage({ post }) {
  return (
    <article>
      <h1>{post.titulo}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.conteudo }} />
      
      {/* Processa embeds automaticamente */}
      <EmbedProcessor />
    </article>
  );
}
```

---

## 🌐 Suporte a Plataformas

| Plataforma | Suportado | Formato |
|------------|-----------|---------|
| **YouTube** | ✅ | Iframe |
| **TikTok** | ✅ | Blockquote + Script |
| **Instagram** | ✅ | Blockquote + Script |
| **Spotify** | ✅ | Iframe |
| **SoundCloud** | ✅ | Iframe |
| **Vimeo** | ✅ | Iframe |
| **Twitch** | ✅ | Iframe |
| **Twitter/X** | ✅ | Blockquote + Script |
| **Facebook** | ✅ | Iframe |

**Qualquer plataforma** que forneça código HTML de embed funcionará!

---

## 💡 Dicas

### Dica 1: Copie Tudo
Sempre copie o código **completo**, incluindo scripts.

### Dica 2: Use Código Oficial
Não tente editar ou simplificar o código - use exatamente como a plataforma fornece.

### Dica 3: Teste em Produção
Instagram só funciona em produção com HTTPS. Não se preocupe se não aparecer em localhost.

### Dica 4: Atalho
Use **Ctrl+Enter** no dialog para inserir rapidamente.

### Dica 5: Modo HTML
Para código complexo, o modo HTML (`</>`) é mais confiável.

---

## ✨ Vantagens do Sistema Novo

### Para Usuários
- ✅ Processo simples: copiar e colar
- ✅ Funciona com qualquer plataforma
- ✅ Embeds completos (não fragmentados)
- ✅ Suporte futuro garantido

### Para Desenvolvedores
- ✅ Menos código para manter
- ✅ Sem regex complexos
- ✅ Sem necessidade de APIs
- ✅ Extensível automaticamente

---

## 🎉 Conclusão

O sistema de embeds agora é:
- **Universal**: Uma solução para todas as plataformas
- **Confiável**: Usa código oficial
- **Simples**: Cole e funciona
- **Expansível**: Novas plataformas funcionam automaticamente

**Status**: ✅ Pronto para produção!

---

**Documentação atualizada**: Sistema universal de embeds com HTML oficial

