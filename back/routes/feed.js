import express from 'express';
import prisma from '../config/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { fetchContentWithJina, extractFeedItemsWithAI } from '../services/aiService.js';

const router = express.Router();

/**
 * Buscar feed items de todas as fontes ativas (protegido por JWT)
 * POST /api/feed/buscar
 */
router.post('/feed/buscar', authenticateToken, async (req, res, next) => {
    try {
        console.log('🔍 Iniciando busca de feed items...');

        // Buscar todas as fontes cadastradas
        const fontes = await prisma.fonte.findMany({
            orderBy: { titulo: 'asc' }
        });

        if (fontes.length === 0) {
            return res.status(400).json({ 
                error: 'Nenhuma fonte cadastrada. Cadastre fontes antes de buscar feed.' 
            });
        }

        console.log(`📚 ${fontes.length} fontes encontradas`);

        // Estatísticas
        const stats = {
            fontesProcessadas: 0,
            fontesComErro: 0,
            itensEncontrados: 0,
            itensNovos: 0,
            itensDuplicados: 0
        };

        // Processar cada fonte (com limite de concorrência)
        const CONCURRENCY_LIMIT = 3;
        const results = [];
        
        for (let i = 0; i < fontes.length; i += CONCURRENCY_LIMIT) {
            const batch = fontes.slice(i, i + CONCURRENCY_LIMIT);
            
            const batchResults = await Promise.allSettled(
                batch.map(async (fonte) => {
                    try {
                        console.log(`\n📰 Processando fonte: ${fonte.titulo}`);
                        
                        // Buscar conteúdo usando Jina AI
                        const conteudo = await fetchContentWithJina(fonte.url);
                        
                        if (!conteudo || conteudo.length < 100) {
                            console.warn(`⚠️ Conteúdo muito curto para ${fonte.titulo}`);
                            return { fonte, items: [], error: 'Conteúdo insuficiente' };
                        }

                        // Extrair itens do feed usando IA
                        const items = await extractFeedItemsWithAI({
                            fonteUrl: fonte.url,
                            fonteTitulo: fonte.titulo,
                            conteudoJina: conteudo,
                            limite: 10
                        });

                        return { fonte, items, error: null };
                    } catch (error) {
                        console.error(`❌ Erro ao processar ${fonte.titulo}:`, error.message);
                        return { fonte, items: [], error: error.message };
                    }
                })
            );

            results.push(...batchResults);
        }

        // Processar resultados e salvar no banco
        for (const result of results) {
            if (result.status === 'fulfilled') {
                const { fonte, items, error } = result.value;
                
                if (error) {
                    stats.fontesComErro++;
                } else {
                    stats.fontesProcessadas++;
                }

                stats.itensEncontrados += items.length;

                // Salvar itens no banco (evitar duplicatas)
                for (const item of items) {
                    try {
                        // Verificar se já existe pela URL
                        const existente = await prisma.feedItem.findUnique({
                            where: { url: item.url }
                        });

                        if (existente) {
                            stats.itensDuplicados++;
                            continue;
                        }

                        // Criar novo item
                        const novoItem = await prisma.feedItem.create({
                            data: {
                                fonteId: fonte.id,
                                titulo: item.titulo,
                                url: item.url,
                                chamada: item.chamada,
                                imagemUrl: item.imagemUrl,
                                dataPublicacao: item.dataPublicacao
                            }
                        });

                        stats.itensNovos++;
                        console.log(`   ✅ Novo item salvo (ID: ${novoItem.id}): ${item.titulo.substring(0, 50)}...`);
                    } catch (error) {
                        // Erro de constraint unique (duplicata)
                        if (error.code === 'P2002') {
                            stats.itensDuplicados++;
                            console.log(`   🔄 Duplicado ignorado: ${item.url}`);
                        } else {
                            console.error(`   ❌ Erro ao salvar item "${item.titulo}":`, error.message);
                            console.error(`   Código do erro: ${error.code}`);
                            console.error(`   Stack:`, error.stack);
                        }
                    }
                }
            } else {
                stats.fontesComErro++;
            }
        }

        console.log(`\n✅ Busca de feed concluída!`);
        console.log(`   📊 Fontes processadas: ${stats.fontesProcessadas}/${fontes.length}`);
        console.log(`   📰 Itens encontrados: ${stats.itensEncontrados}`);
        console.log(`   ✨ Novos itens: ${stats.itensNovos}`);
        console.log(`   🔄 Duplicados ignorados: ${stats.itensDuplicados}`);

        res.status(200).json({
            message: `${stats.itensNovos} novos itens de feed foram adicionados!`,
            stats,
            status: 'completed'
        });
    } catch (error) {
        console.error('❌ Erro ao buscar feed:', error);
        next(error);
    }
});

/**
 * Listar feed items com paginação (protegido por JWT)
 * GET /api/feed
 * Query params: page, limit, fonteId, lida, search
 */
router.get('/feed', authenticateToken, async (req, res, next) => {
    try {
        console.log('📋 Recebendo requisição GET /feed');

        // Parâmetros de paginação
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        // Filtros
        const where = {};

        // Filtro por fonte
        if (req.query.fonteId) {
            where.fonteId = parseInt(req.query.fonteId);
        }

        // Filtro por lida
        if (req.query.lida !== undefined) {
            where.lida = req.query.lida === 'true';
        }

        // Filtro por busca no título
        if (req.query.search) {
            where.titulo = { contains: req.query.search };
        }

        // Buscar total de itens
        const total = await prisma.feedItem.count({ where });

        // Buscar itens paginados
        const items = await prisma.feedItem.findMany({
            where,
            include: {
                fonte: {
                    select: {
                        id: true,
                        titulo: true,
                        url: true
                    }
                }
            },
            orderBy: [
                { dataPublicacao: 'desc' },
                { createdAt: 'desc' }
            ],
            skip,
            take: limit
        });

        console.log(`✅ ${items.length} feed items encontrados (página ${page})`);

        res.status(200).json({
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + items.length < total
            }
        });
    } catch (error) {
        console.error('❌ Erro ao listar feed:', error);
        next(error);
    }
});

