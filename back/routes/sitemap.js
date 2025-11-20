import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * Gera sitemap.xml multilíngue
 * Inclui URLs de posts em todos os idiomas com tags xhtml:link alternates
 */
router.get('/sitemap.xml', async (req, res, next) => {
    try {
        const baseUrl = 'https://weloverave.club';
        const languages = ['pt', 'en', 'es'];

        // Buscar todos os posts publicados
        const posts = await prisma.post.findMany({
            where: {
                status: 'PUBLICADO',
            },
            include: {
                translations: true,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        // Construir XML do sitemap
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

        // Adicionar home pages de cada idioma
        languages.forEach(lang => {
            xml += '  <url>\n';
            xml += `    <loc>${baseUrl}/${lang}</loc>\n`;
            xml += '    <changefreq>daily</changefreq>\n';
            xml += '    <priority>1.0</priority>\n';
            
            // Links alternativos
            languages.forEach(altLang => {
                xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${baseUrl}/${altLang}" />\n`;
            });
            
            xml += '  </url>\n';
        });

        // Adicionar posts
        posts.forEach(post => {
            const translations = post.translations;
            
            // Para cada tradução do post, criar uma URL
            translations.forEach(translation => {
                xml += '  <url>\n';
                xml += `    <loc>${baseUrl}${translation.urlAmigavel}</loc>\n`;
                xml += `    <lastmod>${post.updatedAt.toISOString()}</lastmod>\n`;
                xml += '    <changefreq>weekly</changefreq>\n';
                xml += '    <priority>0.8</priority>\n';
                
                // Links alternativos (hreflang) para outras traduções do mesmo post
                translations.forEach(altTranslation => {
                    xml += `    <xhtml:link rel="alternate" hreflang="${altTranslation.idioma}" href="${baseUrl}${altTranslation.urlAmigavel}" />\n`;
                });
                
                xml += '  </url>\n';
            });
        });

        xml += '</urlset>';

        // Configurar headers para XML
        res.header('Content-Type', 'application/xml');
        res.status(200).send(xml);
    } catch (error) {
        next(error);
    }
});

export default router;

