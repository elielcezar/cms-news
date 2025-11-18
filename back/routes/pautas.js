import express from 'express';
import prisma from '../config/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { authenticateApiKey } from '../middleware/apiKeyAuth.js';
import { validate, pautaCreateSchema } from '../middleware/validation.js';
import { fetchContentWithJina, generateNewsWithAI, generateSlug } from '../services/aiService.js';

const router = express.Router();

/**
 * Criar pauta (endpoint para n8n - protegido por API Key)
 * POST /api/pautas
 */
router.post('/pautas', authenticateApiKey, validate(pautaCreateSchema), async (req, res, next) => {
    try {
        console.log('📥 Recebendo requisição POST /pautas da IA');
        const { assunto, resumo, fontes, siteId } = req.body;

        const pauta = await prisma.pauta.create({
            data: {
                assunto,
                resumo,
                fontes,
                siteId: siteId || null,
            },
            include: {
                site: true,
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
 * Listar todas as pautas (protegido por JWT)
 * GET /api/pautas
 */
router.get('/pautas', authenticateToken, async (req, res, next) => {
    try {
        console.log('📋 Recebendo requisição GET /pautas');

        const filtro = {};
        
        // Filtro por site
        if (req.query.siteId) {
            filtro.siteId = parseInt(req.query.siteId);
        }

        // Filtro por busca no assunto
        if (req.query.search) {
            filtro.assunto = { contains: req.query.search };
        }

        const pautas = await prisma.pauta.findMany({
            where: filtro,
            include: {
                site: true,
            },
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
            where: { id: parseInt(id) },
            include: {
                site: true,
            }
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
            data: { lida: true },
            include: {
                site: true
            }
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
            where: { id: parseInt(id) },
            include: {
                site: true
            }
        });

        if (!pauta) {
            return res.status(404).json({ error: 'Pauta não encontrada' });
        }

        console.log(`📋 Pauta encontrada: "${pauta.assunto}"`);
        console.log(`🔗 ${pauta.fontes.length} fonte(s) para processar`);

        // Buscar conteúdo de todas as fontes usando Jina AI
        const conteudosPromises = pauta.fontes.map(fonte => 
            fetchContentWithJina(fonte.url).catch(err => {
                console.warn(`⚠️ Erro ao buscar ${fonte.url}:`, err.message);
                return ''; // Retorna vazio se falhar
            })
        );

        const conteudos = await Promise.all(conteudosPromises);
        const conteudosValidos = conteudos.filter(c => c.length > 0);

        if (conteudosValidos.length === 0) {
            return res.status(400).json({ 
                error: 'Não foi possível obter conteúdo de nenhuma fonte' 
            });
        }

        console.log(`✅ ${conteudosValidos.length} conteúdos obtidos com sucesso`);

        // Gerar notícia com IA
        console.log('🤖 Gerando notícia com IA...');
        const newsData = await generateNewsWithAI({
            assunto: pauta.assunto,
            resumo: pauta.resumo,
            conteudos: conteudosValidos
        });

        console.log(`✅ Notícia gerada: "${newsData.titulo}"`);

        // Gerar slug único
        let slug = generateSlug(newsData.titulo);
        let slugFinal = slug;
        let contador = 1;

        // Verificar se slug já existe
        while (await prisma.post.findUnique({ where: { urlAmigavel: slugFinal } })) {
            slugFinal = `${slug}-${contador}`;
            contador++;
        }

        // Criar post em rascunho
        const post = await prisma.post.create({
            data: {
                titulo: newsData.titulo,
                chamada: newsData.chamada,
                conteudo: newsData.conteudo,
                urlAmigavel: slugFinal,
                status: 'RASCUNHO',
                destaque: false,
                imagens: [],
                dataPublicacao: new Date(), // Data de criação do post
                sites: pauta.siteId ? {
                    create: {
                        siteId: pauta.siteId
                    }
                } : undefined
            },
            include: {
                sites: {
                    include: {
                        site: true
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                }
            }
        });

        console.log(`✅ Post criado com sucesso! ID: ${post.id}`);

        res.status(201).json({
            message: 'Post criado com sucesso',
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

