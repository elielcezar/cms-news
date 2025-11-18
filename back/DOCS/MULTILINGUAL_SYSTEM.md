# 🌍 Sistema Multilíngue de Posts

Este documento descreve a arquitetura e funcionamento do sistema de posts multilíngue implementado no CMS News.

## 📋 Visão Geral

O sistema permite que cada post tenha traduções em **3 idiomas**:
- 🇧🇷 **PT** (Português) - Idioma padrão
- 🇺🇸 **EN** (English)
- 🇪🇸 **ES** (Español)

### Características Principais

✅ Geração automática de posts em 3 idiomas via IA
✅ URLs com prefixo de idioma (`/pt/slug`, `/en/slug`, `/es/slug`)
✅ Edição independente de cada tradução
✅ Listagem e visualização por idioma
✅ API com suporte a query parameter `?lang=pt|en|es`

---

## 🗄️ Estrutura do Banco de Dados

### Model `Post` (Base)

Armazena dados compartilhados entre todas as traduções:

```prisma
model Post {
  id              Int              @id @default(autoincrement())
  imagens         Json             // Array de URLs das imagens no S3
  status          PostStatus       @default(RASCUNHO)
  destaque        Boolean          @default(false)
  dataPublicacao  DateTime?
  idiomaDefault   String           @default("pt")
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  sites           PostSite[]
  tags            PostTag[]
  translations    PostTranslation[]
}
```

### Model `PostTranslation`

Armazena o conteúdo de cada tradução:

```prisma
model PostTranslation {
  id          Int      @id @default(autoincrement())
  postId      Int
  idioma      String   // "pt", "en", "es"
  titulo      String
  chamada     String   @db.Text
  conteudo    String   @db.Text
  urlAmigavel String   @unique // Ex: pt/grammy-2026, en/grammy-2026, es/grammy-2026
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  post        Post     @relation(...)
  
  @@unique([postId, idioma])
  @@index([postId, idioma, urlAmigavel])
}
```

**Pontos Importantes:**
- 1 Post pode ter N traduções (máximo 3 atualmente)
- Campo `urlAmigavel` é **único globalmente** e inclui prefixo de idioma
- Relacionamento 1:N entre `Post` e `PostTranslation`
- Cascade delete: deletar Post deleta todas traduções

---

## 🤖 Geração Multilíngue com IA

### Fluxo de Conversão de Pauta

1. **Usuário** clica em "Converter em Post" na lista de pautas
2. **Backend** busca conteúdo das fontes com Jina AI
3. **OpenAI** gera notícia completa em 3 idiomas simultâneos
4. **Backend** cria:
   - 1 registro em `Post` (base)
   - 3 registros em `PostTranslation` (PT, EN, ES)
5. **Frontend** redireciona para edição (idioma PT por padrão)

### Configuração da IA

**Serviço:** `back/services/aiService.js`

**Função:** `generateNewsWithAI({ multilingual: true })`

**Modelo:** `gpt-4o-mini`

**Parâmetros:**
```javascript
{
  temperature: 0.7,
  max_tokens: 4000, // Aumentado para 3 idiomas
  multilingual: true
}
```

**Formato de Resposta Esperado:**

```json
{
  "pt": {
    "titulo": "Grammy 2026: Skrillex concorre em duas categorias",
    "chamada": "DJ americano disputa prêmio...",
    "conteudo": "<p>Conteúdo completo em HTML...</p>"
  },
  "en": {
    "titulo": "Grammy 2026: Skrillex Competes in Two Categories",
    "chamada": "American DJ vies for award...",
    "conteudo": "<p>Full content in HTML...</p>"
  },
  "es": {
    "titulo": "Grammy 2026: Skrillex compite en dos categorías",
    "chamada": "DJ estadounidense disputa premio...",
    "conteudo": "<p>Contenido completo en HTML...</p>"
  }
}
```

**Prompt Especial:**
- Solicita adaptação cultural (não apenas tradução literal)
- Mantém tom profissional em todos idiomas
- 300-500 palavras por versão

---

## 🔌 API Endpoints

