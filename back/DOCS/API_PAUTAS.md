# API de Sugestões de Pauta

Documentação do endpoint para receber sugestões de pauta geradas por IA via n8n.

## Endpoint de Criação

### POST `/api/pautas`

Cria uma nova sugestão de pauta no sistema.

#### Autenticação

Este endpoint é protegido por **API Key**. Você deve incluir a chave de API no header da requisição:

```
x-api-key: seu-token-secreto-aqui
```

#### Request Body

```json
{
  "assunto": "Grammy 2026",
  "resumo": "Foram divulgados os indicados nas categorias de música eletrônica. O resumo destaca a presença de Skrillex em 2 categorias e a pouca renovação geral nas indicações.",
  "fontes": [
    {
      "nome": "House Mag",
      "url": "https://housemag.com.br/grammy-2026-indicados"
    },
    {
      "nome": "Wonderland in Rave",
      "url": "https://wonderlandinrave.com/grammy-indicados"
    }
  ],
  "siteId": 1
}
```

#### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `assunto` | string | Sim | Título/assunto principal da pauta (mínimo 3 caracteres) |
| `resumo` | string | Sim | Resumo detalhado da notícia (mínimo 10 caracteres) |
| `fontes` | array | Sim | Lista de fontes da informação (mínimo 1 fonte) |
| `fontes[].nome` | string | Sim | Nome da fonte/veículo |
| `fontes[].url` | string | Sim | URL válida da fonte |
| `siteId` | number | Não | ID do site relacionado (opcional) |

#### Response Success (201 Created)

```json
{
  "id": 1,
  "assunto": "Grammy 2026",
  "resumo": "Foram divulgados os indicados nas categorias de música eletrônica...",
  "fontes": [
    {
      "nome": "House Mag",
      "url": "https://housemag.com.br/grammy-2026-indicados"
    },
    {
      "nome": "Wonderland in Rave",
      "url": "https://wonderlandinrave.com/grammy-indicados"
    }
  ],
  "siteId": 1,
  "site": {
    "id": 1,
    "nome": "Portal Principal",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Response Error (401 Unauthorized)

```json
{
  "error": "API Key inválida"
}
```

ou

```json
{
  "error": "API Key não fornecida. Use o header x-api-key"
}
```

#### Response Error (400 Bad Request)

```json
{
  "error": "Erro de validação",
  "details": [
    {
      "field": "assunto",
      "message": "Assunto deve ter no mínimo 3 caracteres"
    },
    {
      "field": "fontes.0.url",
      "message": "URL inválida"
    }
  ]
}
```

## Configuração no n8n

### 1. Adicionar Variável de Ambiente no Backend

Edite o arquivo `back/.env` e adicione:

```env
N8N_API_KEY=seu-token-secreto-super-seguro-aqui
```

**Importante:** Use um token forte e único. Você pode gerar um com:
```bash
openssl rand -hex 32
```

### 2. Configurar HTTP Request no n8n

No workflow do n8n, adicione um nó **HTTP Request** com as seguintes configurações:

- **Method:** POST
- **URL:** `https://cms.ecwd.cloud/api/pautas` (ou URL do seu backend)
- **Authentication:** None
- **Headers:**
  - Name: `x-api-key`
  - Value: `seu-token-secreto-super-seguro-aqui` (o mesmo do .env)
  - Name: `Content-Type`
  - Value: `application/json`
- **Body Content Type:** JSON
- **Body:**

```json
{
  "assunto": "{{ $json.titulo }}",
  "resumo": "{{ $json.resumo }}",
  "fontes": {{ $json.fontes }},
  "siteId": {{ $json.siteId || null }}
}
```

### 3. Exemplo de Workflow Completo

```
[Trigger] → [AI Agent] → [Formatar Dados] → [HTTP Request para CMS] → [Notificar Sucesso]
```

**Nó "Formatar Dados"** (Code/Function):
```javascript
// Exemplo de formatação dos dados vindos da IA
const fontes = [
  { nome: "House Mag", url: items[0].json.fonte1_url },
  { nome: "Wonderland in Rave", url: items[0].json.fonte2_url }
];

return {
  assunto: items[0].json.titulo,
  resumo: items[0].json.resumo_ia,
  fontes: fontes.filter(f => f.url), // Remove fontes sem URL
  siteId: items[0].json.site_id || null
};
```

## Endpoints Adicionais (Apenas para CMS Admin)

Estes endpoints são protegidos por autenticação JWT e usados apenas pelo frontend do CMS:

- **GET** `/api/pautas` - Listar todas as pautas
- **GET** `/api/pautas/:id` - Obter pauta específica
- **DELETE** `/api/pautas/:id` - Deletar pauta

## Testando a API

### Com cURL

```bash
curl -X POST https://cms.ecwd.cloud/api/pautas \
  -H "Content-Type: application/json" \
  -H "x-api-key: seu-token-secreto-aqui" \
  -d '{
    "assunto": "Teste de Pauta",
    "resumo": "Este é um teste de criação de pauta via API",
    "fontes": [
      {
        "nome": "Fonte de Teste",
        "url": "https://exemplo.com/noticia"
      }
    ],
    "siteId": 1
  }'
```

### Com Postman

1. Method: `POST`
2. URL: `https://cms.ecwd.cloud/api/pautas`
3. Headers:
   - `Content-Type`: `application/json`
   - `x-api-key`: `seu-token-secreto-aqui`
4. Body (raw, JSON):
```json
{
  "assunto": "Teste de Pauta",
  "resumo": "Este é um teste de criação de pauta via API",
  "fontes": [
    {
      "nome": "Fonte de Teste",
      "url": "https://exemplo.com/noticia"
    }
  ],
  "siteId": 1
}
```

## Fluxo no CMS

Após a pauta ser criada via API:

1. A pauta aparece na seção **"Sugestões de Pauta"** do CMS
2. Os editores podem:
   - **Visualizar** todos os detalhes (assunto, resumo, fontes, site)
   - **Converter em Post**: abre o formulário de post preenchido com os dados da pauta
   - **Excluir**: remove a sugestão
3. Ao converter em post:
   - O título é preenchido com o assunto
   - A chamada é preenchida com um resumo truncado
   - O conteúdo é preenchido com o resumo completo + links das fontes
   - O site relacionado é automaticamente selecionado (se fornecido)
   - O editor pode ajustar os dados e publicar

## Segurança

- ✅ Endpoint protegido por API Key
- ✅ Validação de dados com Zod
- ✅ CORS configurado
- ✅ Logs de requisições
- ⚠️ **Importante:** Mantenha a API Key em segredo
- ⚠️ Use HTTPS em produção
- ⚠️ Considere implementar rate limiting para prevenir abuso

## Troubleshooting

### Erro 401: API Key inválida

- Verifique se o header `x-api-key` está sendo enviado
- Confirme que a API Key no n8n é exatamente igual à do arquivo `.env`
- Certifique-se de que não há espaços extras na chave

### Erro 400: Validação falhou

- Verifique se todos os campos obrigatórios estão presentes
- Confirme que as URLs das fontes são válidas
- Certifique-se de que o array `fontes` tem pelo menos 1 item

### Erro 500: Configuração de API Key não encontrada

- A variável `N8N_API_KEY` não está definida no arquivo `.env`
- Reinicie o servidor backend após adicionar a variável

### CORS Error

- Verifique se o header `x-api-key` está listado em `allowedHeaders` no CORS (já configurado)
- Confirme se a origem está permitida no CORS

## Suporte

Para problemas ou dúvidas, verifique os logs do backend:
```bash
cd back
npm run dev
# ou em produção
pm2 logs cms-api
```

