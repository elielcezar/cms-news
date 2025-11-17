// ==================================================
// PASSO 7: CODE NODE - Parsear resposta da IA
// ==================================================
// Use este código no n8n Code Node após a IA

// Pega a resposta da IA
const aiResponse = $input.item.json.output;

// Remove os marcadores de código markdown (```json e ```)
let jsonString = aiResponse
  .replace(/```json\n?/g, '')
  .replace(/```\n?/g, '')
  .trim();

// Parse do JSON
let resultado;
try {
  resultado = JSON.parse(jsonString);
} catch (error) {
  console.error('Erro ao parsear JSON:', error);
  console.log('String original:', jsonString);
  throw new Error('Não foi possível parsear a resposta da IA');
}

// Extrai as pautas
const pautas = resultado.pautas || [];

console.log(`📋 ${pautas.length} pautas encontradas`);

// Retorna cada pauta como um item separado, já no formato para o HTTP Request
return pautas.map(pauta => {
  const requestBody = {
    assunto: pauta.assunto,
    resumo: pauta.resumo,
    fontes: pauta.fontes,
    siteId: 1  // ⚠️ AJUSTE: Coloque o ID do site "EDM News" do seu banco
  };

  // Debug
  console.log('📤 Preparando pauta:', requestBody.assunto);
  console.log('🔢 Tipo de siteId:', typeof requestBody.siteId);
  console.log('📋 Tipo de fontes:', Array.isArray(requestBody.fontes) ? 'Array' : typeof requestBody.fontes);

  return {
    json: {
      body: requestBody
    }
  };
});

