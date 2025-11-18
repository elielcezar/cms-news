# 📍 Migração - Campos de Endereço Completos (CEP, Bairro, Estado)

## 🎯 O que foi adicionado

Novos campos para endereçamento completo dos imóveis:

- **CEP** - Código de Endereçamento Postal
- **Bairro** - Nome do bairro
- **Estado** - Sigla do estado (UF)

## 🔧 Integração com ViaCEP

O frontend agora possui integração automática com a API do [ViaCEP](https://viacep.com.br/):

- ✅ Ao digitar um CEP válido (8 dígitos), busca automaticamente o endereço
- ✅ Preenche os campos: Endereço, Bairro, Cidade e Estado
- ✅ Formatação automática do CEP (XXXXX-XXX)
- ✅ Validação e tratamento de erros

## 🚀 Como aplicar a migração

### **Passo 1: Executar a migration do Prisma**

No diretório `back/`, execute:

```bash
# Gerar migration
npx prisma migrate dev --name add_cep_bairro_estado

# OU em produção:
npx prisma migrate deploy
```

Isso criará as novas colunas no banco de dados:
- `cep` (String?)
- `bairro` (String?)
- `estado` (String?)

### **Passo 2: Verificar as alterações**

```bash
# Ver o schema atualizado
npx prisma studio
```

### **Passo 3: Reiniciar o backend**

```bash
# Desenvolvimento
npm run dev

# Produção (PM2)
pm2 restart cms-news
```

### **Passo 4: Rebuild do frontend** (se necessário)

```bash
cd front
npm run build
```

## 📋 Alterações realizadas

### **Backend:**
- ✅ Schema Prisma atualizado (`back/prisma/schema.prisma`)
- ✅ Rotas de criação e atualização atualizadas (`back/routes/imoveis.js`)
- ✅ Validação atualizada (`back/middleware/validation.js`)

### **Frontend:**
- ✅ Tipos TypeScript atualizados (`front/src/types/admin.ts`)
- ✅ Formulário com novos campos (`front/src/pages/admin/PropertyForm.tsx`)
- ✅ Integração com ViaCEP
- ✅ Service atualizado (`front/src/services/properties.service.ts`)

## ✨ Como usar

1. **Criar/Editar um imóvel**
2. **Digite o CEP** (ex: 01001000)
3. **O sistema busca automaticamente:**
   - Endereço (logradouro)
   - Bairro
   - Cidade
   - Estado

4. **Você pode editar** qualquer campo preenchido automaticamente

## 🔍 Exemplo de uso da API ViaCEP

```javascript
// Frontend faz automaticamente:
fetch('https://viacep.com.br/ws/01001000/json/')
  .then(res => res.json())
  .then(data => {
    // Preenche os campos:
    // endereco: data.logradouro
    // bairro: data.bairro
    // cidade: data.localidade
    // estado: data.uf
  });
```

## ⚠️ Observações

- Os campos de endereço são **opcionais**
- O CEP é formatado automaticamente (adiciona o hífen)
- A busca no ViaCEP só acontece quando o CEP tem 8 dígitos
- Em caso de CEP inválido, uma notificação é exibida
- É possível preencher manualmente se preferir

---

**Data da migração:** 11/11/2025  
**Referência API:** https://viacep.com.br/

