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
        const { translations } = req.body;

        // Criar categoria com traduções
        const response = await prisma.categoria.create({
            data: {
                translations: {
                    create: [
                        { idioma: 'pt', nome: translations.pt },
                        ...(translations.en ? [{ idioma: 'en', nome: translations.en }] : []),
                        ...(translations.es ? [{ idioma: 'es', nome: translations.es }] : []),
                    ]
                }
            },
            include: {
                translations: true
            }
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
        const { lang } = req.query; // pt, en, es

        const categorias = await prisma.categoria.findMany({
            include: {
                translations: lang ? {
                    where: { idioma: lang }
                } : true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`Categorias encontradas: ${categorias.length}`);

        // Se solicitou idioma específico, simplificar response
        if (lang) {
            const categoriasSimplificadas = categorias.map(cat => ({
                id: cat.id,
                nome: cat.translations[0]?.nome || 'Sem tradução',
                createdAt: cat.createdAt,
                updatedAt: cat.updatedAt
            }));
            return res.status(200).json(categoriasSimplificadas);
        }

        res.status(200).json(categorias);
    } catch (error) {
        next(error);
    }
});

// Obter categoria por ID (público ou protegido, dependendo do uso)
router.get('/categorias/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const categoria = await prisma.categoria.findUnique({
            where: { id: parseInt(id) },
            include: {
                translations: true
            }
        });

        if (!categoria) {
            return res.status(404).json({ message: 'Categoria não encontrada' });
        }

        res.status(200).json(categoria);
    } catch (error) {
        next(error);
    }
});

// Atualizar categoria (protegido)
router.put('/categorias/:id', authenticateToken, validate(categoriaSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { translations } = req.body;

        // Deletar traduções existentes e criar novas
        await prisma.categoriaTranslation.deleteMany({
            where: { categoriaId: parseInt(id) }
        });

        const categoria = await prisma.categoria.update({
            where: { id: parseInt(id) },
            data: {
                translations: {
                    create: [
                        { idioma: 'pt', nome: translations.pt },
                        ...(translations.en ? [{ idioma: 'en', nome: translations.en }] : []),
                        ...(translations.es ? [{ idioma: 'es', nome: translations.es }] : []),
                    ]
                }
            },
            include: {
                translations: true
            }
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

