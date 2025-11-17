# ✅ Checklist de Configuração - Backend CMS News

Use este checklist para garantir que tudo está configurado corretamente.

## 📋 Pré-requisitos

- [ ] Node.js 18+ instalado
- [ ] MySQL 8+ instalado e rodando
- [ ] Conta AWS criada
- [ ] Git instalado

## 🔧 Configuração Inicial

### 1. Dependências

- [ ] Executado `npm install` na pasta `back/`
- [ ] Todas as dependências instaladas sem erros

### 2. Banco de Dados MySQL

- [ ] MySQL está rodando (`sudo systemctl status mysql` ou equivalente)
- [ ] Banco de dados `cms_news` criado
  ```sql
  CREATE DATABASE cms_news CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```
- [ ] Usuário MySQL tem permissões adequadas

### 3. Arquivo .env

- [ ] Arquivo `.env` criado na pasta `back/`
- [ ] `DATABASE_URL` configurado corretamente
- [ ] `JWT_SECRET` configurado (use uma chave forte!)
- [ ] `JWT_EXPIRES_IN` configurado (padrão: "24h")
- [ ] `JWT_REFRESH_EXPIRES_IN` configurado (padrão: "7d")
- [ ] `AWS_REGION` configurado
- [ ] `AWS_ACCESS_KEY_ID` configurado
- [ ] `AWS_SECRET_ACCESS_KEY` configurado
- [ ] `AWS_S3_BUCKET` configurado
- [ ] `PORT` configurado (padrão: 3000)
- [ ] `NODE_ENV` configurado ("development" ou "production")
- [ ] `FRONTEND_URL` configurado

### 4. AWS S3

- [ ] Bucket S3 criado
- [ ] Nome do bucket corresponde ao valor em `AWS_S3_BUCKET`
- [ ] Permissões do bucket configuradas (público para leitura, privado para escrita)
- [ ] CORS configurado no bucket
- [ ] IAM user criado com acesso ao S3
- [ ] Access Key e Secret Key salvos no `.env`

**Política CORS recomendada para o bucket:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:5173", "https://seudominio.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 5. Prisma

- [ ] Executado `npm run migrate` (cria as tabelas)
- [ ] Sem erros nas migrations
- [ ] Tabelas criadas no MySQL (verificar com `npm run prisma:studio`)

### 6. Dados Iniciais

- [ ] Usuário admin criado
  - Email configurado
  - Senha configurada (e lembrada!)
  
- [ ] Tipos de imóveis criados (opcional)
  - Casa
  - Apartamento
  - Terreno
  - Comercial
  
- [ ] Finalidades criadas (opcional)
  - Venda
  - Aluguel
  - Temporada
  
- [ ] Categorias criadas (opcional)
  - Residencial
  - Comercial
  - Luxo

## 🚀 Testes

### 1. Servidor

- [ ] Servidor inicia sem erros (`npm run dev`)
- [ ] Logs aparecem corretamente no console
- [ ] Porta correta está sendo usada

### 2. Health Check