### GET `/api/posts`

Lista posts com suporte a idioma.

**Query Parameters:**
- `lang` - Idioma (`pt`, `en`, `es`) - Default: `pt`
- `status` - Filtrar por status
- `destaque` - Filtrar destacados
- `site` - Filtrar por site
- `tag` - Filtrar por tag

**Exemplo:**
```bash
GET /api/posts?lang=en&status=PUBLICADO
```

**Resposta:**
```json
[
  {
    "id": 1,
    "titulo": "Grammy 2026: Skrillex Competes...",
    "chamada": "American DJ vies...",
    "conteudo": "<p>...",
    "urlAmigavel": "en/grammy-2026-skrillex",
    "imagens": ["https://..."],
    "status": "PUBLICADO",
    "translationsAvailable": ["pt", "en", "es"]
  }
]
```

### GET `/api/posts/:lang/:slug`

Obter post por URL amigável.

**Exemplo:**
```bash
GET /api/posts/en/grammy-2026-skrillex
```

### GET `/api/posts/id/:id`

Obter post por ID com idioma específico.

**Query Parameters:**
- `lang` - Idioma (default: `pt`)

**Exemplo:**
```bash
GET /api/posts/id/123?lang=es
```

### POST `/api/posts`

Criar novo post (cria tradução PT por padrão).

**Body:**
```json
{
  "titulo": "Título em português",
  "chamada": "Chamada...",
  "conteudo": "<p>...",
  "urlAmigavel": "titulo-do-post",
  "status": "RASCUNHO"
}
```

**Comportamento:**
- Adiciona automaticamente prefixo `pt/` no slug
- Cria 1 Post + 1 PostTranslation (PT)
- Outros idiomas podem ser adicionados depois

### PUT `/api/posts/:id`

Atualizar post e/ou tradução específica.

**Query Parameters:**
- `lang` - Idioma da tradução a atualizar (default: `pt`)

**Exemplo:**
```bash
PUT /api/posts/123?lang=en
```

**Body:**
```json
{
  "titulo": "Updated title",
  "chamada": "Updated subtitle",
  "conteudo": "<p>Updated content...",
  "status": "PUBLICADO"
}
```

**Comportamento:**
- Atualiza campos do Post base (status, imagens, etc)
- Atualiza tradução no idioma especificado
- Se tradução não existe, cria nova

### POST `/api/posts/:id/translations`

Endpoint dedicado para adicionar/atualizar tradução.

**Body:**
```json
{
  "idioma": "es",
  "titulo": "Título en español",
  "chamada": "Subtítulo...",
  "conteudo": "<p>...",
  "urlAmigavel": "titulo-del-post"
}
```

### DELETE `/api/posts/:id`

Deletar post (cascade: deleta todas traduções).

---

## 💻 Frontend - Interface do Usuário

### Listagem de Posts (`/admin/posts`)

**Recursos:**
- Dropdown de seleção de idioma (PT, EN, ES)
- Busca funciona no idioma selecionado
- Mostra apenas posts com tradução no idioma escolhido

**Componente:** `front/src/pages/admin/Posts.tsx`

### Formulário de Post (`/admin/posts/:id/editar`)

**Recursos:**
- Tabs de idioma no topo do formulário
- Troca dinâmica entre idiomas
- Badge indica quais traduções existem
- "Nova Tradução" aparece se idioma não existe
- Salva tradução específica

**Componente:** `front/src/pages/admin/PostForm.tsx`

**UX:**
1. Ao trocar idioma, recarrega tradução correspondente
2. Se tradução não existe, campos ficam vazios
3. Ao salvar, atualiza apenas o idioma atual
4. Não redireciona após salvar (permite editar outros idiomas)

### Conversão de Pauta (`/admin/pautas`)

**Fluxo:**
1. Clicar em "Converter em Post"
2. Toast: "Gerando notícias em 3 idiomas..."
3. Aguardar ~20-30 segundos
4. Toast: "Post criado em 3 idiomas (PT, EN, ES)"
5. Redireciona para edição (PT por padrão)

---

## 🎨 URLs Públicas

