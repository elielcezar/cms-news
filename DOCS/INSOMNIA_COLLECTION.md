# 🧪 Guia de Testes - Insomnia

## 📋 Configuração Inicial

### Base URL
```
http://localhost:3010/api
```

### ⚠️ IMPORTANTE: Filtro de Status
**Todos os endpoints públicos retornam APENAS posts com status `PUBLICADO`.**

- ✅ Posts com `status: "RASCUNHO"` **NÃO** aparecem nas APIs públicas
- ✅ Apenas posts `PUBLICADO` são retornados
- ✅ Isso garante que rascunhos não sejam expostos publicamente

### Headers Padrão (se necessário autenticação)
```
Content-Type: application/json
Authorization: Bearer {token}
```

---

## 🎯 Endpoints Principais para Testar

### 1️⃣ Posts por Idioma

#### Português
```
GET http://localhost:3010/api/posts?lang=pt
```

#### Inglês
```
GET http://localhost:3010/api/posts?lang=en
```

#### Espanhol
```
GET http://localhost:3010/api/posts?lang=es
```

**O que verificar:**
- ✅ Retorna apenas posts com tradução no idioma solicitado
- ✅ Campos `titulo`, `chamada`, `conteudo` estão no idioma correto
- ✅ `urlAmigavel` tem prefixo do idioma (`pt/`, `en/`, `es/`)
- ✅ `tags` retornam como `{ id, nome }`
- ✅ `categorias` retornam com nome traduzido

---

### 2️⃣ Posts em Destaque

#### Destaques em Português
```
GET http://localhost:3010/api/posts?lang=pt&featured=true
```

#### Destaques em Inglês
```
GET http://localhost:3010/api/posts?lang=en&featured=true
```

**O que verificar:**
- ✅ Todos os posts têm `destaque: true` (campo no JSON)
- ✅ Retorna apenas posts PUBLICADOS (filtro automático)
- ✅ Ordenados por `dataPublicacao` (mais recentes primeiro)

---

### 3️⃣ Posts por Categoria

#### Por ID da Categoria
```
GET http://localhost:3010/api/posts?lang=pt&category=1
```

#### Por Nome da Categoria
```
GET http://localhost:3010/api/posts?lang=pt&category=Música
```

**O que verificar:**
- ✅ Todos os posts pertencem à categoria especificada
- ✅ Campo `categorias` contém a categoria filtrada
- ✅ Nome da categoria está traduzido no idioma solicitado

**Como descobrir IDs de categorias:**
```
GET http://localhost:3010/api/categorias?lang=pt
```

---

### 4️⃣ Posts por Tag

#### Por Nome da Tag
```
GET http://localhost:3010/api/posts?lang=pt&tag=música
```

#### Por ID da Tag
```
GET http://localhost:3010/api/posts?lang=pt&tag=1
```

**O que verificar:**
- ✅ Todos os posts têm a tag especificada
- ✅ Campo `tags` contém a tag filtrada
- ✅ Tags retornam como `{ id, nome }` (simplificado)

**Como descobrir IDs de tags:**
```
GET http://localhost:3010/api/tags
```

---

### 5️⃣ Posts Publicados

**Nota:** Todos os endpoints já retornam apenas posts PUBLICADOS por padrão.

```
GET http://localhost:3010/api/posts?lang=pt
```

**O que verificar:**
- ✅ Todos os posts têm `status: "PUBLICADO"`
- ✅ Não retorna rascunhos (mesmo sem especificar status)

---

### 6️⃣ Combinações de Filtros

#### Destaques Publicados em PT
```
GET http://localhost:3010/api/posts?lang=pt&featured=true
```
*Nota: Status PUBLICADO é aplicado automaticamente*

#### Destaques de uma Categoria Específica
```
GET http://localhost:3010/api/posts?lang=pt&category=1&featured=true
```

