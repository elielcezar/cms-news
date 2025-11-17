# 🚀 Guia Rápido de Início

Este guia te ajudará a colocar o projeto rodando em **5 minutos**!

## ⚡ Setup Rápido

### 1️⃣ Pré-requisitos
- Node.js v18+
- MySQL rodando
- Credenciais AWS S3

### 2️⃣ Backend Setup (2 minutos)

```bash
# Entre na pasta do backend
cd back

# Instale dependências
npm install

# Copie o .env de exemplo
```env
# API Base URL
VITE_API_BASE_URL=http://localhost:3004/api
```

# Edite o .env com suas configurações
# DATABASE_URL, JWT_SECRET, AWS_*
nano .env  # ou use seu editor favorito

# Crie o banco de dados
mysql -u root -p
CREATE DATABASE cms_news;
EXIT;

# Execute migrations
npx prisma generate
npx prisma migrate dev --name init

# Inicie o servidor
npm run dev
```

✅ Backend rodando em `http://localhost:3000`

### 3️⃣ Frontend Setup (1 minuto)

```bash
# Em um novo terminal, entre na pasta do frontend
cd front

# Instale dependências
npm install

# Crie o .env
echo "VITE_API_BASE_URL=http://localhost:3000/api" > .env

# Inicie o dev server
npm run dev
```

✅ Frontend rodando em `http://localhost:5173`

### 4️⃣ Crie um usuário admin (1 minuto)

```bash
# Na pasta back, abra o Prisma Studio
cd back
npx prisma studio
```

1. Abra `http://localhost:5555`
2. Clique em **User** → **Add record**
3. Preencha:
   - **email**: admin@cms.ecwd.cloud
   - **name**: Admin
   - **password**: (use um hash bcrypt)
4. Salve

**Gerando hash de senha:**

```bash
node -e "console.log(require('bcryptjs').hashSync('senha123', 10))"
```

### 5️⃣ Faça Login!

1. Acesse `http://localhost:5173/admin/login`
2. Use as credenciais criadas
3. ✨ Pronto! Você está dentro do painel

---

## 📝 Configuração Mínima do .env

### Backend (`back/.env`)

```env
DATABASE_URL="mysql://root:senha@localhost:3306/cms_news"
JWT_SECRET="meu-secret-super-seguro-123"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_S3_BUCKET="cms-news-media"
FRONTEND_URL="http://localhost:5173"
PORT=3000
```

### Frontend (`front/.env`)

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 🎯 Primeiros Passos Após Login

1. **Criar Tipos de Imóveis**
   - Vá em Configurações (se houver) ou use o Prisma Studio
   - Adicione: Casa, Apartamento, Terreno, Comercial

2. **Criar Finalidades**
   - Adicione: Venda, Aluguel, Temporada

3. **Cadastrar Primeiro Imóvel**
   - Clique em "Novo Imóvel"
   - Preencha os dados
   - Adicione até 10 fotos
   - Salve!

4. **Adicionar Mais Usuários**
   - Vá em "Usuários"
   - Clique em "Novo Usuário"
   - Configure email e senha

---

## 🐛 Problemas Comuns

### ❌ "Cannot connect to MySQL"
```bash
# Verifique se o MySQL está rodando
sudo systemctl status mysql

# Ou no macOS/Windows, verifique se o serviço está ativo
```

### ❌ "JWT_SECRET is not defined"
- Certifique-se de ter criado o arquivo `.env` no `back/`
- Verifique se todas as variáveis estão definidas

### ❌ "Failed to upload image"
- Verifique suas credenciais AWS
- Confirme que o bucket existe
- Teste as credenciais:
```bash
aws s3 ls s3://seu-bucket --region us-east-1
```

### ❌ "CORS error"
- Verifique se `FRONTEND_URL` no backend está correto
- Reinicie o servidor backend após alterar o `.env`

### ❌ Página em branco no frontend
- Abra o console do navegador (F12)
- Verifique se o backend está rodando
- Confirme se `VITE_API_BASE_URL` está correto

---

## 📊 Testando a API

### Teste de Health Check

```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "message": "CMS News API - Servidor funcionando",
  "timestamp": "2025-11-03T..."
}
```

### Teste de Login

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hajar.com",
    "password": "senha123"
  }'
```

---

## 🎨 Primeira Visualização

Após fazer login, você verá:

1. **Dashboard** - Com estatísticas de imóveis e usuários
2. **Menu Lateral** - Com navegação para:
   - Dashboard
   - Imóveis
   - Usuários
   - Perfil

---

## 📚 Próximos Passos

1. Leia o [README.md](./README.md) completo
2. Veja o [Status da Integração](./front/INTEGRATION_STATUS.md)
3. Explore o [Schema do Prisma](./back/prisma/schema.prisma)
4. Comece a cadastrar imóveis!

---

## 💡 Dicas Úteis

### Comandos Úteis

```bash
# Ver logs do backend em tempo real
cd back && npm run dev

# Abrir interface visual do banco
cd back && npx prisma studio

# Limpar cache e reinstalar (se algo der errado)
rm -rf node_modules package-lock.json
npm install
```

### Atalhos do Navegador

- `F12` - Abrir DevTools
- `Ctrl + Shift + R` - Hard refresh (limpa cache)
- `Ctrl + Click` - Abrir em nova aba

### Dados de Teste

Crie alguns imóveis de exemplo para testar:

```
Imóvel 1:
- Código: IMO001
- Título: "Casa em Condomínio Fechado"
- Tipo: Casa
- Finalidade: Venda
- Valor: 850000

Imóvel 2:
- Código: IMO002
- Título: "Apartamento no Centro"
- Tipo: Apartamento
- Finalidade: Aluguel
- Valor: 2500
```

---

## ✅ Checklist de Verificação

Marque conforme avança:

- [ ] MySQL instalado e rodando
- [ ] Node.js v18+ instalado
- [ ] Dependências do backend instaladas
- [ ] Dependências do frontend instaladas
- [ ] Arquivo `.env` do backend configurado
- [ ] Arquivo `.env` do frontend configurado
- [ ] Banco de dados criado
- [ ] Migrations executadas
- [ ] Usuário admin criado
- [ ] Backend rodando na porta 3000
- [ ] Frontend rodando na porta 5173
- [ ] Login funcionando
- [ ] Dashboard carregando

---

**🎉 Parabéns! Seu painel administrativo está rodando!**

Se tiver dúvidas, consulte o README principal ou a documentação detalhada.

---

*Desenvolvido para CMS News - 2025*

