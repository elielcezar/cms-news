import express from 'express';
import prisma from '../config/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, categoriaSchema } from '../middleware/validation.js';
import { ConflictError } from '../utils/errors.js';

const router = express.Router();

// Criar categoria (protegido)
router.post('/categorias', authenticateToken, validate(categoriaSchema), async (req, res, next) => {
    try {
        console.log('Recebendo requisição POST /categorias');
        const { nome } = req.body;

        // Verificar se categoria já existe
        const existingCategoria = await prisma.categoria.findUnique({
            where: { nome }
        });

        if (existingCategoria) {
            throw new ConflictError('Categoria já existe');
        }

        const response = await prisma.categoria.create({
            data: { nome }
        });

        console.log('Categoria criada:', response);
        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
})

// Lista categorias (público - necessário para exibir no site)
router.get('/categorias', async (req, res, next) => {
    try {
        console.log('Recebendo requisição GET /categorias');

        const filtro = {};
        if (req.query.nome) {
            filtro.nome = { contains: req.query.nome };
        }

        const categorias = await prisma.categoria.findMany({
            where: filtro,
            orderBy: {
                nome: 'asc'
            }
        });

        console.log(`Categorias encontradas: ${categorias.length}`);
        res.status(200).json(categorias);
    } catch (error) {
        next(error);
    }
});

// Atualizar categoria (protegido)
router.put('/categorias/:id', authenticateToken, validate(categoriaSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome } = req.body;

        const categoria = await prisma.categoria.update({
            where: { id: parseInt(id) },
            data: { nome }
        });

        res.status(200).json(categoria);
    } catch (error) {
        next(error);
    }
});

// Deletar categoria (protegido)
router.delete('/categorias/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.categoria.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({ message: 'Categoria deletada com sucesso' });
    } catch (error) {
        next(error);
    }
});

export default router;

