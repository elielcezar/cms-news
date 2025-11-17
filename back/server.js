import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usuariosRoutes from './routes/usuarios.js';
import postsRoutes from './routes/posts.js';
import loginRoutes from './routes/login.js';
import sitesRoutes from './routes/sites.js';
import tagsRoutes from './routes/tags.js';
import pautasRoutes from './routes/pautas.js';
import fontesRoutes from './routes/fontes.js';
import { errorHandler } from './utils/errors.js';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração CORS - aceitar múltiplas origens
const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['*'];

app.use(cors({
    origin: (origin, callback) => {
        // Sem origin (ex: requisições mobile, Postman) - permitir
        if (!origin) {
            return callback(null, true);
        }

        // Se permitir tudo ou origem está na lista, permitir
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Em desenvolvimento, sempre permitir
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        // Em produção, bloquear se não está na lista
        callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 horas para cache de preflight
}));

// Rota de health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        message: 'CMS News API - Servidor funcionando',
        timestamp: new Date().toISOString()
    });
});

// Rotas da API
app.use('/api', loginRoutes);
app.use('/api', usuariosRoutes);
app.use('/api', postsRoutes);
app.use('/api', sitesRoutes);
app.use('/api', tagsRoutes);
app.use('/api', pautasRoutes);
app.use('/api', fontesRoutes);

// Servir arquivos estáticos (se existirem uploads locais antigos)
app.use('/uploads', express.static('uploads'));

// Rota 404 - deve vir antes do error handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        path: req.path
    });
});

// Middleware de tratamento de erros global (deve ser o último)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Frontend permitido: ${process.env.FRONTEND_URL || 'Todos (*)'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api\n`);    

    console.log('🔍 DEBUG - Variáveis de Ambiente:');
        console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'CONFIGURADO ✅' : 'NÃO CONFIGURADO ❌');
        console.log('AWS_REGION:', process.env.AWS_REGION);
        console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
        console.log('PORT:', process.env.PORT);
        console.log('----------------------------\n');
});