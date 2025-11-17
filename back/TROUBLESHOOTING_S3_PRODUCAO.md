# 🔧 Troubleshooting S3 em Produção

## ✅ Checklist de Verificação

### 1. Verificar Variáveis de Ambiente no Servidor

Certifique-se de que todas estas variáveis estão configuradas no servidor de produção:

```env
AWS_REGION="sa-east-1"
AWS_ACCESS_KEY_ID="sua-access-key-aqui"
AWS_SECRET_ACCESS_KEY="sua-secret-key-aqui"
AWS_S3_BUCKET="cms-news-media"
```

### 2. Verificar Logs do Servidor

Ao iniciar o servidor, você deve ver:

```
🔧 Configurando S3:
  📍 Região: sa-east-1
  🗝️  Access Key ID: AKIA...
  🔐 Secret Key: ***CONFIGURADO***
  🪣 Bucket: cms-news-media
✅ Credenciais AWS configuradas corretamente
```

Se aparecer "NÃO CONFIGURADO" ou "ERRO", a variável correspondente não está configurada.

### 3. Verificar Permissões IAM

O usuário IAM precisa ter estas permissões:

- `s3:PutObject` - Para fazer upload
- `s3:PutObjectAcl` - Para tornar objetos públicos
- `s3:GetObject` - Para ler objetos (opcional)

### 4. Verificar Bucket S3

- O bucket `cms-news-media` existe?
- Está na região `sa-east-1`?
- O usuário IAM tem acesso a ele?

## 🔍 Como Identificar o Erro Específico

### Passo 1: Verificar os Logs do Servidor

Quando ocorrer um erro de upload, os logs do servidor mostrarão detalhes completos:

```
❌ Erro no S3/AWS: [detalhes do erro]
   Tipo: [tipo do erro]
   Código: [código do erro]
   Mensagem: [mensagem completa]
```

### Passo 2: Verificar a Mensagem de Erro no Frontend

A mensagem de erro agora é mais específica e mostra:

- **"Credenciais AWS não configuradas"** → Variáveis de ambiente faltando
- **"Bucket S3 não encontrado"** → Bucket não existe ou nome errado
- **"Acesso negado ao S3"** → Permissões IAM incorretas
- **"Erro de região AWS"** → Região incorreta

### Passo 3: Testar Conexão AWS Manualmente

Se tiver acesso SSH ao servidor, pode testar:

```bash
# Verificar se as variáveis estão carregadas
echo $AWS_REGION
echo $AWS_S3_BUCKET

# Testar acesso ao bucket (se tiver AWS CLI instalado)
aws s3 ls s3://cms-news-media --region sa-east-1
```

## 🛠️ Soluções Comuns

### Problema: "Credenciais AWS não configuradas"

**Solução:**
1. Verifique se o arquivo `.env` existe no servidor
2. Verifique se todas as variáveis AWS estão definidas
3. Reinicie o servidor após configurar

### Problema: "Bucket S3 não encontrado"

**Solução:**
1. Verifique se o nome do bucket está correto (sem `s3://` ou `https://`)
2. Verifique se a região está correta
3. Confirme que o bucket existe no Console AWS

### Problema: "Acesso negado"

**Solução:**
1. Acesse IAM no Console AWS
2. Encontre o usuário que corresponde às credenciais
3. Adicione política com `s3:PutObject` e `s3:PutObjectAcl`
4. Aguarde alguns minutos para propagação

### Problema: Erro genérico

**Solução:**
1. Verifique os logs completos do servidor
2. Procure por mensagens de erro específicas
3. Compare com a lista de erros acima

## 📝 Exemplo de Configuração Correta

### No servidor de produção, arquivo `.env`:

```env
# Database
DATABASE_URL="mysql://..."

# JWT
JWT_SECRET="..."

# AWS S3 - TODAS DEVEM ESTAR CONFIGURADAS
AWS_REGION="sa-east-1"
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_S3_BUCKET="cms-news-media"

# CORS
FRONTEND_URL="https://cms.ecwd.cloud"
NODE_ENV=production
PORT=3004
```

## 🧪 Teste Manual

Após configurar tudo, teste fazendo upload de uma imagem pequena. Os logs do servidor mostrarão exatamente onde está falhando.

