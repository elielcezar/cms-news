import express from 'express';
import prisma from '../config/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { fetchContentWithJina, fetchContentWithJinaAndMarkdown, extractFeedItemsWithAI, generateNewsWithAI, generateSlug, categorizePostWithAI, generateTagsWithAI } from '../services/aiService.js';
import { processImageFromSource } from '../services/imageService.js';
import { getPlaceholderImageUrl } from '../utils/imagePlaceholder.js';

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

/**
 * Converter feed item em post usando IA (protegido por JWT)
 * POST /api/feed/:id/converter-em-post
 */
router.post('/feed/:id/converter-em-post', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`🤖 Recebendo requisição POST /feed/${id}/converter-em-post`);

        // Buscar feed item
        const feedItem = await prisma.feedItem.findUnique({
            where: { id: parseInt(id) },
            include: {
                fonte: true
            }
        });

        if (!feedItem) {
            return res.status(404).json({ error: 'Feed item não encontrado' });
        }

        console.log(`📋 Feed item encontrado: "${feedItem.titulo}"`);
        console.log(`🔗 URL: ${feedItem.url}`);

        // Buscar conteúdo da URL usando Jina AI (com markdown para extração de imagens)
        let conteudoComMarkdown = null;
        try {
            conteudoComMarkdown = await fetchContentWithJinaAndMarkdown(feedItem.url);
            if (!conteudoComMarkdown || conteudoComMarkdown.content.length < 100) {
                return res.status(400).json({ 
                    error: 'Não foi possível obter conteúdo da notícia' 
                });
            }
        } catch (error) {
            console.error('❌ Erro ao buscar conteúdo:', error.message);
            return res.status(400).json({ 
                error: 'Não foi possível obter conteúdo da notícia' 
            });
        }

        console.log(`✅ Conteúdo obtido com sucesso`);

        // Extrair imagem
        let imagemUrl = null;
        try {
            console.log('🖼️  Tentando extrair imagem...');
            imagemUrl = await processImageFromSource(
                feedItem.url,
                conteudoComMarkdown.markdown
            );
            
            if (imagemUrl) {
                console.log(`✅ Imagem extraída e enviada para S3: ${imagemUrl}`);
            }
        } catch (error) {
            console.error('❌ Erro ao processar imagem (continuando sem imagem):', error.message);
            // Não bloquear criação do post por erro de imagem
        }

        // Preparar dados para a IA
        const assunto = feedItem.titulo;
        const resumo = feedItem.chamada || feedItem.titulo;
        const conteudos = [conteudoComMarkdown.content];

        // Gerar notícia com IA em 3 idiomas
        console.log('🤖 Gerando notícias em 3 idiomas com IA...');
        const newsData = await generateNewsWithAI({
            assunto: assunto,
            resumo: resumo,
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
        console.error('❌ Erro ao converter feed item em post:', error);
        
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

