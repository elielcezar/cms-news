import https from 'https';
import http from 'http';

/**
 * Busca conteúdo de uma URL usando Jina AI Reader
 * @param {string} url - URL para buscar
 * @returns {Promise<string>} - Conteúdo limpo em markdown
 */
export async function fetchContentWithJina(url) {
  return new Promise((resolve, reject) => {
    const jinaUrl = `https://r.jina.ai/${url}`;
    
    console.log(`🔍 Buscando conteúdo: ${url}`);
    
    https.get(jinaUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ Conteúdo obtido (${data.length} chars)`);
          resolve(data);
        } else {
          reject(new Error(`Jina AI retornou status ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      console.error('❌ Erro ao buscar conteúdo:', err);
      reject(err);
    });
  });
}

/**
 * Gera uma notícia usando IA (OpenAI ou similar)
 * @param {Object} params - Parâmetros
 * @param {string} params.assunto - Assunto da pauta
 * @param {string} params.resumo - Resumo da pauta
 * @param {Array} params.conteudos - Array com conteúdos das fontes
 * @param {boolean} params.multilingual - Se true, gera em PT, EN e ES
 * @returns {Promise<Object>} - Se multilingual: {pt: {...}, en: {...}, es: {...}}, senão: {titulo, chamada, conteudo}
 */
