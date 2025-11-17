import jwt from 'jsonwebtoken';

/**
 * Middleware para autenticação via API Key
 * Usado para endpoints externos (como n8n)
 */
export const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.N8N_API_KEY;
  
  if (!validApiKey) {
    console.error('⚠️ N8N_API_KEY não está configurada no .env');
    return res.status(500).json({ 
      error: 'Configuração de API Key não encontrada' 
    });
  }
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API Key não fornecida. Use o header x-api-key' 
    });
  }
  
  if (apiKey !== validApiKey) {
    return res.status(401).json({ 
      error: 'API Key inválida' 
    });
  }
  
  next();
};

/**
 * Middleware flexível: aceita JWT OU API Key
 * Usado para endpoints que podem ser acessados por usuários logados OU por n8n
 */
export const authenticateJwtOrApiKey = (req, res, next) => {
  // Tenta API Key primeiro
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.N8N_API_KEY;
  
  if (apiKey) {
    // Se tem API Key, valida
    if (!validApiKey) {
      console.error('⚠️ N8N_API_KEY não está configurada no .env');
      return res.status(500).json({ 
        error: 'Configuração de API Key não encontrada' 
      });
    }
    
    if (apiKey === validApiKey) {
      console.log('✅ Autenticado via API Key');
      return next();
    } else {
      return res.status(401).json({ 
        error: 'API Key inválida' 
      });
    }
  }
  
  // Se não tem API Key, tenta JWT
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: 'Token não fornecido. Use Authorization header (JWT) ou x-api-key (API Key)' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Token malformado' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log('✅ Autenticado via JWT');
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Token inválido ou expirado' 
    });
  }
};

