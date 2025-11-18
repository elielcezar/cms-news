# Migração para Sistema Multilíngue

Este documento descreve o processo de migração do sistema de posts para suportar múltiplos idiomas.

## 📋 O que muda?

### Antes:
- Campos `titulo`, `chamada`, `conteudo`, `urlAmigavel` estavam diretamente no model `Post`
- URLs: `/nome-da-noticia`

### Depois:
- Esses campos movidos para o model `PostTranslation`
- 1 Post pode ter N traduções (PT, EN, ES)
- URLs: `/pt/nome-da-noticia`, `/en/news-name`, `/es/nombre-noticia`

## 🚀 Processo de Migração

### Passo 1: Backup do Banco de Dados

**IMPORTANTE**: Sempre faça backup antes de qualquer migration!

```bash
# MySQL
mysqldump -u usuario -p cms_news > backup_antes_multilingual.sql
```

### Passo 2: Gerar Prisma Client

```bash
cd back
npm run prisma:generate
```

### Passo 3: Criar Migration

```bash
cd back
npx prisma migrate dev --name add_post_translations
```

Isso irá:
- Criar a tabela `post_translations`
- Adicionar campo `idiomaDefault` na tabela `posts`
- Remover campos `titulo`, `chamada`, `conteudo`, `urlAmigavel` de `posts`

### Passo 4: Migrar Dados Existentes

**IMPORTANTE**: Execute este script IMEDIATAMENTE após a migration!

```bash
cd back
node migrate-existing-posts.js
```

Este script irá:
- Buscar todos os posts existentes
- Criar uma tradução PT para cada post
- Copiar dados de `titulo`, `chamada`, `conteudo`, `urlAmigavel`
- Atualizar slugs para incluir prefixo `/pt/`

### Passo 5: Verificar Migração

```bash
cd back
npm run prisma:studio
```

Verifique:
- ✅ Todos os posts têm pelo menos 1 tradução (PT)
- ✅ URLs em `post_translations` têm prefixo `/pt/`
- ✅ Relacionamentos entre `posts` e `post_translations` estão corretos

## 🔄 Rollback (Em caso de problemas)

Se algo der errado, você pode reverter:

```bash
# 1. Restaurar backup
mysql -u usuario -p cms_news < backup_antes_multilingual.sql

# 2. Reverter migration do Prisma
cd back
npx prisma migrate resolve --rolled-back add_post_translations

# 3. Restaurar schema antigo (se necessário)
git checkout HEAD~1 -- prisma/schema.prisma
```

## ⚠️ Atenção

- **NÃO execute a migration em produção sem testar em desenvolvimento primeiro**
- **Sempre faça backup antes de migrations destrutivas**
- **Este script REMOVE campos da tabela `posts`** - não é reversível sem backup

## 🐛 Troubleshooting

### Erro: "Column 'titulo' doesn't exist"

**Causa**: A migration foi executada mas o script de migração de dados não.

**Solução**: Execute `node migrate-existing-posts.js`

### Erro: "Duplicate entry for key 'urlAmigavel'"

**Causa**: Já existe uma tradução com o mesmo slug.

**Solução**: Verifique `post_translations` e remova duplicatas manualmente.

### Posts não aparecem no frontend

**Causa**: Frontend ainda espera campos antigos.

**Solução**: Certifique-se de atualizar o frontend conforme o plano (steps 6-10).

## ✅ Checklist de Validação

Após migração, verifique:

- [ ] Migration executada sem erros
- [ ] Script de migração de dados executado
- [ ] Todos os posts têm pelo menos 1 tradução PT
- [ ] URLs antigas redirecionam corretamente (se necessário)
- [ ] Backend rodando sem erros
- [ ] API retorna posts com traduções corretamente
- [ ] Frontend atualizado e funcionando

## 📞 Suporte

Em caso de problemas durante a migração:
1. Verifique os logs do script de migração
2. Consulte o Prisma Studio para inspecionar dados
3. Restaure o backup se necessário
4. Revise este documento passo a passo