export async function generateNewsWithAI({ assunto, resumo, conteudos, multilingual = false }) {
  // Verifica se tem OpenAI configurada
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada no .env');
  }

  let prompt;

  if (multilingual) {
    // Prompt para gerar 3 idiomas de uma vez
    prompt = `Você é um redator profissional de notícias sobre música eletrônica, fluente em Português, Inglês e Espanhol.

PAUTA:
Assunto: ${assunto}
Resumo: ${resumo}

CONTEÚDO DAS FONTES:
${conteudos.map((c, i) => `\n--- Fonte ${i + 1} ---\n${c.substring(0, 2500)}\n`).join('\n')}

TAREFA:
Escreva uma notícia completa e original EM 3 IDIOMAS (Português, Inglês e Espanhol) baseada nesta pauta.

IMPORTANTE:
- NÃO faça apenas tradução literal - adapte culturalmente cada versão
- Use nomes e expressões naturais em cada idioma
- Mantenha o mesmo tom profissional e informativo
- Cada versão deve ter 300-500 palavras

FORMATO DE CADA NOTÍCIA:
- Título chamativo e profissional
- Chamada (subtítulo) de 1-2 frases
- Conteúdo completo em HTML (use tags <p>, <h2>, <strong>, <em>, etc.)

FORMATO DE RESPOSTA (JSON):
{
  "pt": {
    "titulo": "Título em português",
    "chamada": "Subtítulo em português",
    "conteudo": "<p>Conteúdo completo em HTML...</p>"
  },
  "en": {
    "titulo": "Title in English",
    "chamada": "Subtitle in English",
    "conteudo": "<p>Full content in HTML...</p>"
  },
  "es": {
    "titulo": "Título en español",
    "chamada": "Subtítulo en español",
    "conteudo": "<p>Contenido completo en HTML...</p>"
  }
}

Retorne APENAS o JSON, sem texto adicional.`;
  } else {
    // Prompt original (apenas PT)
    prompt = `Você é um redator profissional de notícias sobre música eletrônica.

PAUTA:
Assunto: ${assunto}
Resumo: ${resumo}

CONTEÚDO DAS FONTES:
${conteudos.map((c, i) => `\n--- Fonte ${i + 1} ---\n${c.substring(0, 3000)}\n`).join('\n')}

TAREFA:
Escreva uma notícia completa e original baseada nesta pauta. A notícia deve:
- Ter um título chamativo e profissional
- Ter uma chamada (subtítulo) de 1-2 frases
- Ter conteúdo completo em HTML (use tags <p>, <h2>, <strong>, <em>, etc.)
- Ser informativa e bem escrita
- Ter entre 300-500 palavras

FORMATO DE RESPOSTA (JSON):
{
  "titulo": "Título da notícia",
  "chamada": "Subtítulo ou resumo da notícia",
  "conteudo": "<p>Conteúdo completo em HTML...</p>"
}

Retorne APENAS o JSON, sem texto adicional.`;
  }

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: multilingual 
            ? 'Você é um redator profissional de notícias multilíngue. Sempre responda em JSON válido com as 3 versões (pt, en, es).'
            : 'Você é um redator profissional de notícias. Sempre responda em JSON válido.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: multilingual ? 4000 : 2000
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };
1. 
    console.log('🤖 Chamando OpenAI para gerar notícia...');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            console.error('❌ OpenAI error:', data);
            reject(new Error(`OpenAI retornou status ${res.statusCode}`));
            return;
          }

          const response = JSON.parse(data);
          const content = response.choices[0].message.content;

          // Remove marcadores de código markdown se houver
          let jsonString = content
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

          const newsData = JSON.parse(jsonString);

          if (multilingual) {
            // Validar formato multilíngue
            if (!newsData.pt || !newsData.en || !newsData.es) {
              throw new Error('Resposta da IA não contém os 3 idiomas (pt, en, es)');
            }
            console.log('✅ Notícias geradas em 3 idiomas com sucesso!');
          } else {
            console.log('✅ Notícia gerada com sucesso!');
          }
          
          resolve(newsData);
        } catch (error) {
          console.error('❌ Erro ao parsear resposta da IA:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro na requisição OpenAI:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Gera um slug a partir de um texto
 * @param {string} text - Texto para converter em slug
 * @returns {string} - Slug gerado
 */
export function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Gera sugestões de pauta usando IA
 * Busca fontes, extrai conteúdo e usa OpenAI para sugerir pautas
 * @param {Array} fontes - Array de fontes {titulo, url}
 * @returns {Promise<Array>} - Array de pautas sugeridas
 */
export async function generatePautasWithAI(fontes) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada no .env');
  }

  console.log(`📋 Processando ${fontes.length} fontes...`);

  // Buscar conteúdo de todas as fontes usando Jina AI
  const conteudosPromises = fontes.map(fonte => 
    fetchContentWithJina(fonte.url)
      .then(conteudo => ({
        titulo: fonte.titulo,
        url: fonte.url,
        conteudo: conteudo.substring(0, 5000) // Limitar tamanho
      }))
      .catch(err => {
        console.warn(`⚠️ Erro ao buscar ${fonte.url}:`, err.message);
        return null;
      })
  );

  const conteudos = (await Promise.all(conteudosPromises)).filter(c => c !== null);

  if (conteudos.length === 0) {
    throw new Error('Não foi possível obter conteúdo de nenhuma fonte');
  }

  console.log(`✅ ${conteudos.length} conteúdos obtidos com sucesso`);

  // Montar prompt para OpenAI
  const conteudosTexto = conteudos.map((item, i) => 
    `## Fonte ${i+1}: ${item.titulo}\nURL: ${item.url}\n\n${item.conteudo}\n\n---\n`
  ).join('');

  const prompt = `Você é um editor de notícias especializado em música eletrônica.

Analise os seguintes conteúdos de sites de notícias e gere sugestões de pauta para os últimos 7 dias.

CONTEÚDOS:
${conteudosTexto}

INSTRUÇÕES:
- Identifique notícias interessantes dos últimos 7 dias
- Para cada sugestão de pauta, forneça:
  - Assunto (título curto e chamativo)
  - Resumo (2-3 frases explicando a notícia)
  - Fontes (lista com nome e URL de onde veio a informação)

FORMATO DE RESPOSTA (JSON):
{
  "pautas": [
    {
      "assunto": "Grammy 2026: Skrillex concorre em 2 categorias",
      "resumo": "Foram divulgados os indicados do Grammy 2026. Skrillex está presente em duas categorias de música eletrônica.",
      "fontes": [
        {"nome": "House Mag", "url": "https://housemag.com.br/..."},
        {"nome": "Mixmag Brasil", "url": "https://mixmag.com.br/..."}
      ]
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.`;

  // Chamar OpenAI
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um editor de notícias especializado. Sempre responda em JSON válido.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('🤖 Chamando OpenAI para gerar sugestões de pauta...');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            console.error('❌ OpenAI error:', data);
            reject(new Error(`OpenAI retornou status ${res.statusCode}`));
            return;
          }

          const response = JSON.parse(data);
          const content = response.choices[0].message.content;

          // Remove marcadores de código markdown se houver
          let jsonString = content
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

          const resultado = JSON.parse(jsonString);
          const pautas = resultado.pautas || [];

          console.log(`✅ ${pautas.length} pautas sugeridas pela IA`);
          resolve(pautas);
        } catch (error) {
          console.error('❌ Erro ao parsear resposta da IA:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro na requisição OpenAI:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

