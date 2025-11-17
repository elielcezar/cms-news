# 🚀 Guia de Setup - Backend CMS News

Este documento descreve os passos necessários para configurar e rodar o backend pela primeira vez.

## ⚠️ IMPORTANTE - Mudanças do Projeto Original

Este projeto foi completamente refatorado de MongoDB para MySQL. **NÃO aproveite dados do banco antigo.**

### O que mudou:

1. ✅ **MongoDB → MySQL**: Schema completamente convertido
2. ✅ **Autenticação JWT**: Implementada com tokens de acesso e refresh
3. ✅ **AWS S3**: Upload de imagens agora vai direto para S3 (não mais local)
4. ✅ **Validações**: Zod implementado para validar todos os inputs
5. ✅ **Segurança**: Senhas nunca mais são retornadas nas respostas
6. ✅ **Proteção de rotas**: JWT necessário para operações administrativas
7. ✅ **Error handling**: Tratamento global de erros implementado
8. ✅ **Prisma Singleton**: Uma única instância reutilizável

## 📝 Passo a Passo

### 1. Criar arquivo .env

Crie um arquivo `.env` na pasta `back/` com o seguinte conteúdo:

```env
# Database Configuration
DATABASE_URL="mysql://root:sua_senha@localhost:3306/cms_news"

# JWT Authentication - MUDE ESTA CHAVE EM PRODUÇÃO!
JWT_SECRET="sua-chave-super-secreta-aqui"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# AWS S3 Configuration
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="sua-aws-key"
AWS_SECRET_ACCESS_KEY="sua-aws-secret"
AWS_S3_BUCKET="cms-news-media"

# Server
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

**Dica**: Gere uma chave JWT segura com:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Instalar dependências

```bash
cd back
npm install
```

### 3. Configurar MySQL

```bash
# Entre no MySQL
mysql -u root -p

# Crie o banco de dados
CREATE DATABASE cms_news CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Saia do MySQL
exit
```

### 4. Executar migrations do Prisma

```bash
# Isso vai criar todas as tabelas no MySQL
npx prisma migrate deploy
```

### 5. Criar primeiro usuário admin

Você pode usar o Prisma Studio:

```bash
npm run prisma:studio
```

Ou inserir diretamente no MySQL:

```sql
-- Entre no MySQL novamente
mysql -u root -p

-- Use o banco
USE cms_news;

-- Crie o usuário admin (senha: admin123)
-- ATENÇÃO: Este hash é para a senha "admin123" - MUDE EM PRODUÇÃO!
INSERT INTO users (name, email, password, createdAt, updatedAt)
VALUES (
  'Administrador',
  'admin@cms.ecwd.cloud',
  '$2a$10$YourHashedPasswordHere',
  NOW(),
  NOW()
);
```

**Para gerar um hash de senha em Node.js:**

```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('sua_senha_aqui', 10);
console.log(hash);
```

Ou use este snippet rápido:

```bash
node -e "console.log(require('bcryptjs').hashSync('admin123', 10))"
```

### 6. (Opcional) Popular dados iniciais

Você pode criar tipos, categorias e finalidades básicas:

```sql
-- Tipos de imóveis
INSERT INTO tipos (nome, createdAt, updatedAt) VALUES
('Casa', NOW(), NOW()),
('Apartamento', NOW(), NOW()),
('Terreno', NOW(), NOW()),
('Comercial', NOW(), NOW()),
('Rural', NOW(), NOW());

-- Finalidades
INSERT INTO finalidades (nome, createdAt, updatedAt) VALUES
('Venda', NOW(), NOW()),
('Aluguel', NOW(), NOW()),
('Temporada', NOW(), NOW());

-- Categorias
INSERT INTO categorias (nome, createdAt, updatedAt) VALUES
('Residencial', NOW(), NOW()),
('Comercial', NOW(), NOW()),
('Industrial', NOW(), NOW()),
('Rural', NOW(), NOW());
```

### 7. Configurar AWS S3

1. Acesse o console da AWS
2. Crie um bucket S3 (ex: `cms-news-media`)
3. Configure permissões adequadas para upload
4. Crie uma IAM user com acesso ao S3
5. Copie as credenciais para o `.env`

**Política IAM recomendada para o usuário:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::cms-news-media/*",
        "arn:aws:s3:::cms-news-media"
      ]
    }
  ]
}
```

