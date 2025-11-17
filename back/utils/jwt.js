import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Gera um token de acesso JWT
 * @param {Object} payload - Dados do usuário para incluir no token
 * @returns {string} Token JWT
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Gera um refresh token JWT
 * @param {Object} payload - Dados do usuário para incluir no token
 * @returns {string} Refresh Token JWT
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
};

/**
 * Verifica e decodifica um token JWT
 * @param {string} token - Token JWT para verificar
 * @returns {Object} Payload decodificado
 * @throws {Error} Se o token for inválido
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
};

/**
 * Decodifica um token sem verificar (útil para debug)
 * @param {string} token - Token JWT
 * @returns {Object} Payload decodificado
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

