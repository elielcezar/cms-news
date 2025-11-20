# 📡 API Endpoints - Documentação Completa

## Base URL
```
http://localhost:3010/api
```

---

## 📰 Posts

### 1. Listar Posts (Filtros Disponíveis)

**Endpoint:** `GET /posts`

**Query Parameters:**
- `lang` (opcional): Idioma dos posts (`pt`, `en`, `es`) - **Default: `pt`**
- `status` (opcional): Filtrar por status (`RASCUNHO`, `PUBLICADO`)
- `destaque` (opcional): Filtrar por destaque (`true`, `false`)
- `categoria` (opcional): Filtrar por ID da categoria (número)
- `tag` (opcional): Filtrar por nome da tag (string)

**Exemplos de Uso:**

#### 1.1. Posts em Português (Todos)
```
GET http://localhost:3010/api/posts?lang=pt
```

#### 1.2. Posts em Inglês
```
GET http://localhost:3010/api/posts?lang=en
```

#### 1.3. Posts em Espanhol
```
GET http://localhost:3010/api/posts?lang=es
```

#### 1.4. Posts em Destaque (PT)
```
GET http://localhost:3010/api/posts?lang=pt&destaque=true
```

#### 1.5. Posts Publicados (PT)
```
GET http://localhost:3010/api/posts?lang=pt&status=PUBLICADO
```

#### 1.6. Posts de uma Categoria Específica (PT)
```
GET http://localhost:3010/api/posts?lang=pt&categoria=1
```
*Nota: Aceita ID da categoria (número) ou nome da categoria (string)*

#### 1.7. Posts com uma Tag Específica (PT)
```
GET http://localhost:3010/api/posts?lang=pt&tag=música
```
*Nota: Aceita ID da tag (número) ou nome da tag (string)*

**Exemplo com ID de tag:**
```
GET http://localhost:3010/api/posts?lang=pt&tag=1
```

#### 1.8. Combinação de Filtros
```
GET http://localhost:3010/api/posts?lang=pt&destaque=true&status=PUBLICADO&categoria=1
```

**Resposta de Sucesso (200):**
```json
[
  {
    "id": 1,
    "titulo": "Título do Post",
    "chamada": "Chamada/resumo do post",
    "conteudo": "<p>Conteúdo HTML completo...</p>",
    "urlAmigavel": "pt/titulo-do-post",
    "imagens": ["https://s3.../imagem.jpg"],
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
      }
    ],
    "url": "http://localhost:3010/posts/pt/titulo-do-post",
    "translationsAvailable": ["pt", "en", "es"]
  }
]
```

---

### 2. Obter Post por ID

**Endpoint:** `GET /posts/id/:id`

**Query Parameters:**
- `lang` (opcional): Idioma da tradução - **Default: `pt`**

**Exemplo:**
```
GET http://localhost:3010/api/posts/id/1?lang=pt
```

**Resposta de Sucesso (200):**
```json
{
  "id": 1,
  "titulo": "Título do Post",
  "chamada": "Chamada/resumo",
  "conteudo": "<p>Conteúdo HTML...</p>",
  "urlAmigavel": "pt/titulo-do-post",
  "imagens": ["https://s3.../imagem.jpg"],
  "status": "PUBLICADO",
  "destaque": true,
  "dataPublicacao": "2024-01-15T10:00:00.000Z",
  "categorias": [
    {
      "id": 1,
      "postId": 1,
      "categoriaId": 1,
      "categoria": {
        "id": 1,
        "createdAt": "2024-01-01T10:00:00.000Z",
        "updatedAt": "2024-01-01T10:00:00.000Z",
        "translations": [...]
      }
    }
  ],
  "tags": [
    {
      "id": 1,
      "postId": 1,
      "tagId": 1,
      "tag": {
        "id": 1,
        "nome": "música",
        "createdAt": "2024-01-01T10:00:00.000Z",
        "updatedAt": "2024-01-01T10:00:00.000Z"
      }
    }
  ],
  "translations": [
    {
      "idioma": "pt",
      "titulo": "Título PT",
      "urlAmigavel": "pt/titulo-do-post"
    },
    {
      "idioma": "en",
      "titulo": "Title EN",
      "urlAmigavel": "en/title-of-post"
    }
  ]
}
```

