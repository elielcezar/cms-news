import { z } from 'zod';
import { ValidationError } from '../utils/errors.js';

/**
 * Middleware de validação usando Zod
 * @param {z.ZodSchema} schema - Schema Zod para validação
 * @param {string} source - Fonte dos dados ('body', 'query', 'params')
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      schema.parse(dataToValidate);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({
          error: 'Erro de validação',
          details: messages,
        });
      }
      next(error);
    }
  };
};

// Schemas de validação comuns

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const userCreateSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const userUpdateSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Pelo menos um campo deve ser fornecido para atualização',
});

export const postCreateSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  chamada: z.string().min(10, 'Chamada deve ter no mínimo 10 caracteres'),
  conteudo: z.string().min(10, 'Conteúdo deve ter no mínimo 10 caracteres'),
  urlAmigavel: z.string()
    .min(3, 'URL amigável deve ter no mínimo 3 caracteres')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'URL amigável deve conter apenas letras minúsculas, números e hífens'),
  status: z.enum(['RASCUNHO', 'PUBLICADO']).optional(),
  destaque: z.boolean().optional(),
  dataPublicacao: z.string().optional(), // ISO string
  sites: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
});

export const postUpdateSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').optional(),
  chamada: z.string().min(10, 'Chamada deve ter no mínimo 10 caracteres').optional(),
  conteudo: z.string().min(10, 'Conteúdo deve ter no mínimo 10 caracteres').optional(),
  urlAmigavel: z.string()
    .min(3, 'URL amigável deve ter no mínimo 3 caracteres')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'URL amigável deve conter apenas letras minúsculas, números e hífens')
    .optional(),
  status: z.enum(['RASCUNHO', 'PUBLICADO']).optional(),
  destaque: z.boolean().optional(),
  dataPublicacao: z.string().optional(),
  sites: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Pelo menos um campo deve ser fornecido para atualização',
});

export const siteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});

// Alias para compatibilidade
export const categoriaSchema = siteSchema;

export const tagSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});

