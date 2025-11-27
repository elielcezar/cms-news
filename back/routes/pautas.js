import express from 'express';
import https from 'https';
import prisma from '../config/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { authenticateApiKey } from '../middleware/apiKeyAuth.js';
import { validate, pautaCreateSchema } from '../middleware/validation.js';
import { fetchContentWithJina, fetchContentWithJinaAndMarkdown, generateNewsWithAI, generateSlug, generatePautasWithAI, categorizePostWithAI, generateTagsWithAI } from '../services/aiService.js';
import { processImageFromSource } from '../services/imageService.js';
import { getPlaceholderImageUrl } from '../utils/imagePlaceholder.js';

const router = express.Router();

/**
 * Criar pauta (endpoint para n8n - protegido por API Key)
 * POST /api/pautas
 */
router.post('/pautas', authenticateApiKey, validate(pautaCreateSchema), async (req, res, next) => {
    try {
        console.log('📥 Recebendo requisição POST /pautas da IA');
        const { assunto, resumo, fontes } = req.body;

        const pauta = await prisma.pauta.create({
            data: {
                assunto,
                resumo,
                fontes,
            }
        });

        console.log('✅ Pauta criada com sucesso:', pauta.id);
        res.status(201).json(pauta);
    } catch (error) {
        console.error('❌ Erro ao criar pauta:', error);
        next(error);
    }
});

/**
 * Disparar busca de pautas via IA (protegido por JWT)
 * POST /api/pautas/gerar
 */
router.post('/pautas/gerar', authenticateToken, async (req, res, next) => {
    try {
        console.log('🔍 Iniciando busca de pautas com IA...');

        // Buscar todas as fontes cadastradas
        const fontes = await prisma.fonte.findMany({
            orderBy: { titulo: 'asc' }
        });

        if (fontes.length === 0) {
            return res.status(400).json({ 
                error: 'Nenhuma fonte cadastrada. Cadastre fontes antes de gerar pautas.' 
            });
        }

        console.log(`📚 ${fontes.length} fontes encontradas`);

        // Gerar pautas com IA
        const pautasSugeridas = await generatePautasWithAI(fontes);

        if (pautasSugeridas.length === 0) {
            return res.status(200).json({ 
                message: 'Nenhuma pauta relevante encontrada nos últimos dias.',
                pautasCriadas: 0
            });
        }

        // Salvar pautas no banco
        let pautasCriadas = 0;
        for (const pautaSugerida of pautasSugeridas) {
            try {
                await prisma.pauta.create({
                    data: {
                        assunto: pautaSugerida.assunto,
                        resumo: pautaSugerida.resumo,
                        fontes: pautaSugerida.fontes,
                    }
                });
                pautasCriadas++;
                console.log(`✅ Pauta criada: ${pautaSugerida.assunto}`);
            } catch (error) {
                console.error(`❌ Erro ao salvar pauta:`, error.message);
            }
        }

        console.log(`✅ ${pautasCriadas} pautas criadas com sucesso!`);
        
        res.status(200).json({ 
            message: `${pautasCriadas} novas sugestões de pauta foram criadas com sucesso!`,
            pautasCriadas: pautasCriadas,
            status: 'completed'
        });
    } catch (error) {
        console.error('❌ Erro ao gerar pautas:', error);
        next(error);
    }
});

/**
 * Listar todas as pautas (protegido por JWT)
 * GET /api/pautas
 */
router.get('/pautas', authenticateToken, async (req, res, next) => {
    try {
        console.log('📋 Recebendo requisição GET /pautas');

        const filtro = {};

        // Filtro por busca no assunto
        if (req.query.search) {
            filtro.assunto = { contains: req.query.search };
        }

        const pautas = await prisma.pauta.findMany({
            where: filtro,
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`✅ ${pautas.length} pautas encontradas`);
        res.status(200).json(pautas);
    } catch (error) {
        console.error('❌ Erro ao listar pautas:', error);
        next(error);
    }
});

/**
 * Obter pauta por ID (protegido por JWT)
 * GET /api/pautas/:id
 */
router.get('/pautas/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`📄 Recebendo requisição GET /pautas/${id}`);

        const pauta = await prisma.pauta.findUnique({
            where: { id: parseInt(id) }
        });

        if (!pauta) {
            return res.status(404).json({ error: 'Pauta não encontrada' });
        }

        console.log('✅ Pauta encontrada:', pauta.id);
        res.status(200).json(pauta);
    } catch (error) {
        console.error('❌ Erro ao buscar pauta:', error);
        next(error);
    }
});

/**
 * Deletar pauta (protegido por JWT)
 * DELETE /api/pautas/:id
 */
