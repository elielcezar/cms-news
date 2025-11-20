# 📰 CMS News - Sistema de Gerenciamento de Notícias com IA

> CMS moderno e multilíngue para publicação de notícias sobre música eletrônica, potencializado por Inteligência Artificial

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.2-2D3748?logo=prisma)](https://www.prisma.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai)](https://openai.com/)

---

## 🎯 **Visão Geral**

O **CMS News** é uma plataforma completa de gerenciamento de conteúdo especializada em notícias de música eletrônica, que combina automação e inteligência artificial para otimizar todo o fluxo de trabalho jornalístico:

### **🌟 Diferenciais**

- 🤖 **Geração Automática de Pautas**: IA analisa fontes RSS e sugere tópicos relevantes
- 🌍 **Conteúdo Multilíngue**: Geração automática em **Português, Inglês e Espanhol**
- ✍️ **Redação com IA**: OpenAI GPT-4o-mini cria artigos completos a partir de pautas
- 🔄 **Workflow Inteligente**: Da sugestão de pauta até a publicação em 3 idiomas
- 🎨 **Interface Moderna**: UI construída com Shadcn/UI e TailwindCSS
- 📱 **Totalmente Responsivo**: Funciona perfeitamente em desktop, tablet e mobile

---

## 🏗️ **Arquitetura**

```
cms-news/
├── front/          # Frontend SPA (React + TypeScript)
│   ├── src/
│   │   ├── pages/admin/      # Páginas administrativas
│   │   ├── components/       # Componentes UI (Shadcn)
│   │   ├── services/         # Integração com API
│   │   ├── i18n/             # Internacionalização
│   │   └── ...
│   └── package.json
│
└── back/           # Backend API (Node.js + Express)
    ├── routes/               # Endpoints REST
    ├── services/             # Lógica de negócio + IA
    ├── middleware/           # Auth, validação
    ├── prisma/               # Schema e migrations
    ├── config/               # Configurações (S3, DB)
    └── server.js
```

---

## 🛠️ **Stack Tecnológica**

### **Frontend**
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **React** | 18.3 | Framework UI |
| **TypeScript** | 5.8 | Type safety |
| **Vite** | 5.4 | Build tool |
| **TailwindCSS** | 3.4 | Estilização |
| **Shadcn/UI** | Latest | Componentes |
| **React Query** | 5.83 | Estado assíncrono |
| **React Router** | 6.30 | Roteamento |
| **i18next** | 25.6 | Internacionalização |
| **TipTap** | 3.10 | Editor WYSIWYG |
| **Axios** | 1.13 | HTTP client |

### **Backend**
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Node.js** | 20+ | Runtime |
| **Express** | 4.21 | Framework web |
| **Prisma** | 6.2 | ORM |
| **MySQL** | 8.0+ | Database |
| **OpenAI API** | GPT-4o-mini | Geração de conteúdo |
| **Jina AI Reader** | Latest | Extração de conteúdo |
| **AWS S3** | SDK v3 | Armazenamento de mídia |
| **JWT** | 9.0 | Autenticação |
| **Bcrypt** | 5.1 | Hash de senhas |

---

## ⚡ **Principais Features**

### 1️⃣ **Sistema de Sugestões de Pauta (AI-Powered)**

📍 **Arquivo**: `front/src/pages/admin/Pautas.tsx`

- 🔍 **Busca Automatizada**: Integração com n8n para monitorar fontes RSS
- 🤖 **Análise Inteligente**: IA usa Jina AI Reader para extrair e analisar conteúdo
- 💡 **Sugestões Contextualizadas**: OpenAI gera pautas relevantes com:
  - Assunto chamativo
  - Resumo conciso
  - Fontes relacionadas
- ✅ **Gerenciamento**: Marcar como lida, visualizar detalhes, excluir
- 🔄 **Conversão Rápida**: Transformar pauta em post completo com um clique

**Fluxo:**
```
Fontes RSS → Jina AI (extração) → OpenAI (análise) → Sugestões de Pauta
```

### 2️⃣ **Geração de Conteúdo Multilíngue**

📍 **Arquivo**: `back/services/aiService.js`

- 🌐 **3 Idiomas Simultâneos**: PT, EN, ES em uma única chamada
- 🎯 **Adaptação Cultural**: Não é tradução literal - cada versão é adaptada
- ✍️ **Conteúdo Rico**: Gera título, chamada e HTML completo
- 📊 **Controle de Tokens**: Otimizado para 300-500 palavras por idioma
- 🔗 **URLs Amigáveis**: Cada idioma tem sua própria URL SEO-friendly

**Exemplo de resposta:**
```json
{
  "pt": {
    "titulo": "Tiësto anuncia turnê mundial para 2025",
    "chamada": "DJ holandês visitará 50 cidades em 5 continentes",
    "conteudo": "<p>...</p>"
  },
  "en": {
    "titulo": "Tiësto Announces 2025 World Tour",
    "chamada": "Dutch DJ set to visit 50 cities across 5 continents",
    "conteudo": "<p>...</p>"
  },
  "es": {
    "titulo": "Tiësto anuncia gira mundial para 2025",
    "chamada": "El DJ holandés visitará 50 ciudades en 5 continentes",
    "conteudo": "<p>...</p>"
  }
}
```

### 3️⃣ **Sistema de Posts**

- 📝 **Editor WYSIWYG**: TipTap para edição rica de texto
- 🖼️ **Upload de Imagens**: Armazenamento em AWS S3
- 🏷️ **Taxonomia Completa**: Categorias e tags
- 📅 **Agendamento**: Publicação programada
- ⭐ **Destaques**: Sistema de posts em evidência
- 🌍 **Multilíngue**: Traduções independentes por idioma
- 🔗 **URLs Amigáveis**: SEO otimizado (ex: `pt/noticia-legal`, `en/cool-news`)

### 4️⃣ **Internacionalização Frontend**

📍 **Arquivo**: `front/src/i18n/config.ts`

- 🌐 Auto-detecção de idioma do navegador
- 💾 Persistência da preferência no localStorage
- 🔄 Troca de idioma em tempo real
- 📚 Arquivos de tradução organizados por namespace

### 5️⃣ **Outras Features**

- 👥 **Gestão de Usuários**: Controle de acesso e permissões
- 📰 **Fontes RSS**: Cadastro e gerenciamento de fontes
- 🗂️ **Categorias e Tags**: Organização de conteúdo
- 🗺️ **Sitemap Automático**: Geração dinâmica para SEO
- 📊 **Dashboard**: Métricas e estatísticas

---

## 🚀 **Instalação e Configuração**

### **Pré-requisitos**

- Node.js 20+ e npm/yarn
- MySQL 8.0+
- Conta AWS (para S3)
- Chave API OpenAI
- (Opcional) n8n configurado para automação de pautas

### **1. Clone o repositório**

```bash
git clone https://github.com/elielcezar/cms-news.git
cd cms-news
```

### **2. Configure o Backend**

```bash
cd back
npm install
```

Crie o arquivo `.env`:

```env
# Database
DATABASE_URL="mysql://usuario:senha@localhost:3306/cms_news"

# OpenAI
OPENAI_API_KEY="sk-..."

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_BUCKET_NAME="cms-news-uploads"

# Server
PORT=3000
NODE_ENV=development

# Frontend URLs (CORS)
FRONTEND_URL="http://localhost:5173,https://seu-frontend.com"

# JWT
JWT_SECRET="seu-secret-super-seguro-aqui"
JWT_EXPIRES_IN="7d"

# n8n (opcional)
N8N_WEBHOOK_URL="https://sua-instancia.n8n.cloud/webhook/..."
N8N_API_KEY="..."
```

Execute as migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

Inicie o servidor:

```bash
npm run dev
```

### **3. Configure o Frontend**

```bash
cd ../front
npm install
```

Crie os arquivos de ambiente:

**`.env.development`:**
```env
VITE_API_URL=http://localhost:3000/api
VITE_BASE_URL=http://localhost:3000
```

**`.env.production`:**
```env
VITE_API_URL=https://api.seu-dominio.com/api
VITE_BASE_URL=https://api.seu-dominio.com
```

Inicie o frontend:

```bash
npm run dev
```

Acesse: `http://localhost:5173`

---

## 📖 **Guia de Uso**

### **Fluxo de Trabalho Completo**

```mermaid
graph TD
    A[1. Cadastrar Fontes RSS] --> B[2. Gerar Sugestões de Pauta]
    B --> C[3. Analisar Sugestões]
    C --> D[4. Converter Pauta em Post com IA]
    D --> E[5. Revisar e Editar]
    E --> F[6. Publicar em 3 Idiomas]
```

### **1. Cadastrar Fontes RSS**

- Acesse **Admin → Fontes**
- Adicione URLs de blogs/sites de música eletrônica
- Ex: `https://mixmag.com.br/feed`, `https://housemag.com.br/feed`

### **2. Gerar Pautas**

- Acesse **Admin → Pautas**
- Clique em **"Buscar Pautas"**
- Aguarde a IA analisar as fontes (~30s)
- Visualize sugestões geradas automaticamente

### **3. Converter em Post**

- Clique no ícone **📝 Converter em Post**
- Aguarde a IA gerar o conteúdo em 3 idiomas (~15s)
- Você será redirecionado para o editor

### **4. Revisar e Publicar**

- Edite título, chamada e conteúdo em cada idioma
- Adicione imagens
- Selecione categorias e tags
- Defina status (rascunho/publicado)
- Agende publicação (opcional)
- Salve

---

## 🔌 **API Endpoints Principais**

### **Autenticação**
```
POST   /api/login                    # Login
POST   /api/usuarios                 # Criar usuário
GET    /api/usuarios/me              # Perfil atual
```

### **Pautas**
```
GET    /api/pautas                   # Listar pautas
POST   /api/pautas/gerar             # Gerar via IA
POST   /api/pautas/:id/convert       # Converter em post
PUT    /api/pautas/:id/read          # Marcar como lida
DELETE /api/pautas/:id               # Excluir
```

### **Posts**
```
GET    /api/posts?lang=pt            # Listar posts
GET    /api/posts/id/:id?lang=pt     # Obter por ID
GET    /api/posts/url/:url           # Obter por URL
POST   /api/posts                    # Criar
PUT    /api/posts/:id                # Atualizar
DELETE /api/posts/:id                # Excluir
```

### **Outros**
```
GET    /api/categorias               # Listar categorias
GET    /api/tags                     # Listar tags
GET    /api/fontes                   # Listar fontes
POST   /api/upload                   # Upload de imagem
GET    /sitemap.xml                  # Sitemap
```

---

## 🗄️ **Estrutura do Banco de Dados**

### **Principais Tabelas**

```prisma
model Post {
  id              Int      @id @default(autoincrement())
  urlAmigavel     String   @unique
  status          String   // "publicado" | "rascunho"
  destaque        Boolean
  dataPublicacao  DateTime
  imagemDestaque  String?
  
  translations    PostTranslation[]
  categorias      PostCategoria[]
  tags            PostTag[]
}

model PostTranslation {
  idioma      String   // "pt" | "en" | "es"
  titulo      String
  chamada     String
  conteudo    String   @db.Text
  urlAmigavel String
  
  post        Post     @relation(...)
}

model Pauta {
  id        Int      @id @default(autoincrement())
  assunto   String
  resumo    String   @db.Text
  fontes    Json     // Array de {nome, url}
  lida      Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Fonte {
  id          Int      @id @default(autoincrement())
  titulo      String
  url         String   @unique
  ativo       Boolean  @default(true)
  descricao   String?
}
```

---

## 🤖 **Como Funciona a IA**

### **1. Geração de Pautas**

**Função**: `generatePautasWithAI()` em `back/services/aiService.js`

1. Busca conteúdo das fontes RSS usando **Jina AI Reader**
2. Envia para **OpenAI GPT-4o-mini** com prompt especializado
3. IA analisa e identifica notícias relevantes dos últimos 7 dias
4. Retorna array de sugestões estruturadas

**Prompt resumido:**
> "Você é um editor de notícias de música eletrônica. Analise estes conteúdos e sugira pautas interessantes com assunto, resumo e fontes."

### **2. Geração de Conteúdo**

**Função**: `generateNewsWithAI()` em `back/services/aiService.js`

1. Recebe pauta + conteúdos das fontes
2. Envia para OpenAI com parâmetro `multilingual: true`
3. IA gera simultaneamente:
   - Versão PT adaptada para público brasileiro
   - Versão EN adaptada para público internacional
   - Versão ES adaptada para público hispano
4. Cada versão tem título, chamada e HTML completo

**Características:**
- 🎯 Temperatura: 0.7 (equilibra criatividade e consistência)
- 📊 Max tokens: 4000 (multilíngue) ou 2000 (single)
- 🔄 Retry automático em caso de erro
- ✅ Validação de JSON e estrutura

---

## 🌐 **Sistema Multilíngue**

### **Como Funciona**

1. **Backend** armazena traduções na tabela `PostTranslation`
2. **Frontend** envia parâmetro `?lang=pt|en|es` nas requisições
3. **API** retorna apenas a tradução solicitada no nível raiz do JSON
4. **URLs amigáveis** são únicas por idioma:
   - PT: `/pt/tiesto-anuncia-turnê`
   - EN: `/en/tiesto-announces-tour`
   - ES: `/es/tiesto-anuncia-gira`

### **Trocar Idioma no Frontend**

```typescript
import { useTranslation } from 'react-i18next';

const { i18n, t } = useTranslation();

// Trocar idioma
i18n.changeLanguage('en');

// Usar tradução
<h1>{t('common:welcome')}</h1>
```

---

## 📝 **Scripts Úteis**

### **Backend**
```bash
npm run dev              # Desenvolvimento com hot reload
npm start                # Produção
npm run migrate          # Rodar migrations
npm run prisma:studio    # Visualizar banco de dados
```

### **Frontend**
```bash
npm run dev              # Desenvolvimento
npm run build            # Build de produção
npm run build:dev        # Build de desenvolvimento
npm run preview          # Preview do build
```

---

## 🐛 **Troubleshooting**

### **Erro: "OPENAI_API_KEY não configurada"**
- Verifique se o `.env` no backend tem a chave válida
- Teste a chave em: `https://platform.openai.com/api-keys`

### **Erro: "Failed to fetch posts"**
- Confira se o backend está rodando (`http://localhost:3000/health`)
- Verifique a variável `VITE_API_URL` no frontend
- Cheque logs de CORS no console do navegador

### **Imagens não carregam**
- Valide credenciais AWS no `.env`
- Confirme permissões do bucket S3
- Verifique se o bucket é público ou tem CDN

### **IA demora muito**
- OpenAI pode ter latência variável (5-30s)
- Considere aumentar timeout nas requisições
- Use modelo `gpt-3.5-turbo` para respostas mais rápidas (porém menor qualidade)

---

## 🚧 **Roadmap**

- [ ] Agendamento automático de busca de pautas
- [ ] Integração com redes sociais (auto-post)
- [ ] Sistema de comentários
- [ ] Analytics e métricas de engajamento
- [ ] PWA para mobile
- [ ] Notificações push
- [ ] Sistema de newsletter
- [ ] Busca avançada com Elasticsearch
- [ ] Preview de notícias antes de publicar
- [ ] Versionamento de conteúdo

---

## 📄 **Licença**

Este projeto é privado e proprietário.

---

## 👨‍💻 **Autor**

**Eliel Cezar**

- GitHub: [@elielcezar](https://github.com/elielcezar)

---

## 🙏 **Agradecimentos**

- [OpenAI](https://openai.com/) pela API GPT
- [Jina AI](https://jina.ai/) pelo Reader
- [Shadcn](https://ui.shadcn.com/) pelos componentes
- [Vercel](https://vercel.com/) pelo Vite

---

<div align="center">

**[⬆ Voltar ao topo](#-cms-news---sistema-de-gerenciamento-de-notícias-com-ia)**

---

Feito com ❤️ e muito ☕

</div>
