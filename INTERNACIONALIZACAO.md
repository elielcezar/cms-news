# 🌍 Implementação de Internacionalização (i18n)

## Resumo da Implementação

Sistema completo de internacionalização implementado para suportar **3 idiomas**: Português (PT), Inglês (EN) e Espanhol (ES).

---

## 🎯 Funcionalidades Implementadas

### Backend

1. **Model `CategoriaTranslation`** - Prisma Schema
   - Tabela para armazenar traduções de categorias em múltiplos idiomas
   - Relacionamento `1:N` com `Categoria`
   - Índices otimizados para queries por idioma

2. **API de Categorias** (`/api/categorias`)
   - `POST /categorias` - Criar categoria com traduções em PT, EN e ES
   - `GET /categorias?lang=pt|en|es` - Listar categorias filtradas por idioma
   - `PUT /categorias/:id` - Atualizar traduções de uma categoria

3. **API de Posts** (`/api/posts`)
   - `GET /posts?lang=pt|en|es` - Retorna posts e categorias traduzidos
   - Suporte a filtros por idioma nas traduções
   - Categorias retornadas já traduzidas no idioma solicitado

4. **Sitemap Multilíngue** (`/sitemap.xml`)
   - Gera sitemap.xml com URLs de todos os idiomas
   - Tags `xhtml:link` com `hreflang` para SEO
   - URLs alternativas para cada post em todos os idiomas

### Frontend

1. **Configuração i18next**
   - Arquivo: `front/src/i18n/config.ts`
   - Detecção automática de idioma do navegador
   - Persistência em localStorage

2. **Arquivos de Tradução**
   - `front/src/i18n/locales/pt/common.json`
   - `front/src/i18n/locales/en/common.json`
   - `front/src/i18n/locales/es/common.json`
   - Traduções para menu, footer, posts, categorias, etc.

3. **LanguageContext**
   - Arquivo: `front/src/contexts/LanguageContext.tsx`
   - Provider para gerenciar idioma global
   - Hook `useLanguage()` para acessar e trocar idioma

4. **Language Switcher**
   - Arquivo: `front/src/components/LanguageSwitcher.tsx`
   - Dropdown com bandeiras dos 3 idiomas
   - Troca de idioma mantendo o mesmo path

5. **Rotas com Path-based i18n**
   - URLs no formato: `https://weloverave.club/:lang/`
   - Exemplos:
     - `https://weloverave.club/pt` (Português)
     - `https://weloverave.club/en` (Inglês)
     - `https://weloverave.club/es` (Espanhol)

6. **Componente SEO**
   - Arquivo: `front/src/components/SEO.tsx`
   - Meta tags Open Graph e Twitter Cards
   - Tags `hreflang` para cada idioma
   - URL canônica por idioma

7. **Detecção e Redirecionamento**
   - Arquivo: `front/src/components/LanguageRedirect.tsx`
   - Detecta idioma preferido do navegador
   - Redireciona automaticamente para `/:lang/`

8. **Hook Customizado**
   - Arquivo: `front/src/hooks/useLocalizedContent.ts`
   - `useLocalizedContent()` - Busca conteúdo traduzido da API
   - `useLocalizedUrl()` - Helper para construir URLs com idioma

9. **Formulário de Categorias**
   - Arquivo: `front/src/pages/admin/CategoriaForm.tsx`
   - Campos para traduzir nome da categoria em PT, EN e ES
   - PT é obrigatório, EN e ES são opcionais

10. **Lista de Categorias**
    - Arquivo: `front/src/pages/admin/Categorias.tsx`
    - Exibe traduções de cada categoria em colunas separadas
    - Busca funciona em todas as traduções

---

## 📦 Dependências Instaladas

### Backend
Nenhuma nova dependência (usa Prisma existente)

### Frontend
```bash
npm install react-i18next i18next i18next-browser-languagedetector react-helmet-async
```

---

## 🗄️ Mudanças no Banco de Dados

### Nova Tabela: `categoria_translations`

```sql
CREATE TABLE `categoria_translations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `categoriaId` INT NOT NULL,
  `idioma` VARCHAR(191) NOT NULL,
  `nome` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE KEY `categoria_translations_categoriaId_idioma_key` (`categoriaId`, `idioma`),
  KEY `categoria_translations_categoriaId_idx` (`categoriaId`),
  KEY `categoria_translations_idioma_idx` (`idioma`),
  CONSTRAINT `categoria_translations_categoriaId_fkey` 
    FOREIGN KEY (`categoriaId`) REFERENCES `categorias` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
);
```

### Mudanças na Tabela: `categorias`
- **Removido**: campo `nome` (String)
- Os nomes agora estão na tabela `categoria_translations`

---

## 🚀 Como Usar

### 1. Backend - Criar Categoria com Traduções

**Request:**
```http
POST /api/categorias
Content-Type: application/json
Authorization: Bearer <token>

