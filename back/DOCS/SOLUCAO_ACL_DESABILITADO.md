# 🔧 Solução: AccessControlListNotSupported

## ❌ Problema

O erro `AccessControlListNotSupported: The bucket does not allow ACLs` ocorre porque:

- Buckets S3 modernos da AWS têm **ACLs desabilitadas por padrão**
- O código estava tentando usar `acl: 'public-read'` que não é mais suportado
- A AWS recomenda usar **políticas de bucket** ao invés de ACLs

## ✅ Solução Aplicada

### 1. Removido ACL do Código

O código foi atualizado para **não usar ACLs**. O upload funciona normalmente sem ACL.

### 2. Configurar Política de Bucket (Se ainda não fez)

Para tornar os objetos públicos, você precisa de uma **política de bucket** na AWS:

1. **Acesse o Console S3**: https://console.aws.amazon.com/s3/
2. **Clique no bucket** `cms-news-media`
3. **Vá em "Permissões"** → **"Política do bucket"**
4. **Cole esta política**:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::cms-news-media/posts/*"
        }
    ]
}
```

5. **Salve** a política

### 3. Verificar Configurações do Bucket

1. Na mesma aba **"Permissões"**
2. Verifique **"Bloquear acesso público"**:
   - Pode deixar marcado, mas a política acima permite acesso público mesmo assim
   - OU desmarque se quiser acesso completamente público

## 🧪 Testar

Após configurar:

1. **Reinicie o servidor backend**
2. **Faça upload de uma nova imagem**
3. **Deve funcionar sem erros**
4. **A imagem deve estar acessível publicamente** via URL

## 📝 Notas Importantes

- ✅ **ACLs foram removidas do código** - não são mais necessárias
- ✅ **Política de bucket** controla o acesso público agora
- ✅ **Mais seguro** - política de bucket é mais granular e controlável
- ✅ **Padrão moderno da AWS** - é assim que deve ser feito hoje em dia

## 🔍 Verificação

Se ainda houver problemas:

1. Verifique se a política do bucket foi salva corretamente
2. Verifique se o caminho na política corresponde ao padrão: `imoveis/*`
3. Aguarde alguns minutos para propagação
4. Teste acessando uma URL de imagem diretamente no navegador