#### Posts de uma Categoria com uma Tag Específica
```
GET http://localhost:3010/api/posts?lang=pt&category=1&tag=música
```

---

## 📊 Estrutura de Resposta Esperada

### Lista de Posts
```json
[
  {
    "id": 1,
    "titulo": "Título do Post",
    "chamada": "Resumo do post",
    "conteudo": "<p>Conteúdo HTML...</p>",
    "urlAmigavel": "pt/titulo-do-post",
    "imagens": ["https://s3.amazonaws.com/.../imagem.jpg"],
    "status": "PUBLICADO",
    "destaque": true,
    "dataPublicacao": "2024-01-15T10:00:00.000Z",
    "idiomaDefault": "pt",
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "categorias": [
      {
        "id": 1,
        "nome": "Música"
      }
    ],
    "tags": [
      {
        "id": 1,
        "nome": "música"
      },
      {
        "id": 2,
        "nome": "festival"
      }
    ],
    "url": "http://localhost:3010/posts/pt/titulo-do-post",
    "translationsAvailable": ["pt", "en", "es"]
  }
]
```

---

## 🔍 Checklist de Validação

### Campos Obrigatórios
- [ ] `id` - ID numérico do post
- [ ] `titulo` - Título no idioma solicitado
- [ ] `chamada` - Resumo/chamada no idioma solicitado
- [ ] `conteudo` - HTML completo do conteúdo
- [ ] `urlAmigavel` - Slug com prefixo de idioma
- [ ] `imagens` - Array de URLs (pode estar vazio)
- [ ] `status` - "RASCUNHO" ou "PUBLICADO"
- [ ] `destaque` - Boolean
- [ ] `categorias` - Array de `{ id, nome }`
- [ ] `tags` - Array de `{ id, nome }`

### Validações Específicas

#### Por Idioma
- [ ] `titulo`, `chamada`, `conteudo` estão no idioma correto
- [ ] `urlAmigavel` começa com `pt/`, `en/` ou `es/`
- [ ] `categorias[].nome` está traduzido para o idioma solicitado

#### Por Destaque
- [ ] Todos os posts têm `destaque: true`
- [ ] Ordenação por data (mais recentes primeiro)

#### Por Categoria
- [ ] Todos os posts têm a categoria no array `categorias`
- [ ] Categoria filtrada aparece em todos os resultados

#### Por Tag
- [ ] Todos os posts têm a tag no array `tags`
- [ ] Tag filtrada aparece em todos os resultados

---

## 🐛 Troubleshooting

### Problema: Retorna array vazio
**Possíveis causas:**
- Não há posts no idioma solicitado
- Filtros muito restritivos
- Posts não estão publicados

**Solução:**
- Verificar se há posts: `GET /posts?lang=pt`
- Remover filtros um por um
- Verificar status dos posts

### Problema: Tags com estrutura aninhada
**Causa:** Versão antiga da API

**Solução:** Atualizar backend para versão mais recente

### Problema: Categoria não filtra corretamente
**Causa:** Usando nome em vez de ID

**Solução:** Usar ID numérico: `?category=1` (ou `?categoria=1` para compatibilidade)

---

## 📝 Notas Importantes

1. **Imagens**: Campo `imagens` é um array JSON. Pode estar vazio `[]` ou conter URLs do S3.

2. **Data de Publicação**: Campo `dataPublicacao` pode ser `null` se não foi definida.

3. **Traduções Disponíveis**: Campo `translationsAvailable` mostra quais idiomas têm tradução do post.

4. **Ordenação**: Posts são sempre ordenados por `dataPublicacao` (descendente - mais recentes primeiro).

5. **Filtros Combinados**: Todos os filtros são aplicados com AND (todos devem ser verdadeiros).

---

## 🚀 Próximos Passos

Após validar os endpoints:
1. ✅ Integrar no frontend
2. ✅ Criar componentes de listagem
3. ✅ Implementar filtros na UI
4. ✅ Adicionar paginação (se necessário)

