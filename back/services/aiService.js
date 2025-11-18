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
 * @returns {Promise<Object>} - {titulo, chamada, conteudo}
 */
export async function generateNewsWithAI({ assunto, resumo, conteudos }) {
  // Verifica se tem OpenAI configurada
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada no .env');
  }

  const prompt = `Você é um redator profissional de notícias sobre música eletrônica.

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

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um redator profissional de notícias. Sempre responda em JSON válido.'
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

          console.log('✅ Notícia gerada com sucesso!');
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

