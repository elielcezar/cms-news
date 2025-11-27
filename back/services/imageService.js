import https from 'https';
import http from 'http';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../config/s3.js';
import { getPlaceholderImageUrl } from '../utils/imagePlaceholder.js';

const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Extrai a URL da imagem og:image de um HTML
 * @param {string} html - HTML da página
 * @param {string} baseUrl - URL base para resolver URLs relativas
 * @returns {string|null} - URL da imagem ou null se não encontrada
 */
export function extractOgImage(html, baseUrl) {
  try {
    // Buscar og:image em diferentes formatos
    const patterns = [
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i,
      /<meta\s+name=["']og:image["']\s+content=["']([^"']+)["']/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const imageUrl = match[1].trim();
        return resolveUrl(imageUrl, baseUrl);
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Erro ao extrair og:image:', error.message);
    return null;
  }
}

/**
 * Extrai a primeira imagem do markdown
 * @param {string} markdown - Conteúdo em markdown
 * @param {string} baseUrl - URL base para resolver URLs relativas
 * @returns {string|null} - URL da primeira imagem ou null se não encontrada
 */
export function extractImageFromMarkdown(markdown, baseUrl) {
  try {
    // Padrões para imagens em markdown: ![alt](url) ou ![alt](url "title")
    const patterns = [
      /!\[([^\]]*)\]\(([^)]+)\)/g, // ![alt](url)
      /<img[^>]+src=["']([^"']+)["']/gi, // <img src="url">
    ];

    for (const pattern of patterns) {
      const matches = [...markdown.matchAll(pattern)];
      if (matches.length > 0) {
        // Pegar primeira imagem encontrada
        const imageUrl = matches[0][2] || matches[0][1]; // Segundo grupo para markdown, primeiro para HTML
        if (imageUrl) {
          return resolveUrl(imageUrl.trim(), baseUrl);
        }
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Erro ao extrair imagem do markdown:', error.message);
    return null;
  }
}

/**
 * Resolve URL relativa para absoluta
 * @param {string} url - URL (pode ser relativa ou absoluta)
 * @param {string} baseUrl - URL base
 * @returns {string} - URL absoluta
 */
function resolveUrl(url, baseUrl) {
  if (!url) return null;
  
  // Se já é absoluta, retornar como está
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Se começa com //, adicionar protocolo
  if (url.startsWith('//')) {
    try {
      const base = new URL(baseUrl);
      return `${base.protocol}${url}`;
    } catch {
      return `https:${url}`;
    }
  }

  // Resolver URL relativa
  try {
    return new URL(url, baseUrl).href;
  } catch {
    // Se falhar, tentar concatenar simplesmente
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  }
}

/**
 * Faz download de uma imagem da URL
 * @param {string} imageUrl - URL da imagem
 * @returns {Promise<{buffer: Buffer, contentType: string, size: number}>} - Buffer da imagem e metadados
 */
export function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Fazendo download da imagem: ${imageUrl}`);

    const protocol = imageUrl.startsWith('https') ? https : http;

    const request = protocol.get(imageUrl, (res) => {
      // Verificar status code
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: Não foi possível baixar a imagem`));
      }

      // Verificar Content-Type
      const contentType = res.headers['content-type'] || '';
      if (!ALLOWED_MIME_TYPES.some(type => contentType.includes(type))) {
        return reject(new Error(`Tipo de arquivo não permitido: ${contentType}`));
      }

      // Verificar Content-Length
      const contentLength = parseInt(res.headers['content-length'] || '0');
      if (contentLength > MAX_IMAGE_SIZE) {
        return reject(new Error(`Imagem muito grande: ${(contentLength / 1024 / 1024).toFixed(2)}MB`));
      }

      // Baixar imagem
      const chunks = [];
      let totalSize = 0;

      res.on('data', (chunk) => {
        chunks.push(chunk);
        totalSize += chunk.length;

        // Verificar tamanho durante o download
        if (totalSize > MAX_IMAGE_SIZE) {
          request.destroy();
          return reject(new Error(`Imagem muito grande: ${(totalSize / 1024 / 1024).toFixed(2)}MB`));
        }
      });

      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`✅ Imagem baixada: ${(buffer.length / 1024).toFixed(2)}KB, tipo: ${contentType}`);
        resolve({
          buffer,
          contentType,
          size: buffer.length
        });
      });
    });

    request.on('error', (error) => {
      console.error('❌ Erro ao baixar imagem:', error.message);
      reject(error);
    });

    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Timeout ao baixar imagem (30s)'));
    });
  });
}