### 8. Iniciar o servidor

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Ou produção
npm start
```

Você deve ver:

```
🚀 Servidor rodando na porta 3000
📍 Ambiente: development
🔗 Health check: http://localhost:3000/health
📡 API Base URL: http://localhost:3000/api
```

### 9. Testar a API

```bash
# Health check
curl http://localhost:3000/health

# Fazer login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cms.ecwd.cloud","password":"admin123"}'

# Listar imóveis (público)
curl http://localhost:3000/api/imoveis
```

## 🔐 Endpoints Principais

### Públicos (sem autenticação)
- `GET /health` - Status do servidor
- `POST /api/login` - Login
- `GET /api/imoveis` - Listar imóveis
- `GET /api/imoveis/:codigo` - Ver imóvel específico
- `GET /api/tipo` - Listar tipos
- `GET /api/categorias` - Listar categorias
- `GET /api/finalidade` - Listar finalidades

### Protegidos (requer JWT)
- Todas as rotas POST, PUT, DELETE
- `GET /api/usuarios` - Listar usuários

## 📊 Estrutura do Banco de Dados

```
users (usuários do sistema)
  ├── id (INT, PK, autoincrement)
  ├── email (STRING, unique)
  ├── name (STRING)
  ├── password (STRING, hashed)
  ├── createdAt (DATETIME)
  └── updatedAt (DATETIME)

imoveis (propriedades)
  ├── id (INT, PK)
  ├── titulo (STRING)
  ├── codigo (STRING, unique)
  ├── descricaoCurta (TEXT)
  ├── descricaoLonga (TEXT)
  ├── fotos (JSON - array de URLs S3)
  ├── valor (STRING)
  ├── endereco (STRING)
  ├── cidade (STRING)
  ├── createdAt (DATETIME)
  └── updatedAt (DATETIME)

tipos → imovel_tipos ← imoveis (relação N:N)
categorias → imovel_categorias ← imoveis (relação N:N)
finalidades → imovel_finalidades ← imoveis (relação N:N)
```

## 🐛 Problemas Comuns

### "Prisma Client not generated"
```bash
npm run prisma:generate
```

### "Cannot connect to MySQL"
- Verifique se o MySQL está rodando: `sudo systemctl status mysql`
- Verifique a string de conexão no `.env`
- Verifique usuário e senha

### "AWS S3 upload failed"
- Verifique as credenciais AWS no `.env`
- Verifique se o bucket existe e tem as permissões corretas
- Verifique se a região está correta

### "Token inválido"
- O token JWT expira em 24h por padrão
- Use a rota `/api/refresh` com o refreshToken para renovar

## 📚 Próximos Passos

Após setup completo:

1. ✅ Configure o frontend para usar a nova API
2. ✅ Atualize as URLs das requisições (agora com prefixo `/api`)
3. ✅ Implemente o sistema de autenticação JWT no frontend
4. ✅ Teste o upload de imagens para S3
5. ✅ Configure variáveis de produção quando for fazer deploy

## 🔒 Segurança em Produção

Antes de colocar em produção:

- [ ] Mude o `JWT_SECRET` para uma chave forte
- [ ] Configure CORS adequadamente (não use `*`)
- [ ] Use HTTPS
- [ ] Configure rate limiting
- [ ] Faça backup regular do banco
- [ ] Use variáveis de ambiente seguras (não commite o `.env`)
- [ ] Revise permissões do S3
- [ ] Configure logs adequados

## 📞 Suporte

Se encontrar problemas, verifique:
1. Logs do servidor (`console.log`)
2. Prisma Studio (`npm run prisma:studio`)
3. MySQL logs
4. AWS CloudWatch (para problemas com S3)

