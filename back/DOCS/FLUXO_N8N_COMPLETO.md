# 🔄 Fluxo Completo do n8n - Geração de Pautas

## 📋 Sequência de Passos

```
1. HTTP Request (GET) → Buscar lista de fontes da API
                ↓
2. Code → Formatar URL com Jina AI (r.jina.ai)
                ↓
3. HTTP Request (GET) → Buscar conteúdo limpo do Jina
                ↓
4. Code → Processar resposta do Jina
                ↓
5. Aggregate → Juntar todos os conteúdos
                ↓
6. AI Agent → Gerar sugestões de pauta
                ↓
7. Code → Parsear JSON da IA + Preparar body
                ↓
8. HTTP Request (POST) → Enviar pautas para API
```

---

## 📝 Arquivos de Referência

| Passo | Arquivo | Descrição |
|-------|---------|-----------|
| 7 | `parse-pautas.js` | Parsear IA + preparar body |
| 8 | `n8n-passo8-http-request.txt` | Instruções HTTP Request |

---

## 🎯 Mudança Importante

**ANTES (não funcionava):**
- Passo 8 tentava usar expressões `{{ }}` diretamente no JSON

**AGORA (funciona!):**
- Passo 7 cria o objeto `body` pronto dentro do parse
- Passo 8 só usa `{{ $json.body }}`
- **Apenas 1 Code Node** ao invés de 2! 🎉

---

## ✅ Checklist de Implementação

- [ ] Passo 7: Code com `parse-pautas.js` (tudo em um!)
- [ ] Passo 8: HTTP Request com body `{{ $json.body }}`
- [ ] Header `x-api-key` configurado
- [ ] `siteId` ajustado no Passo 7
- [ ] Testar workflow completo

---

## 🐛 Debug

Se der erro, verifique o Output do Passo 7:
```json
{
  "body": {
    "assunto": "...",
    "resumo": "...",
    "fontes": [...],
    "siteId": 1
  }
}
```

- `fontes` deve ser Array ✅
- `siteId` deve ser Number ✅

