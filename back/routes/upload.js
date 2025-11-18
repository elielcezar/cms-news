import express from 'express';
import { uploadS3 } from '../config/s3.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Upload de imagens para o editor de texto (inline)
 * POST /api/upload
 */
router.post('/upload', authenticateToken, (req, res, next) => {
    uploadS3.array('imagens', 5)(req, res, (err) => {
        if (err) {
            console.error('❌ Erro no upload:', err);
            
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    error: 'Arquivo muito grande',
                    message: 'A imagem deve ter no máximo 5MB.'
                });
            }
            
            return res.status(500).json({
                error: 'Erro ao fazer upload',
                message: err.message
            });
        }

        try {
            console.log('📤 Upload de imagens inline');
            
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    error: 'Nenhuma imagem foi enviada'
                });
            }

            // Extrair URLs das imagens enviadas
            const urls = req.files.map(file => file.location);
            
            console.log(`✅ ${urls.length} imagem(ns) enviada(s) para S3`);
            console.log('URLs:', urls);

            res.status(200).json({
                message: 'Upload realizado com sucesso',
                urls: urls
            });
        } catch (error) {
            console.error('❌ Erro ao processar upload:', error);
            next(error);
        }
    });
});

export default router;

