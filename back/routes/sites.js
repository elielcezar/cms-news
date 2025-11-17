import express from 'express';
import prisma from '../config/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, siteSchema } from '../middleware/validation.js';
import { ConflictError } from '../utils/errors.js';

const router = express.Router();

// Criar site (protegido)
router.post('/sites', authenticateToken, validate(siteSchema), async (req, res, next) => {
    try {
        console.log('Recebendo requisição POST /sites');
        const { nome } = req.body;

        // Verificar se site já existe
        const existingSite = await prisma.site.findUnique({
            where: { nome }
        });

        if (existingSite) {
            throw new ConflictError('Site já existe');
        }

        const response = await prisma.site.create({
            data: { nome }
        });

        console.log('Site criado:', response);
        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
})

// Lista sites (público - necessário para exibir no site)
router.get('/sites', async (req, res, next) => {
    try {
        console.log('Recebendo requisição GET /sites');

        const filtro = {};
        if (req.query.nome) {
            filtro.nome = { contains: req.query.nome };
        }

        const sites = await prisma.site.findMany({
            where: filtro,
            orderBy: {
                nome: 'asc'
            }
        });

        console.log(`Sites encontrados: ${sites.length}`);
        res.status(200).json(sites);
    } catch (error) {
        next(error);
    }
});

// Atualizar site (protegido)
router.put('/sites/:id', authenticateToken, validate(siteSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome } = req.body;

        const site = await prisma.site.update({
            where: { id: parseInt(id) },
            data: { nome }
        });

        res.status(200).json(site);
    } catch (error) {
        next(error);
    }
});

// Deletar site (protegido)
router.delete('/sites/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.site.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({ message: 'Site deletado com sucesso' });
    } catch (error) {
        next(error);
    }
});

export default router;