/**
 * Listar fontes disponíveis para filtro (protegido por JWT)
 * GET /api/feed/fontes
 * IMPORTANTE: Esta rota deve vir ANTES de /feed/:id para evitar conflito
 */
router.get('/feed/fontes', authenticateToken, async (req, res, next) => {
    try {
        // Buscar todas as fontes
        const fontes = await prisma.fonte.findMany({
            select: {
                id: true,
                titulo: true
            },
            orderBy: { titulo: 'asc' }
        });

        // Buscar contagem de items por fonte
        const contagens = await Promise.all(
            fontes.map(async (fonte) => {
                try {
                    const count = await prisma.feedItem.count({
                        where: { fonteId: fonte.id }
                    });
                    return { fonteId: fonte.id, count };
                } catch (error) {
                    // Se a tabela ainda não existe, retornar 0
                    console.warn(`⚠️ Erro ao contar items da fonte ${fonte.id}:`, error.message);
                    return { fonteId: fonte.id, count: 0 };
                }
            })
        );

        // Formatar resposta
        const fontesFormatadas = fontes.map(fonte => {
            const contagem = contagens.find(c => c.fonteId === fonte.id);
            return {
                id: fonte.id,
                titulo: fonte.titulo,
                totalItems: contagem?.count || 0
            };
        });

        res.status(200).json(fontesFormatadas);
    } catch (error) {
        console.error('❌ Erro ao listar fontes:', error);
        next(error);
    }
});

/**
 * Obter feed item por ID (protegido por JWT)
 * GET /api/feed/:id
 */
router.get('/feed/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Validar que o ID é um número
        const idNum = parseInt(id);
        if (isNaN(idNum)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        console.log(`📄 Recebendo requisição GET /feed/${idNum}`);

        const item = await prisma.feedItem.findUnique({
            where: { id: idNum },
            include: {
                fonte: {
                    select: {
                        id: true,
                        titulo: true,
                        url: true
                    }
                }
            }
        });

        if (!item) {
            return res.status(404).json({ error: 'Feed item não encontrado' });
        }

        console.log('✅ Feed item encontrado:', item.id);
        res.status(200).json(item);
    } catch (error) {
        console.error('❌ Erro ao buscar feed item:', error);
        next(error);
    }
});

/**
 * Marcar feed item como lido (protegido por JWT)
 * PATCH /api/feed/:id/marcar-lida
 */
router.patch('/feed/:id/marcar-lida', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`👁️ Marcando feed item ${id} como lido`);

        const item = await prisma.feedItem.update({
            where: { id: parseInt(id) },
            data: { lida: true }
        });

        console.log('✅ Feed item marcado como lido');
        res.status(200).json(item);
    } catch (error) {
        console.error('❌ Erro ao marcar feed item como lido:', error);
        next(error);
    }
});

/**
 * Deletar feed item (protegido por JWT)
 * DELETE /api/feed/:id
 */
router.delete('/feed/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Recebendo requisição DELETE /feed/${id}`);

        // Verificar se existe
        const item = await prisma.feedItem.findUnique({
            where: { id: parseInt(id) }
        });

        if (!item) {
            return res.status(404).json({ error: 'Feed item não encontrado' });
        }

        await prisma.feedItem.delete({
            where: { id: parseInt(id) }
        });

        console.log('✅ Feed item deletado com sucesso');
        res.status(200).json({ message: 'Feed item deletado com sucesso' });
    } catch (error) {
        console.error('❌ Erro ao deletar feed item:', error);
        next(error);
    }
});

/**
 * Deletar múltiplos feed items (protegido por JWT)
 * DELETE /api/feed/multiplos
 * Body: { ids: [1, 2, 3] }
 */
router.delete('/feed/multiplos', authenticateToken, async (req, res, next) => {
    try {
        const { ids } = req.body;
        console.log(`🗑️ Recebendo requisição DELETE /feed/multiplos`, ids);

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'IDs inválidos. Envie um array de IDs.' });
        }

        const result = await prisma.feedItem.deleteMany({
            where: {
                id: { in: ids.map(id => parseInt(id)) }
            }
        });

        console.log(`✅ ${result.count} feed items deletados com sucesso`);
        res.status(200).json({ 
            message: `${result.count} feed items deletados com sucesso`,
            count: result.count
        });
    } catch (error) {
        console.error('❌ Erro ao deletar múltiplos feed items:', error);
        next(error);
    }
});


/**
 * Marcar todos os itens como lidos (protegido por JWT)
 * PATCH /api/feed/marcar-todas-lidas
 */
router.patch('/feed/marcar-todas-lidas', authenticateToken, async (req, res, next) => {
    try {
        console.log('👁️ Marcando todos os feed items como lidos');

        const result = await prisma.feedItem.updateMany({
            where: { lida: false },
            data: { lida: true }
        });

        console.log(`✅ ${result.count} feed items marcados como lidos`);
        res.status(200).json({ 
            message: `${result.count} itens marcados como lidos`,
            count: result.count
        });
    } catch (error) {
        console.error('❌ Erro ao marcar todos como lidos:', error);
        next(error);
    }
});

export default router;