{
  "translations": {
    "pt": "Música Eletrônica",
    "en": "Electronic Music",
    "es": "Música Electrónica"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "translations": [
    { "id": 1, "categoriaId": 1, "idioma": "pt", "nome": "Música Eletrônica" },
    { "id": 2, "categoriaId": 1, "idioma": "en", "nome": "Electronic Music" },
    { "id": 3, "categoriaId": 1, "idioma": "es", "nome": "Música Electrónica" }
  ]
}
```

### 2. Backend - Listar Categorias por Idioma

**Request:**
```http
GET /api/categorias?lang=en
```

**Response:**
```json
[
  {
    "id": 1,
    "nome": "Electronic Music",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 3. Backend - Buscar Posts por Idioma

**Request:**
```http
GET /api/posts?lang=es
```

**Response:**
Posts com traduções em espanhol + categorias traduzidas

### 4. Frontend - Usar Traduções de Textos Estáticos

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('nav.home')}</h1>
      <p>{t('footer.rights')}</p>
    </div>
  );
}
```

### 5. Frontend - Trocar Idioma

```tsx
import { useLanguage } from '@/contexts/LanguageContext';

function Header() {
  const { language, changeLanguage } = useLanguage();
  
  return (
    <button onClick={() => changeLanguage('en')}>
      Switch to English
    </button>
  );
}
```

Ou use o componente pronto:

```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function Header() {
  return <LanguageSwitcher />;
}
```

### 6. Frontend - Buscar Conteúdo Localizado

```tsx
import { useLocalizedContent } from '@/hooks/useLocalizedContent';

function PostList() {
  const { data: posts } = useLocalizedContent<Post[]>(
    '/posts',
    ['posts']
  );
  
  // Posts virão no idioma atual automaticamente
  return <div>{/* renderizar posts */}</div>;
}
```

### 7. Frontend - SEO com Meta Tags

```tsx
import { SEO } from '@/components/SEO';

function PostPage() {
  return (
    <>
      <SEO 
        title="Nome do Post"
        description="Descrição do post"
        image="/imagem.jpg"
        article={true}
        canonicalPath="/post-slug"
      />
      {/* Conteúdo da página */}
    </>
  );
}
```

---

## 🌐 Estrutura de URLs

### Públicas (com idioma)
- `/` → Detecta idioma e redireciona
- `/pt` → Página inicial em português
- `/en` → Página inicial em inglês
- `/es` → Página inicial em espanhol
- `/pt/post-slug` → Post em português
- `/en/post-slug` → Post em inglês
- `/es/post-slug` → Post em espanhol

### Admin (sem idioma)
- `/admin/login`
- `/admin/categorias`
- `/admin/posts`
- etc.

---

## ✅ Checklist de Implementação

- [x] Backend: Model CategoriaTranslation
- [x] Backend: API de categorias com traduções
- [x] Backend: API de posts com idioma
- [x] Backend: Sitemap multilíngue
- [x] Frontend: Instalação de dependências
- [x] Frontend: Configuração i18next
- [x] Frontend: Arquivos de tradução (PT, EN, ES)
- [x] Frontend: LanguageContext e hooks
- [x] Frontend: Language Switcher
- [x] Frontend: Componente SEO
- [x] Frontend: Rotas com path-based i18n
- [x] Frontend: Detecção automática de idioma
- [x] Frontend: Formulário de categorias traduzido
- [x] Frontend: Lista de categorias com traduções

---

## 📝 Próximos Passos Sugeridos

1. **Adicionar LanguageSwitcher no Header do site público**
2. **Criar páginas públicas do site** (Home, Post, Categorias)
3. **Implementar busca de posts** com suporte a idiomas
4. **Adicionar validação de URLs amigáveis** por idioma
5. **Configurar robots.txt** apontando para sitemap.xml
6. **Testar SEO** com Google Search Console
7. **Adicionar mais traduções** conforme necessário nos arquivos JSON

---

## 🐛 Troubleshooting

### Erro: "LanguageContext is undefined"
- Certifique-se de que o `LanguageProvider` está envolvendo suas rotas no `App.tsx`

### Categorias não aparecem traduzidas
- Verifique se o parâmetro `?lang=` está sendo enviado na requisição
- Confirme que as traduções foram criadas no banco de dados

### Redirecionamento não funciona
- Verifique se o componente `LanguageRedirect` está na rota `/`
- Confirme que o localStorage está acessível

---

## 📚 Recursos Adicionais

- [Documentação react-i18next](https://react.i18next.com/)
- [Documentação i18next](https://www.i18next.com/)
- [Hreflang Tags - Google SEO](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Sitemap Protocol](https://www.sitemaps.org/protocol.html)

---

**Implementado em:** Novembro 2024  
**Desenvolvido por:** AI Assistant (Claude)

