# 🚀 Configuração para Produção

## 🔧 Variáveis de Ambiente Necessárias

### Backend (.env)

```env
# Database
DATABASE_URL="mysql://user:password@host:3306/cms_news"

# JWT
JWT_SECRET="seu-secret-super-seguro-aqui"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# AWS S3
AWS_REGION="sa-east-1"
AWS_ACCESS_KEY_ID="sua-access-key"
AWS_SECRET_ACCESS_KEY="sua-secret-key"
AWS_S3_BUCKET="cms-news-media"

# CORS - IMPORTANTE: Coloque o domínio do frontend de produção
# Pode colocar múltiplos separados por vírgula
FRONTEND_URL="https://cms.ecwd.cloud"

# Porta e Ambiente
PORT=3004
NODE_ENV=production
```

### Frontend (.env na build OU variável de ambiente no servidor)

**Opção 1: Arquivo .env durante o build**
```env
VITE_API_URL=https://seu-backend.ecwd.cloud/api
```

**Opção 2: Variável de ambiente no servidor**
Configure `VITE_API_URL` no seu servidor/hosting antes de fazer o build.

## 📝 Passos para Configurar

### Backend

1. **Atualize o `.env` do backend** com:
   - `FRONTEND_URL="https://cms.ecwd.cloud"`
   - `NODE_ENV=production`
   - URL de produção do backend em `PORT`

2. **Reinicie o servidor backend**

3. **Verifique se o CORS está funcionando**:
   ```bash
   curl -H "Origin: https://cms.ecwd.cloud" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://seu-backend.ecwd.cloud/api/login
   ```

### Frontend

1. **Configure a variável `VITE_API_URL`** no arquivo `.env` do frontend:
   ```env
   VITE_API_URL=https://seu-backend.ecwd.cloud/api
   ```

2. **Reconstrua o frontend**:
   ```bash
   npm run build
   ```

3. **Faça deploy dos arquivos da pasta `dist/`**

## ⚠️ Importante

- **Variáveis VITE precisam ser configuradas ANTES do build** - elas são "embutidas" no código durante o build
- Se mudar a URL depois do build, precisa reconstruir
- No backend, variáveis `.env` são lidas em runtime, então pode mudar sem rebuild

## 🔍 Verificação

Após configurar, teste:

1. Acesse `https://cms.ecwd.cloud` no navegador
2. Abra o Console do Desenvolvedor (F12)
3. Tente fazer login
4. Verifique se não há erros de CORS

Se ainda houver erro:
- Verifique se `FRONTEND_URL` no backend está correto
- Verifique se `VITE_API_URL` no frontend está correto
- Verifique os logs do backend para ver qual origem está sendo bloqueada

