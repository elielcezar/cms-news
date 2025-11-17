# 🔐 Solução: AccessDenied - Permissões S3

## ❌ Problema Identificado

O erro que você está vendo é:

```
AccessDenied: User: arn:aws:iam::674326380015:user/cms-news is not authorized to perform: s3:PutObject
```

Isso significa que o **usuário IAM `cms-news` não tem permissão para fazer upload de arquivos** no bucket S3.

## ✅ Solução Passo a Passo

### Opção 1: Usar Política Gerenciada da AWS (Recomendado - Mais Rápido)

1. **Acesse o Console da AWS IAM**
   - Vá para: https://console.aws.amazon.com/iam/
   - Faça login na sua conta AWS

2. **Encontre o Usuário**
   - No menu lateral, clique em **"Usuários"**
   - Procure e clique no usuário **`cms-news`**

3. **Adicione Permissões**
   - Na aba **"Permissões"**, clique em **"Adicionar permissões"**
   - Selecione **"Anexar políticas diretamente"**
   - Procure e selecione: **`AmazonS3FullAccess`** (ou uma mais específica)
   - Clique em **"Próximo"** e depois **"Adicionar permissões"**

4. **Teste Novamente**
   - Volte para sua aplicação e tente fazer upload novamente

### Opção 2: Criar Política Customizada (Mais Seguro - Recomendado para Produção)

1. **Criar uma Política Customizada**
   - No IAM, vá em **"Políticas"** → **"Criar política"**
   - Clique na aba **"JSON"** e cole o seguinte:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:GetObjectAcl",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::cms-news-media",
                "arn:aws:s3:::cms-news-media/*"
            ]
        }
    ]
}
```

2. **Nomear a Política**
   - Nome sugerido: `CMSNewsS3Access`
   - Descrição: `Permissões S3 para upload de imagens de imóveis`

3. **Anexar ao Usuário**
   - Volte para **"Usuários"** → **`cms-news`**
   - Na aba **"Permissões"**, clique em **"Adicionar permissões"**
   - Selecione **"Anexar políticas diretamente"**
   - Procure e selecione a política **`CMSNewsS3Access`** que você acabou de criar
   - Clique em **"Próximo"** e depois **"Adicionar permissões"**

### Opção 3: Atualizar Política Existente (Se já existe uma)

1. **Encontre a Política Atual**
   - No usuário `cms-news`, veja quais políticas estão anexadas
   - Clique na política que menciona S3

2. **Edite a Política**
   - Clique em **"Editar"** na política
   - Adicione as permissões necessárias:
     - `s3:PutObject`
     - `s3:PutObjectAcl`
     - `s3:GetObject`
     - `s3:DeleteObject`
     - `s3:ListBucket`
   - Certifique-se de que o recurso inclui: `arn:aws:s3:::cms-news-media/*`

## 📋 Permissões Necessárias

O usuário precisa ter permissão para:

| Ação | Descrição | Recursos |
|------|-----------|----------|
|

`s3:PutObject` | Fazer upload de arquivos | `arn:aws:s3:::cms-news-media/*` |
| `s3:PutObjectAcl` | Definir ACL dos arquivos | `arn:aws:s3:::cms-news-media/*` |
| `s3:GetObject` | Ler arquivos (opcional, para downloads) | `arn:aws:s3:::cms-news-media/*` |
| `s3:DeleteObject` | Deletar arquivos (opcional, para remover imagens) | `arn:aws:s3:::cms-news-media/*` |
| `s3:ListBucket` | Listar objetos no bucket (opcional) | `arn:aws:s3:::cms-news-media` |

## ⚠️ Verificações Adicionais

### 1. Verificar Permissões do Bucket
Além das permissões IAM, verifique se o bucket não tem **Block Public Access** muito restritivo:

1. Vá para S3 → Seu bucket `cms-news-media`
2. Na aba **"Permissões"**
3. Verifique **"Bloquear acesso público"** - pode precisar ajustar dependendo do uso

### 2. Verificar Política de Bucket
Certifique-se de que a política do bucket permite o usuário IAM:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowUserCMSNews",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::674326380015:user/cms-news"
            },
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject"
            ],
            "Resource": "arn:aws:s3:::cms-news-media/*"
        }
    ]
}
```

## 🧪 Testar Após Configurar

1. **Reinicie o servidor backend** (se necessário)
2. **Tente fazer upload novamente**
3. **Verifique os logs** - agora deve funcionar!

## 📞 Se Ainda Não Funcionar

1. Verifique se as credenciais no `.env` correspondem ao usuário `cms-news`
2. Aguarde alguns minutos - mudanças no IAM podem levar alguns minutos para propagar
3. Verifique se não há políticas que negam explicitamente (`Deny`) essas permissões

## 🔒 Segurança

**Para Produção**, use a **Opção 2** (Política Customizada) ao invés da `AmazonS3FullAccess`, pois ela dá acesso apenas ao bucket específico e às ações necessárias, seguindo o princípio de menor privilégio.

