import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, userCreateSchema, userUpdateSchema } from '../middleware/validation.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

const router = express.Router();

// Criar usuario (protegido - apenas admins podem criar)
router.post('/usuarios', authenticateToken, validate(userCreateSchema), async (req, res, next) => {
    try {
        console.log('Recebendo requisição POST /usuarios');
        const { name, email, password } = req.body;

        // Verificar se email já existe
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            throw new ConflictError('Email já cadastrado');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword
            }
        });

        // Retornar usuário sem a senha
        const { password: _, ...userWithoutPassword } = user;
        console.log('Usuário criado:', userWithoutPassword);
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        next(error);
    }
});

// Listar usuarios (protegido)
router.get('/usuarios', authenticateToken, async (req, res, next) => {
    try {
        console.log('Recebendo requisição GET /usuarios');

        const filtro = {};
        if (req.query.name) filtro.name = { contains: req.query.name };
        if (req.query.email) filtro.email = { contains: req.query.email };

        const users = await prisma.user.findMany({
            where: filtro,
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true,
                // Não retornar password
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`Usuários encontrados: ${users.length}`);
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
});


// Obter usuario pelo ID (protegido)
router.get('/usuarios/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: {
                id: parseInt(id)
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true,
                // Não retornar password
            }
        });

        if (!user) {
            throw new NotFoundError('Usuário não encontrado');
        }

        res.json(user);
    } catch (error) {
        next(error);
    }
});

// Atualizar usuario (protegido)
router.put('/usuarios/:id', authenticateToken, validate(userUpdateSchema), async (req, res, next) => {
    try {
        console.log('Recebendo requisição PUT /usuarios');
        const { id } = req.params;
        const { name, email, password } = req.body;

        // Verificar se usuário existe
        const existingUser = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingUser) {
            throw new NotFoundError('Usuário não encontrado');
        }

        // Verificar se novo email já está em uso por outro usuário
        if (email && email !== existingUser.email) {
            const emailInUse = await prisma.user.findUnique({
                where: { email }
            });

            if (emailInUse) {
                throw new ConflictError('Email já está em uso');
            }
        }

        // Preparar dados para atualização
        const dataToUpdate = {};
        if (name) dataToUpdate.name = name;
        if (email) dataToUpdate.email = email;
        if (password) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: dataToUpdate,
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        console.log('Usuário atualizado:', user);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
});

// Excluir usuario (protegido)
router.delete('/usuarios/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });

        if (!user) {
            throw new NotFoundError('Usuário não encontrado');
        }

        await prisma.user.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({
            message: 'Usuário deletado com sucesso'
        });
    } catch (error) {
        next(error);
    }
});

export default router;