---

### 3. Obter Post por URL Amigável

**Endpoint:** `GET /posts/:lang/:slug`

**Exemplo:**
```
GET http://localhost:3010/api/posts/pt/titulo-do-post
```

**Resposta:** Similar ao endpoint por ID

---

## 🏷️ Categorias

### Listar Categorias

**Endpoint:** `GET /categorias`

**Query Parameters:**
- `lang` (opcional): Idioma das traduções (`pt`, `en`, `es`) - **Default: retorna todas**

**Exemplos:**

#### Todas as categorias (com todas as traduções)
```
GET http://localhost:3010/api/categorias
```

#### Categorias em Português (simplificado)
```
GET http://localhost:3010/api/categorias?lang=pt
```

**Resposta (sem lang):**
```json
[
  {
    "id": 1,
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z",
    "translations": [
      {
        "id": 1,
        "categoriaId": 1,
        "idioma": "pt",
        "nome": "Música",
        "createdAt": "2024-01-01T10:00:00.000Z",
        "updatedAt": "2024-01-01T10:00:00.000Z"
      },
      {
        "id": 2,
        "categoriaId": 1,
        "idioma": "en",
        "nome": "Music",
        "createdAt": "2024-01-01T10:00:00.000Z",
        "updatedAt": "2024-01-01T10:00:00.000Z"
      }
    ]
  }
]
```

**Resposta (com lang=pt):**
```json
[
  {
    "id": 1,
    "nome": "Música",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
]
```

---

## 🏷️ Tags

### Listar Tags

**Endpoint:** `GET /tags`

**Query Parameters:**
- `nome` (opcional): Filtrar por nome (busca parcial)

**Exemplos:**

#### Todas as tags
```
GET http://localhost:3010/api/tags
```

#### Buscar tags por nome
```
GET http://localhost:3010/api/tags?nome=música
```

**Resposta:**
```json
[
  {
    "id": 1,
    "nome": "música",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  },
  {
    "id": 2,
    "nome": "festival",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
]
```

---

## 📋 Resumo dos Endpoints para Testes

### Posts por Idioma
1. ✅ `GET /posts?lang=pt` - Posts em Português
2. ✅ `GET /posts?lang=en` - Posts em Inglês
3. ✅ `GET /posts?lang=es` - Posts em Espanhol

### Posts em Destaque
4. ✅ `GET /posts?lang=pt&destaque=true` - Destaques em PT
5. ✅ `GET /posts?lang=en&destaque=true` - Destaques em EN
6. ✅ `GET /posts?lang=es&destaque=true` - Destaques em ES

### Posts por Categoria
7. ✅ `GET /posts?lang=pt&categoria=1` - Posts da categoria ID 1 em PT
8. ✅ `GET /posts?lang=en&categoria=1` - Posts da categoria ID 1 em EN

### Posts por Tag
9. ✅ `GET /posts?lang=pt&tag=música` - Posts com tag "música" em PT
10. ✅ `GET /posts?lang=en&tag=music` - Posts com tag "music" em EN

### Posts Publicados
11. ✅ `GET /posts?lang=pt&status=PUBLICADO` - Apenas publicados em PT

### Combinações
12. ✅ `GET /posts?lang=pt&destaque=true&status=PUBLICADO` - Destaques publicados
13. ✅ `GET /posts?lang=pt&categoria=1&destaque=true` - Destaques de uma categoria

---

## ✅ Correções Aplicadas

### 1. Filtro de Categoria
- ✅ Agora aceita `categoria` (ID numérico ou nome)
- ✅ Mantém compatibilidade com `site` (legado)
- ✅ Filtra corretamente por ID ou nome traduzido

### 2. Estrutura de Tags Simplificada
- ✅ Tags agora retornam apenas `{ id, nome }`
- ✅ Removida estrutura aninhada desnecessária

### 3. Filtro por Tag Melhorado
- ✅ Aceita ID da tag (número) ou nome da tag (string)
- ✅ Mais flexível para uso no frontend

