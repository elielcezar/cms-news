# 🌍 Sistema de Traduções Multilíngue - Resumo

## O Que Foi Implementado

Sistema que permite posts em **3 idiomas simultâneos** (PT, EN, ES) com geração automática via IA.

---

## Arquitetura

### Banco de Dados

**Antes:**
- Campos `titulo`, `chamada`, `conteudo`, `urlAmigavel` no model `Post`

**Depois:**
- `Post` = dados base (imagens, status, datas, relacionamentos)
- `PostTranslation` = conteúdo por idioma (titulo, chamada, conteudo, urlAmigavel)
- Relacionamento: 1 Post → N Traduções (máx 3)

### Schema Prisma

```prisma
model Post {
  id             Int
  imagens        Json
  status         PostStatus
  destaque       Boolean
  dataPublicacao DateTime?
  idiomaDefault  String @default("pt")
  translations   PostTranslation[]
  // sites, tags...
}

model PostTranslation {
  id          Int
  postId      Int
  idioma      String // "pt", "en", "es"
  titulo      String
  chamada     String @db.Text
  conteudo    String @db.Text
  urlAmigavel String @unique // "pt/slug", "en/slug", "es/slug"
  post        Post
}
```

---

## URLs

```
/pt/grammy-2026-skrillex-concorre
/en/grammy-2026-skrillex-competes
/es/grammy-2026-skrillex-compite
```

Cada idioma tem URL única com prefixo = excelente para SEO.

---

## Como Funciona

### 1. Conversão de Pauta (Automático)

```
Usuário clica "Converter em Post" 
  ↓
Backend busca fontes com Jina AI
  ↓
OpenAI gera 3 notícias completas (PT, EN, ES) em ~30 seg
  ↓
Salva 1 Post + 3 PostTranslations
  ↓
Redireciona para edição (PT)
```

### 2. Criação Manual

- Cria apenas tradução PT
- Editor adiciona EN/ES depois manualmente

### 3. Edição

- Tabs PT/EN/ES no formulário
- Troca de idioma recarrega tradução específica
- Salva apenas o idioma atual
- Pode criar nova tradução se não existir

---

## API Endpoints

### Listar (com idioma)
```
GET /api/posts?lang=pt
GET /api/posts?lang=en&status=PUBLICADO
```

### Buscar por URL
```
GET /api/posts/pt/grammy-2026
GET /api/posts/en/grammy-2026
```

### Buscar por ID
```
GET /api/posts/id/123?lang=es
```

### Atualizar (especifica idioma)
```
PUT /api/posts/123?lang=en
```

### Adicionar Tradução
```
POST /api/posts/123/translations
Body: { idioma: "es", titulo: "...", chamada: "...", conteudo: "...", urlAmigavel: "..." }
```

---

## Arquivos Principais

### Backend
```
back/prisma/schema.prisma           # Schema atualizado
back/services/aiService.js          # Geração multilíngue (multilingual: true)
back/routes/pautas.js               # Conversão com 3 idiomas
back/routes/posts.js                # CRUD com suporte a lang
back/middleware/validation.js       # Aceita "/" nos slugs
```

### Frontend
```
front/src/types/admin.ts            # PostTranslation interface
front/src/services/posts.service.ts # Métodos com lang
front/src/pages/admin/Posts.tsx     # Filtro de idioma
front/src/pages/admin/PostForm.tsx  # Tabs PT/EN/ES
front/src/lib/api-config.ts         # Timeout 60s
```

---

## Comandos Importantes

### Aplicar Schema
```bash
cd back
npx prisma generate
npx prisma db push
```

### Configurar OpenAI
```bash
# Adicionar no back/.env:
OPENAI_API_KEY=sk-proj-...
```

### Reiniciar Servidor
```bash
pm2 restart all
```

### Build Frontend
```bash
cd front
npm run build
```

---

## Configurações Críticas

### Nginx (Timeouts)
```nginx
location /api {
  proxy_read_timeout 90s;
  proxy_connect_timeout 90s;
  proxy_send_timeout 90s;
  # ... resto
}
```

### Frontend (Timeout)
```typescript
// front/src/lib/api-config.ts
timeout: 60000, // 60 segundos
```

### Validação (Aceita barras)
```javascript
// back/middleware/validation.js
.regex(/^([a-z]{2}\/)?[a-z0-9]+(?:-[a-z0-9]+)*$/)
```

---

## Fluxo de Trabalho

### Para Novos Posts (via Pauta)
1. Acesse `/admin/pautas`
2. Clique "Converter em Post"
3. Aguarde ~30 segundos
4. Post criado com PT, EN, ES automaticamente
5. Edite se necessário

### Para Editar Traduções
1. Abra post para edição
2. Use tabs PT/EN/ES no topo
3. Edite o idioma desejado
4. Salve (atualiza apenas esse idioma)

### Para Adicionar Tradução Faltante
1. Abra post
2. Clique na tab do idioma faltante (ex: ES)
3. Badge mostra "Nova Tradução"
4. Preencha campos
5. Salve (cria tradução ES)

---

## Custos

- **OpenAI gpt-4o-mini**: ~$0.0005 por conversão (3 idiomas)
- **1.000 conversões/mês**: ~$0.50
- **Jina AI**: Gratuito até 1.000 req/dia

---

## Troubleshooting

### "Serviço de IA não configurado"
→ Falta `OPENAI_API_KEY` no `.env`

### Timeout na conversão
→ Aumentar timeout no Nginx e frontend

### "Post não tem tradução em pt"
→ Posts antigos não migraram. Deletar ou criar tradução manual.

### Slug com erro de validação
→ Usar formato `pt/titulo` ou apenas `titulo` (backend adiciona prefixo)

---

## Observações

- Posts antigos (pré-sistema) não têm traduções
- Conversão de pauta sempre gera 3 idiomas
- Criação manual gera apenas PT
- Listagem filtra posts que têm tradução no idioma selecionado
- Dark/Light theme adicionado no header (botão ao lado do sidebar toggle)

---

**Data:** 18/11/2025  
**Versão:** 1.0.0

Para mais detalhes técnicos, ver: `back/DOCS/MULTILINGUAL_SYSTEM.md`

