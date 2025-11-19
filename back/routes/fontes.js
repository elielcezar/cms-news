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
        const { titulo, url } = req.body;

        const fonte = await prisma.fonte.create({
            data: {
                titulo,
                url,
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
 * Listar todas as fontes (protegido por JWT)
 * GET /api/fontes
 */
router.get('/fontes', authenticateToken, async (req, res, next) => {
    try {
        console.log('📋 Recebendo requisição GET /fontes');

        const filtro = {};

        // Filtro por busca no título ou URL
        if (req.query.search) {
            filtro.OR = [
                { titulo: { contains: req.query.search } },
                { url: { contains: req.query.search } }
            ];
        }

        const fontes = await prisma.fonte.findMany({
            where: filtro,
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
 * Obter fonte por ID (protegido por JWT)
 * GET /api/fontes/:id
 */
router.get('/fontes/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`📄 Recebendo requisição GET /fontes/${id}`);

        const fonte = await prisma.fonte.findUnique({
            where: { id: parseInt(id) }
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
        const { titulo, url } = req.body;
        console.log(`📝 Recebendo requisição PUT /fontes/${id}`);

        // Verificar se fonte existe
        const fonteExistente = await prisma.fonte.findUnique({
            where: { id: parseInt(id) }
        });

        if (!fonteExistente) {
            throw new NotFoundError('Fonte não encontrada');
        }

        const dataToUpdate = {};
        if (titulo !== undefined) dataToUpdate.titulo = titulo;
        if (url !== undefined) dataToUpdate.url = url;

        const fonte = await prisma.fonte.update({
            where: { id: parseInt(id) },
            data: dataToUpdate
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

