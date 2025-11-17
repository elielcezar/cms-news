import express from 'express';
import prisma from '../config/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { authenticateJwtOrApiKey } from '../middleware/apiKeyAuth.js';
import { validate, fonteCreateSchema, fonteUpdateSchema } from '../middleware/validation.js';
import { NotFoundError } from '../utils/errors.js';

const router = express.Router();

/**
 * Criar fonte (protegido por JWT)
 * POST /api/fontes
 */
router.post('/fontes', authenticateToken, validate(fonteCreateSchema), async (req, res, next) => {
    try {
        console.log('📥 Recebendo requisição POST /fontes');
        const { titulo, url, siteId } = req.body;

        // Verificar se site existe
        const site = await prisma.site.findUnique({
            where: { id: siteId }
        });

        if (!site) {
            throw new NotFoundError('Site não encontrado');
        }

        const fonte = await prisma.fonte.create({
            data: {
                titulo,
                url,
                siteId,
            },
            include: {
                site: true,
            }
        });

        console.log('✅ Fonte criada com sucesso:', fonte.id);
        res.status(201).json(fonte);
    } catch (error) {
        console.error('❌ Erro ao criar fonte:', error);
        next(error);
    }
});

/**
 * Listar fontes agrupadas por site (protegido por JWT OU API Key)
 * Endpoint especial para uso da IA
 * GET /api/fontes/por-site
 */
router.get('/fontes/por-site', authenticateJwtOrApiKey, async (req, res, next) => {
    try {
        console.log('📋 Recebendo requisição GET /fontes/por-site');

        const sites = await prisma.site.findMany({
            include: {
                fontes: {
                    select: {
                        id: true,
                        titulo: true,
                        url: true,
                    },
                    orderBy: {
                        titulo: 'asc'
                    }
                }
            },
            orderBy: {
                nome: 'asc'
            }
        });

        // Filtrar apenas sites que tem fontes
        const sitesComFontes = sites.filter(site => site.fontes.length > 0);

        const response = {
            sites: sitesComFontes.map(site => ({
                id: site.id,
                nome: site.nome,
                fontes: site.fontes
            }))
        };

        console.log(`✅ ${sitesComFontes.length} sites com fontes encontrados`);
        res.status(200).json(response);
    } catch (error) {
        console.error('❌ Erro ao listar fontes por site:', error);
        next(error);
    }
});

/**
 * Listar todas as fontes (protegido por JWT)
 * GET /api/fontes
 */
router.get('/fontes', authenticateToken, async (req, res, next) => {
    try {
        console.log('📋 Recebendo requisição GET /fontes');

        const filtro = {};
        
        // Filtro por site
        if (req.query.siteId) {
            filtro.siteId = parseInt(req.query.siteId);
        }

        // Filtro por busca no título ou URL
        if (req.query.search) {
            filtro.OR = [
                { titulo: { contains: req.query.search } },
                { url: { contains: req.query.search } }
            ];
        }

        const fontes = await prisma.fonte.findMany({
            where: filtro,
            include: {
                site: true,
            },
            orderBy: {
                titulo: 'asc'
            }
        });

        console.log(`✅ ${fontes.length} fontes encontradas`);
        res.status(200).json(fontes);
    } catch (error) {
        console.error('❌ Erro ao listar fontes:', error);
        next(error);
    }
});

/**
 * Listar fontes de um site específico (protegido por JWT OU API Key)
 * Endpoint específico para workflows da IA
 * GET /api/fontes/site/:id
 */
router.get('/fontes/site/:id', authenticateJwtOrApiKey, async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`📋 Recebendo requisição GET /fontes/site/${id}`);

        // Buscar site
        const site = await prisma.site.findUnique({
            where: { id: parseInt(id) }
        });

        if (!site) {
            throw new NotFoundError('Site não encontrado');
        }

        // Buscar fontes do site
        const fontes = await prisma.fonte.findMany({
            where: { siteId: parseInt(id) },
            select: {
                id: true,
                titulo: true,
                url: true,
            },
            orderBy: {
                titulo: 'asc'
            }
        });

        const response = {
            siteId: site.id,
            siteNome: site.nome,
            fontes: fontes
        };

        console.log(`✅ ${fontes.length} fontes encontradas para o site "${site.nome}"`);
        res.status(200).json(response);
    } catch (error) {
        console.error('❌ Erro ao listar fontes do site:', error);
        next(error);
    }
});

/**
 * Obter fonte por ID (protegido por JWT)
 * GET /api/fontes/:id
 */
router.get('/fontes/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`📄 Recebendo requisição GET /fontes/${id}`);

        const fonte = await prisma.fonte.findUnique({
            where: { id: parseInt(id) },
            include: {
                site: true,
            }
        });

        if (!fonte) {
            throw new NotFoundError('Fonte não encontrada');
        }

        console.log('✅ Fonte encontrada:', fonte.id);
        res.status(200).json(fonte);
    } catch (error) {
        console.error('❌ Erro ao buscar fonte:', error);
        next(error);
    }
});

/**
 * Atualizar fonte (protegido por JWT)
 * PUT /api/fontes/:id
 */
router.put('/fontes/:id', authenticateToken, validate(fonteUpdateSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { titulo, url, siteId } = req.body;
        console.log(`📝 Recebendo requisição PUT /fontes/${id}`);

        // Verificar se fonte existe
        const fonteExistente = await prisma.fonte.findUnique({
            where: { id: parseInt(id) }
        });

        if (!fonteExistente) {
            throw new NotFoundError('Fonte não encontrada');
        }

        // Se siteId for fornecido, verificar se site existe
        if (siteId) {
            const site = await prisma.site.findUnique({
                where: { id: siteId }
            });

            if (!site) {
                throw new NotFoundError('Site não encontrado');
            }
        }

        const dataToUpdate = {};
        if (titulo !== undefined) dataToUpdate.titulo = titulo;
        if (url !== undefined) dataToUpdate.url = url;
        if (siteId !== undefined) dataToUpdate.siteId = siteId;

        const fonte = await prisma.fonte.update({
            where: { id: parseInt(id) },
            data: dataToUpdate,
            include: {
                site: true,
            }
        });

        console.log('✅ Fonte atualizada com sucesso');
        res.status(200).json(fonte);
    } catch (error) {
        console.error('❌ Erro ao atualizar fonte:', error);
        next(error);
    }
});

/**
 * Deletar fonte (protegido por JWT)
 * DELETE /api/fontes/:id
 */
router.delete('/fontes/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Recebendo requisição DELETE /fontes/${id}`);

        // Verificar se fonte existe
        const fonte = await prisma.fonte.findUnique({
            where: { id: parseInt(id) }
        });

        if (!fonte) {
            throw new NotFoundError('Fonte não encontrada');
        }

        await prisma.fonte.delete({
            where: { id: parseInt(id) }
        });

        console.log('✅ Fonte deletada com sucesso');
        res.status(200).json({ message: 'Fonte deletada com sucesso' });
    } catch (error) {
        console.error('❌ Erro ao deletar fonte:', error);
        next(error);
    }
});

export default router;

