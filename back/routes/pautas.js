import express from 'express';
import prisma from '../config/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { authenticateApiKey } from '../middleware/apiKeyAuth.js';
import { validate, pautaCreateSchema } from '../middleware/validation.js';

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

export default router;