### Estrutura

```
/pt/grammy-2026-skrillex-concorre
/en/grammy-2026-skrillex-competes
/es/grammy-2026-skrillex-compite
```

### Benefícios SEO

✅ Google indexa cada idioma separadamente
✅ URLs autodescritivas (idioma visível)
✅ Ranqueamento por país/idioma
✅ Fácil alternar idiomas (trocar prefixo)

---

## 💰 Custos por Conversão

### OpenAI (gpt-4o-mini)

**Input:** $0.15 / 1M tokens
**Output:** $0.60 / 1M tokens

**Estimativa por conversão:**
- Input: ~2.500 tokens (fontes + prompt)
- Output: ~2.000 tokens (3 notícias)
- **Total: ~$0.0005 por conversão**

**1.000 conversões/mês = ~$0.50/mês**

### Jina AI Reader

- Gratuito até 1.000 requisições/dia
- Sem necessidade de API Key

---

## 🔧 Configuração e Deploy

### Variáveis de Ambiente

```env
# Backend (.env)
OPENAI_API_KEY=sk-proj-...
DATABASE_URL=mysql://...
```

### Migration

```bash
# 1. Gerar Prisma Client
cd back
npm run prisma:generate

# 2. Executar migration
npx prisma migrate dev --name add_post_translations

# 3. Migrar posts existentes
node migrate-existing-posts.js
```

**⚠️ IMPORTANTE:** Faça backup do banco antes da migration!

Ver: `back/MIGRATION_MULTILINGUAL.md`

---

## 🧪 Testando o Sistema

### 1. Converter Pauta

```bash
# No frontend:
1. Ir em /admin/pautas
2. Clicar em "Converter em Post" 
3. Aguardar geração (3 idiomas)
4. Verificar redirecionamento para edição
```

### 2. Editar Traduções

```bash
# No frontend:
1. Abrir post para edição
2. Trocar entre tabs PT/EN/ES
3. Verificar conteúdo de cada idioma
4. Fazer alterações
5. Salvar (atualiza apenas idioma atual)
```

### 3. Visualizar por Idioma

```bash
# API:
GET /api/posts?lang=en
GET /api/posts/id/1?lang=es
GET /api/posts/pt/grammy-2026

# Frontend:
- Selecionar idioma no dropdown da listagem
- Ver apenas posts com tradução no idioma
```

---

## 🚀 Próximas Melhorias

- [ ] Adicionar mais idiomas (FR, DE, IT)
- [ ] Tradução sob demanda (não gerar todos ao converter)
- [ ] Sugestão automática de tags por idioma
- [ ] Extração de imagens das fontes
- [ ] Preview da notícia antes de salvar
- [ ] Comparação lado a lado de traduções
- [ ] Histórico de versões por tradução
- [ ] Suporte a outras IAs (Anthropic, Google)

---

## 📞 Suporte

**Documentos Relacionados:**
- `MIGRATION_MULTILINGUAL.md` - Processo de migração
- `API_PAUTAS.md` - API de pautas
- `CONVERSAO_PAUTA_IA.md` - Detalhes da conversão

**Arquivos do Sistema:**
- Backend: `back/services/aiService.js`, `back/routes/pautas.js`, `back/routes/posts.js`
- Frontend: `front/src/pages/admin/Posts.tsx`, `front/src/pages/admin/PostForm.tsx`
- Types: `front/src/types/admin.ts`
- Services: `front/src/services/posts.service.ts`

---

## ✅ Checklist de Validação

Após implementação, verificar:

- [ ] Migration executada sem erros
- [ ] Posts antigos migrados com prefixo `pt/`
- [ ] Conversão de pauta gera 3 idiomas
- [ ] Listagem filtra por idioma corretamente
- [ ] Formulário troca idiomas dinamicamente
- [ ] URLs públicas funcionam com prefixo
- [ ] API retorna idioma correto em `?lang=`
- [ ] Custos OpenAI dentro do esperado
- [ ] SEO: cada idioma indexado separadamente

---

**Última atualização:** 18/11/2025
**Versão:** 1.0.0