/**
 * Faz upload de uma imagem para o S3
 * @param {Buffer} buffer - Buffer da imagem
 * @param {string} contentType - Content-Type da imagem
 * @returns {Promise<string>} - URL pública da imagem no S3
 */
export async function uploadImageToS3(buffer, contentType) {
  try {
    if (!AWS_S3_BUCKET) {
      throw new Error('AWS_S3_BUCKET não configurado');
    }

    // Gerar nome único do arquivo
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const ext = getExtensionFromContentType(contentType);
    const key = `posts/auto-${timestamp}-${random}${ext}`;

    console.log(`📤 Fazendo upload para S3: ${key}`);

    // Upload para S3
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Não usar ACL - bucket deve ter política pública
    });

    await s3Client.send(command);

    // Construir URL pública
    const region = process.env.AWS_REGION || 'us-east-1';
    const url = `https://${AWS_S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;

    console.log(`✅ Imagem enviada para S3: ${url}`);
    return url;
  } catch (error) {
    console.error('❌ Erro ao fazer upload para S3:', error.message);
    throw error;
  }
}

/**
 * Obtém extensão do arquivo baseado no Content-Type
 * @param {string} contentType - Content-Type
 * @returns {string} - Extensão do arquivo (ex: .jpg)
 */
function getExtensionFromContentType(contentType) {
  const mimeToExt = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };

  return mimeToExt[contentType] || '.jpg';
}

/**
 * Busca HTML de uma URL
 * @param {string} url - URL para buscar
 * @returns {Promise<string>} - HTML da página
 */
async function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      let html = '';
      res.on('data', (chunk) => {
        html += chunk;
        // Limitar tamanho do HTML (máximo 1MB)
        if (html.length > 1024 * 1024) {
          request.destroy();
          return reject(new Error('HTML muito grande'));
        }
      });

      res.on('end', () => {
        resolve(html);
      });
    });

    request.on('error', reject);
    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error('Timeout ao buscar HTML (15s)'));
    });
  });
}

/**
 * Extrai imagem de uma fonte usando estratégia híbrida
 * @param {string} url - URL da fonte
 * @param {string} markdown - Conteúdo markdown do Jina (opcional)
 * @returns {Promise<string|null>} - URL da imagem encontrada ou null
 */
export async function extractImageFromSource(url, markdown = null) {
  try {
    console.log(`🖼️  Tentando extrair imagem de: ${url}`);

    // Estratégia 1: Tentar og:image
    try {
      console.log('   📋 Tentando extrair og:image...');
      const html = await fetchHtml(url);
      const ogImage = extractOgImage(html, url);
      
      if (ogImage) {
        console.log(`   ✅ og:image encontrado: ${ogImage}`);
        return ogImage;
      }
      console.log('   ⚠️  og:image não encontrado');
    } catch (error) {
      console.warn(`   ⚠️  Erro ao buscar og:image: ${error.message}`);
    }

    // Estratégia 2: Tentar markdown (se fornecido)
    if (markdown) {
      try {
        console.log('   📋 Tentando extrair imagem do markdown...');
        const markdownImage = extractImageFromMarkdown(markdown, url);
        
        if (markdownImage) {
          console.log(`   ✅ Imagem encontrada no markdown: ${markdownImage}`);
          return markdownImage;
        }
        console.log('   ⚠️  Nenhuma imagem encontrada no markdown');
      } catch (error) {
        console.warn(`   ⚠️  Erro ao processar markdown: ${error.message}`);
      }
    }

    console.log('   ❌ Nenhuma imagem encontrada');
    return null;
  } catch (error) {
    console.error(`❌ Erro ao extrair imagem de ${url}:`, error.message);
    return null;
  }
}

/**
 * Processa imagem completa: extrai, baixa e faz upload
 * @param {string} url - URL da fonte
 * @param {string} markdown - Conteúdo markdown do Jina (opcional)
 * @returns {Promise<string>} - URL da imagem no S3 ou URL do placeholder
 */
export async function processImageFromSource(url, markdown = null) {
  try {
    // Extrair URL da imagem
    const imageUrl = await extractImageFromSource(url, markdown);
    
    if (!imageUrl) {
      console.log('📷 Nenhuma imagem encontrada, usando placeholder');
      return getPlaceholderImageUrl();
    }

    // Download da imagem
    const { buffer, contentType } = await downloadImage(imageUrl);

    // Upload para S3
    const s3Url = await uploadImageToS3(buffer, contentType);

    return s3Url;
  } catch (error) {
    console.error('❌ Erro ao processar imagem:', error.message);
    console.log('📷 Usando placeholder devido ao erro');
    return getPlaceholderImageUrl();
  }
}