- [ ] Endpoint `/health` responde (GET http://localhost:3000/health)
- [ ] Resposta retorna `{ "status": "ok" }`

### 3. Autenticação

- [ ] Login funciona (POST /api/login)
- [ ] Recebe `accessToken` e `refreshToken`
- [ ] Dados do usuário são retornados (SEM a senha)
- [ ] Login com senha errada retorna erro 401
- [ ] Refresh token funciona (POST /api/refresh)

### 4. Rotas Protegidas

- [ ] Requisições sem token retornam erro 401
- [ ] Requisições com token válido funcionam
- [ ] Token expirado retorna erro 401

### 5. CRUD de Usuários

- [ ] GET /api/usuarios lista usuários (com JWT)
- [ ] POST /api/usuarios cria usuário (com JWT)
- [ ] PUT /api/usuarios/:id atualiza usuário (com JWT)
- [ ] DELETE /api/usuarios/:id deleta usuário (com JWT)
- [ ] Senhas NUNCA são retornadas nas respostas

### 6. CRUD de Imóveis

- [ ] GET /api/imoveis lista imóveis (público)
- [ ] GET /api/imoveis/:codigo busca por código (público)
- [ ] POST /api/imoveis cria imóvel (com JWT)
- [ ] Upload de fotos funciona
- [ ] Fotos são enviadas para S3
- [ ] URLs das fotos no S3 são retornadas
- [ ] PUT /api/imoveis/:id atualiza imóvel (com JWT)
- [ ] DELETE /api/imoveis/:id deleta imóvel (com JWT)

### 7. Tipos, Categorias e Finalidades

- [ ] GET público funciona para todos
- [ ] POST com JWT funciona
- [ ] PUT com JWT funciona
- [ ] DELETE com JWT funciona

### 8. Validações

- [ ] Dados inválidos retornam erro 400
- [ ] Mensagens de erro são claras
- [ ] Email duplicado retorna erro 409

### 9. Upload de Imagens

- [ ] Imagens JPEG/JPG sobem corretamente
- [ ] Imagens PNG sobem corretamente
- [ ] Imagens WEBP sobem corretamente
- [ ] Arquivos muito grandes são rejeitados (>5MB)
- [ ] Tipos de arquivo inválidos são rejeitados
- [ ] Múltiplas imagens (até 10) funcionam

## 📱 Integração com Frontend

- [ ] CORS configurado corretamente
- [ ] Frontend consegue fazer login
- [ ] Frontend consegue fazer requisições autenticadas
- [ ] Frontend recebe URLs corretas das imagens
- [ ] Imagens do S3 são exibidas corretamente

## 🔒 Segurança

- [ ] Senhas são hasheadas com bcrypt
- [ ] JWT_SECRET é forte e único
- [ ] Senhas NUNCA são retornadas em nenhuma resposta
- [ ] CORS não está com `*` em produção
- [ ] Variáveis sensíveis estão no `.env` (não no código)
- [ ] `.env` está no `.gitignore`
- [ ] Erros em produção não expõem stack traces

## 📊 Banco de Dados

- [ ] Backup configurado (em produção)
- [ ] Migrations aplicadas
- [ ] Índices criados corretamente
- [ ] Relacionamentos funcionando (Cascade delete)

## 🌐 Produção (quando aplicável)

- [ ] Variáveis de ambiente de produção configuradas
- [ ] `NODE_ENV=production`
- [ ] JWT_SECRET diferente do desenvolvimento
- [ ] HTTPS configurado
- [ ] Logs de produção configurados
- [ ] Monitoramento configurado
- [ ] Backup automático do banco
- [ ] Rate limiting configurado (se necessário)
- [ ] Domain CORS configurado corretamente

## 📝 Documentação

- [ ] README.md lido e compreendido
- [ ] SETUP.md seguido completamente
- [ ] API_EXAMPLES.md testado
- [ ] MIGRATION_SUMMARY.md revisado

## 🐛 Debug

Se algo não funcionar, verifique:

### Servidor não inicia
- [ ] Porta já está em uso?
- [ ] `.env` existe e está configurado?
- [ ] Todas as dependências instaladas?

### Erro de conexão com MySQL
- [ ] MySQL está rodando?
- [ ] Credenciais no `.env` estão corretas?
- [ ] Banco de dados existe?
- [ ] Usuário tem permissões?

### JWT não funciona
- [ ] Token está sendo enviado no header Authorization?
- [ ] Formato é "Bearer TOKEN"?
- [ ] Token não expirou?

### Upload S3 falha
- [ ] Credenciais AWS estão corretas?
- [ ] Bucket existe?
- [ ] Permissões IAM estão corretas?
- [ ] Região está correta?

### CORS error
- [ ] `FRONTEND_URL` está configurado no `.env`?
- [ ] Origem está permitida no CORS?

## ✅ Pronto para Produção?

Antes de fazer deploy, TODOS os itens devem estar checados:

- [ ] Todos os testes passando
- [ ] Variáveis de ambiente de produção configuradas
- [ ] Backup do banco configurado
- [ ] Logs de produção funcionando
- [ ] Monitoramento configurado
- [ ] SSL/HTTPS configurado
- [ ] Documentação atualizada
- [ ] Time treinado para manutenção

---

**Status Final:** _____ / _____ itens completos

**Notas:**
_______________________________________________________
_______________________________________________________
_______________________________________________________