router.delete('/pautas/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Recebendo requisição DELETE /pautas/${id}`);

        // Verificar se pauta existe
        const pauta = await prisma.pauta.findUnique({
            where: { id: parseInt(id) }
        });

        if (!pauta) {
            return res.status(404).json({ error: 'Pauta não encontrada' });
        }

        await prisma.pauta.delete({
            where: { id: parseInt(id) }
        });

        console.log('✅ Pauta deletada com sucesso');
        res.status(200).json({ message: 'Pauta deletada com sucesso' });
    } catch (error) {
        console.error('❌ Erro ao deletar pauta:', error);
        next(error);
    }
});

/**
 * Marcar pauta como lida (protegido por JWT)
 * PATCH /api/pautas/:id/marcar-lida
 */
router.patch('/pautas/:id/marcar-lida', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`👁️ Marcando pauta ${id} como lida`);

        const pauta = await prisma.pauta.update({
            where: { id: parseInt(id) },
            data: { lida: true }
        });

        console.log('✅ Pauta marcada como lida');
        res.status(200).json(pauta);
    } catch (error) {
        console.error('❌ Erro ao marcar pauta como lida:', error);
        next(error);
    }
});

/**
 * Converter pauta em post usando IA (protegido por JWT)
 * POST /api/pautas/:id/converter-em-post
 */
