import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';

/**
 * Middleware de autenticação JWT
 * Verifica se o usuário possui um token válido
 */
export const authenticateToken = (req, res, next) => {
  try {
    // Obter token do header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new UnauthorizedError('Token de autenticação não fornecido');
    }

    // Verificar e decodificar o token
    const decoded = verifyToken(token);
    
    // Adicionar dados do usuário ao request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return res.status(401).json({ error: error.message });
    }
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

/**
 * Middleware opcional de autenticação
 * Se o token existir, valida e adiciona ao req.user
 * Se não existir, apenas continua
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      };
    }

    next();
  } catch (error) {
    // Se o token for inválido, apenas continua sem autenticar
    next();
  }
};

