# Backend - Painel Administrativo CMS News

API RESTful desenvolvida com Node.js, Express, Prisma e MySQL para gerenciar o sistema de imóveis.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Prisma** - ORM para MySQL
- **MySQL** - Banco de dados relacional
- **JWT** - Autenticação baseada em tokens
- **AWS S3** - Armazenamento de imagens
- **Zod** - Validação de schemas
- **Bcrypt** - Hash de senhas

## 📋 Pré-requisitos

- Node.js 18+ instalado
- MySQL 8+ instalado e rodando
- Conta AWS com bucket S3 configurado
- Git

## 🔧 Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_URL="mysql://usuario:senha@localhost:3306/cms_news"

# JWT
JWT_SECRET="sua-chave-secreta-muito-segura"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="seu-access-key-id"
AWS_SECRET_ACCESS_KEY="sua-secret-access-key"
AWS_S3_BUCKET="nome-do-seu-bucket"

# Server
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

### 3. Criar banco de dados MySQL

```sql
CREATE DATABASE cms_news CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Executar migrations do Prisma

```bash
npm run migrate
```

### 5. (Opcional) Criar um usuário admin inicial

Execute o Prisma Studio:

```bash
npm run prisma:studio
```

Ou use um script SQL direto no MySQL:

```sql
-- Senha: admin123 (exemplo - mude em produção!)
INSERT INTO users (name, email, password, createdAt, updatedAt)
VALUES ('Admin', 'admin@cms.ecwd.cloud', '$2a$10$YourHashedPasswordHere', NOW(), NOW());
```

## 🎯 Scripts disponíveis

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start

# Migrations
npm run migrate           # Criar e aplicar migrations
npm run migrate:deploy    # Aplicar migrations em produção

# Prisma
npm run prisma:generate   # Gerar Prisma Client
npm run prisma:studio     # Abrir interface visual do banco
```

## 📡 Endpoints da API

Todas as rotas da API têm o prefixo `/api`

### Autenticação

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/api/login` | Login de usuário | Não |
| POST | `/api/refresh` | Refresh token | Não |

### Usuários

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/usuarios` | Listar usuários | Sim |
| GET | `/api/usuarios/:id` | Obter usuário por ID | Sim |
| POST | `/api/usuarios` | Criar usuário | Sim |
| PUT | `/api/usuarios/:id` | Atualizar usuário | Sim |
| DELETE | `/api/usuarios/:id` | Deletar usuário | Sim |

### Imóveis

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/imoveis` | Listar imóveis | Não |
| GET | `/api/imoveis/:codigo` | Obter imóvel por código | Não |
| GET | `/api/imoveis/id/:id` | Obter imóvel por ID | Não |
| POST | `/api/imoveis` | Criar imóvel | Sim |
| PUT | `/api/imoveis/:id` | Atualizar imóvel | Sim |
| DELETE | `/api/imoveis/:id` | Deletar imóvel | Sim |

### Tipos, Categorias e Finalidades

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/tipo` | Listar tipos | Não |
| POST | `/api/tipo` | Criar tipo | Sim |
| PUT | `/api/tipo/:id` | Atualizar tipo | Sim |
| DELETE | `/api/tipo/:id` | Deletar tipo | Sim |
| GET | `/api/categorias` | Listar categorias | Não |
| POST | `/api/categorias` | Criar categoria | Sim |
| PUT | `/api/categorias/:id` | Atualizar categoria | Sim |
| DELETE | `/api/categorias/:id` | Deletar categoria | Sim |
| GET | `/api/finalidade` | Listar finalidades | Não |
| POST | `/api/finalidade` | Criar finalidade | Sim |
| PUT | `/api/finalidade/:id` | Atualizar finalidade | Sim |
| DELETE | `/api/finalidade/:id` | Deletar finalidade | Sim |

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Para acessar rotas protegidas:

1. Faça login através de `POST /api/login`
2. Use o `accessToken` retornado no header `Authorization: Bearer {token}`

Exemplo:

```bash
# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cms.ecwd.cloud","password":"admin123"}'

# Usar token em requisições protegidas
curl -X GET http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 📦 Estrutura de pastas

```
back/
├── config/          # Configurações (Prisma, S3)
├── middleware/      # Middlewares (autenticação, validação)
├── prisma/          # Schema e migrations do Prisma
├── routes/          # Rotas da API
├── utils/           # Utilitários (JWT, erros)
├── uploads/         # Uploads locais (legado)
├── server.js        # Arquivo principal
├── package.json     # Dependências
└── .env             # Variáveis de ambiente (não commitar!)
```

## 🔒 Segurança

- Senhas são hasheadas com bcrypt antes de salvar
- Autenticação JWT em todas as rotas administrativas
- Validação de dados com Zod
- CORS configurável
- Tratamento global de erros
- Logs de requisições

## 🖼️ Upload de Imagens

As imagens dos imóveis são enviadas diretamente para o AWS S3:

- Limite de 10 imagens por imóvel
- Tamanho máximo por arquivo: 5MB
- Formatos aceitos: JPEG, JPG, PNG, WEBP
- URLs retornadas automaticamente após upload

## 🐛 Troubleshooting

### Erro de conexão com MySQL

```bash
# Verifique se o MySQL está rodando
sudo systemctl status mysql

# Verifique a string de conexão no .env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/cms_news"
```

### Erro com AWS S3

```bash
# Verifique as credenciais AWS no .env
# Verifique se o bucket existe e tem as permissões corretas
```

### Erro "Prisma Client not generated"

```bash
npm run prisma:generate
```

## 📝 Notas

- Sempre rode as migrations antes de iniciar o servidor
- Mantenha o `.env` seguro e nunca commite no Git
- Em produção, use HTTPS e configure CORS adequadamente
- Faça backup regular do banco de dados

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
2. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
3. Push para a branch (`git push origin feature/MinhaFeature`)
4. Abra um Pull Request