router.post('/pautas/:id/converter-em-post', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`🤖 Recebendo requisição POST /pautas/${id}/converter-em-post`);

        // Buscar pauta
        const pauta = await prisma.pauta.findUnique({
            where: { id: parseInt(id) }
        });

        if (!pauta) {
            return res.status(404).json({ error: 'Pauta não encontrada' });
        }

        console.log(`📋 Pauta encontrada: "${pauta.assunto}"`);
        console.log(`🔗 ${pauta.fontes.length} fonte(s) para processar`);

        // Buscar conteúdo de todas as fontes usando Jina AI (com markdown para extração de imagens)
        const conteudosPromises = pauta.fontes.map(fonte => 
            fetchContentWithJinaAndMarkdown(fonte.url).catch(err => {
                console.warn(`⚠️ Erro ao buscar ${fonte.url}:`, err.message);
                return null; // Retorna null se falhar
            })
        );

        const conteudosComMarkdown = await Promise.all(conteudosPromises);
        const conteudosValidos = conteudosComMarkdown.filter(c => c !== null && c.content.length > 0);

        if (conteudosValidos.length === 0) {
            return res.status(400).json({ 
                error: 'Não foi possível obter conteúdo de nenhuma fonte' 
            });
        }

        console.log(`✅ ${conteudosValidos.length} conteúdos obtidos com sucesso`);

        // Extrair imagem da primeira fonte válida
        let imagemUrl = null;
        try {
            console.log('🖼️  Tentando extrair imagem das fontes...');
            
            // Encontrar primeira fonte com conteúdo válido
            for (let i = 0; i < pauta.fontes.length; i++) {
                const fonte = pauta.fontes[i];
                const conteudoComMarkdown = conteudosComMarkdown[i];
                
                if (conteudoComMarkdown && conteudoComMarkdown.content.length > 0) {
                    imagemUrl = await processImageFromSource(
                        fonte.url,
                        conteudoComMarkdown.markdown
                    );
                    
                    if (imagemUrl) {
                        console.log(`✅ Imagem extraída e enviada para S3: ${imagemUrl}`);
                        break; // Parar na primeira imagem encontrada
                    }
                }
            }
        } catch (error) {
            console.error('❌ Erro ao processar imagem (continuando sem imagem):', error.message);
            // Não bloquear criação do post por erro de imagem
        }

        // Extrair apenas o conteúdo (sem markdown) para a IA
        const conteudos = conteudosValidos.map(c => c.content);

        // Gerar notícia com IA em 3 idiomas
        console.log('🤖 Gerando notícias em 3 idiomas com IA...');
        const newsData = await generateNewsWithAI({
            assunto: pauta.assunto,
            resumo: pauta.resumo,
            conteudos: conteudos,
            multilingual: true
        });

        console.log(`✅ Notícias geradas em PT, EN e ES`);

        // Buscar categorias disponíveis para categorização automática
        const categoriasDisponiveis = await prisma.categoria.findMany({
            include: {
                translations: true
            }
        });

        // Preparar categorias no formato esperado pela IA
        const categoriasFormatadas = categoriasDisponiveis.map(cat => {
            const pt = cat.translations.find(t => t.idioma === 'pt');
            const en = cat.translations.find(t => t.idioma === 'en');
            const es = cat.translations.find(t => t.idioma === 'es');
            return {
                id: cat.id,
                nomePt: pt?.nome || '',
                nomeEn: en?.nome || '',
                nomeEs: es?.nome || ''
            };
        });

        // Categorizar post usando IA (usar versão PT)
        let categoriaId = null;
        try {
            console.log('🏷️  Categorizando post com IA...');
            categoriaId = await categorizePostWithAI({
                titulo: newsData.pt.titulo,
                conteudo: newsData.pt.conteudo,
                categoriasDisponiveis: categoriasFormatadas
            });
            if (categoriaId) {
                console.log(`✅ Categoria determinada: ID ${categoriaId}`);
            } else {
                console.log('⚠️  Nenhuma categoria foi determinada');
            }
        } catch (error) {
            console.error('❌ Erro ao categorizar post (continuando sem categoria):', error.message);
        }

        // Gerar tags usando IA (usar versão PT)
        let tagsNomes = [];
        try {
            console.log('🏷️  Gerando tags com IA...');
            tagsNomes = await generateTagsWithAI({
                titulo: newsData.pt.titulo,
                conteudo: newsData.pt.conteudo,
                quantidade: 5
            });
            console.log(`✅ ${tagsNomes.length} tags geradas`);
        } catch (error) {
            console.error('❌ Erro ao gerar tags (continuando sem tags):', error.message);
        }

        // Criar ou buscar tags no banco de dados
        const tagsIds = [];
        for (const tagNome of tagsNomes) {
            try {
                // Tentar encontrar tag existente
                let tag = await prisma.tag.findUnique({
                    where: { nome: tagNome }
                });

                // Se não existe, criar
                if (!tag) {
                    tag = await prisma.tag.create({
                        data: { nome: tagNome }
                    });
                    console.log(`   ✅ Tag criada: ${tagNome}`);
                }

                tagsIds.push(tag.id);
            } catch (error) {
                console.warn(`⚠️  Erro ao processar tag "${tagNome}":`, error.message);
                // Continuar com outras tags mesmo se uma falhar
            }
        }

        // Gerar slugs únicos para cada idioma
        const slugs = {};
        const idiomas = ['pt', 'en', 'es'];
        
        for (const idioma of idiomas) {
            let baseSlug = generateSlug(newsData[idioma].titulo);
            let slugFinal = `${idioma}/${baseSlug}`;
            let contador = 1;

            // Verificar se slug já existe na tabela de traduções
            while (await prisma.postTranslation.findUnique({ where: { urlAmigavel: slugFinal } })) {
                slugFinal = `${idioma}/${baseSlug}-${contador}`;
                contador++;
            }

            slugs[idioma] = slugFinal;
            console.log(`   📝 Slug ${idioma.toUpperCase()}: ${slugFinal}`);
        }

        // Preparar array de imagens (sempre incluir imagem - extraída ou placeholder)
        // Se não encontrou imagem, usar placeholder padrão
        const imagens = imagemUrl ? [imagemUrl] : [getPlaceholderImageUrl()];

        // Preparar dados de categorias e tags para criação
        const categoriasData = categoriaId ? [{ categoriaId: categoriaId }] : [];
        const tagsData = tagsIds.map(tagId => ({ tagId: tagId }));

        // Criar post base (sem campos de conteúdo)
        const post = await prisma.post.create({
            data: {
                status: 'RASCUNHO',
                destaque: false,
                imagens: imagens,
                idiomaDefault: 'pt',
                dataPublicacao: new Date(),
                categorias: {
                    create: categoriasData
                },
                tags: {
                    create: tagsData
                },
                translations: {
                    create: idiomas.map(idioma => ({
                        idioma: idioma,
                        titulo: newsData[idioma].titulo,
                        chamada: newsData[idioma].chamada,
                        conteudo: newsData[idioma].conteudo,
                        urlAmigavel: slugs[idioma]
                    }))
                }
            },
            include: {
                categorias: {
                    include: {
                        categoria: true
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                },
                translations: true
            }
        });

        console.log(`✅ Post criado com sucesso! ID: ${post.id}`);
        console.log(`   🌍 Traduções: ${post.translations.length} idiomas`);

        res.status(201).json({
            message: 'Post criado em 3 idiomas (PT, EN, ES) com sucesso',
            postId: post.id,
            post: post
        });

    } catch (error) {
        console.error('❌ Erro ao converter pauta em post:', error);
        
        // Mensagens de erro mais amigáveis
        if (error.message.includes('OPENAI_API_KEY')) {
            return res.status(500).json({ 
                error: 'Serviço de IA não configurado. Contate o administrador.' 
            });
        }

        next(error);
    }
});

export default router;

