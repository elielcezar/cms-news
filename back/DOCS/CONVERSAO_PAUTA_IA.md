# 🤖 Conversão de Pauta em Post com IA

## 📋 Visão Geral

Este sistema permite converter automaticamente uma pauta em um post completo usando Inteligência Artificial.

### Como funciona:

1. **Usuário** clica em "Converter em Post" na lista de pautas
2. **Backend** busca o conteúdo das fontes usando Jina AI
3. **OpenAI** gera uma notícia completa baseada no conteúdo
4. **Sistema** salva como post em rascunho
5. **Frontend** redireciona automaticamente para edição
6. **Editor** revisa e publica

---

## ⚙️ Configuração

### 1. Adicionar OpenAI API Key

Edite o arquivo `.env` no backend:

```bash
# Adicione esta linha
OPENAI_API_KEY=sk-proj-...sua-chave-aqui...
```

**Como obter a chave:**
- Acesse: https://platform.openai.com/api-keys
- Crie uma nova API Key
- Copie e cole no `.env`

### 2. Reiniciar o servidor

```bash
cd back
npm run dev
```

---

## 🚀 Uso

### No Frontend (Admin):

1. Acesse **"Sugestões de Pauta"**
2. Clique no ícone de **"Converter em Post"** (ícone de caneta)
3. Aguarde o loading (10-30 segundos)
4. Você será redirecionado automaticamente para edição do post
5. Revise o conteúdo gerado pela IA
6. Ajuste se necessário e publique!

---

## 🔧 API Endpoint

### POST `/api/pautas/:id/converter-em-post`

**Autenticação:** JWT (Token do usuário logado)

**Resposta de Sucesso:**
```json
{
  "message": "Post criado com sucesso",
  "postId": 123,
  "post": { ... }
}
```

**Exemplo de uso:**
```bash
curl -X POST https://cms.ecwd.cloud/api/pautas/5/converter-em-post \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

---

## 📊 Processo Detalhado

### 1. Busca de Conteúdo (Jina AI)

Para cada fonte da pauta:
- URL: `https://r.jina.ai/URL_ORIGINAL`
- Retorna: Texto limpo em markdown
- Timeout: 10 segundos por fonte

### 2. Geração de Notícia (OpenAI)

**Modelo:** `gpt-4o-mini`

**Prompt:**
```
Você é um redator profissional de notícias sobre música eletrônica.

PAUTA:
Assunto: [assunto da pauta]
Resumo: [resumo da pauta]

CONTEÚDO DAS FONTES:
[conteúdos extraídos...]

TAREFA:
Escreva uma notícia completa e original com:
- Título chamativo
- Chamada (subtítulo) de 1-2 frases
- Conteúdo em HTML (300-500 palavras)
```

**Resposta esperada (JSON):**
```json
{
  "titulo": "Título da notícia",
  "chamada": "Subtítulo resumido",
  "conteudo": "<p>Conteúdo HTML...</p>"
}
```

### 3. Criação do Post

- **Status:** `RASCUNHO`
- **Slug:** Gerado automaticamente do título (único)
- **Site:** Herda o site da pauta
- **Destaque:** `false`
- **Imagens:** `[]` (vazio, editor pode adicionar depois)

---

## ⚠️ Tratamento de Erros

### Erro: "Serviço de IA não configurado"

**Causa:** `OPENAI_API_KEY` não está no `.env`

**Solução:** Adicione a chave conforme instruções acima

### Erro: "Não foi possível obter conteúdo de nenhuma fonte"

**Causas possíveis:**
- URLs das fontes inválidas ou offline
- Jina AI não conseguiu acessar as páginas
- Timeout na requisição

**Solução:** Verifique se as URLs estão acessíveis

### Erro: "OpenAI retornou status 429"

**Causa:** Limite de requisições da API excedido

**Solução:** Aguarde alguns minutos ou aumente o limite na OpenAI

### Erro: "OpenAI retornou status 401"

**Causa:** API Key inválida ou expirada

**Solução:** Verifique se a chave está correta no `.env`

---

## 💰 Custos

### OpenAI (gpt-4o-mini)

- **Input:** $0.15 / 1M tokens (~$0.0001 por pauta)
- **Output:** $0.60 / 1M tokens (~$0.0003 por pauta)
- **Total:** ~$0.0004 por conversão (menos de 1 centavo)

### Jina AI Reader

- **Gratuito** até 1.000 requisições/dia
- Sem necessidade de API Key

---

## 🎯 Próximas Melhorias

- [ ] Adicionar campo para escolher o modelo de IA
- [ ] Permitir personalizar o prompt
- [ ] Adicionar opção de regenerar partes específicas
- [ ] Suporte para outras IAs (Anthropic, Google, etc.)
- [ ] Extração automática de imagens das fontes
- [ ] Sugestão automática de tags

---

## 📝 Arquivos Relacionados

**Backend:**
- `back/services/aiService.js` - Lógica de IA
- `back/routes/pautas.js` - Endpoint de conversão
- `back/DOCS/CONVERSAO_PAUTA_IA.md` - Esta documentação

**Frontend:**
- `front/src/pages/admin/Pautas.tsx` - Interface de pautas
- `front/src/services/pautas.service.ts` - Chamadas de API

---

## 🐛 Debug

Para ver logs detalhados, execute o backend e observe o console:

```bash
cd back
npm run dev
```

Você verá mensagens como:
```
🤖 Recebendo requisição POST /pautas/5/converter-em-post
📋 Pauta encontrada: "Grammy 2026"
🔗 2 fonte(s) para processar
🔍 Buscando conteúdo: https://housemag.com.br/...
✅ Conteúdo obtido (15234 chars)
🤖 Chamando OpenAI para gerar notícia...
✅ Notícia gerada: "Grammy 2026: Skrillex concorre em duas categorias"
✅ Post criado com sucesso! ID: 123
```

