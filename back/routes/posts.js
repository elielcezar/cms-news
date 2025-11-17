import express from 'express';
import prisma from '../config/prisma.js';
import { uploadS3 } from '../config/s3.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, postCreateSchema } from '../middleware/validation.js';
import { NotFoundError } from '../utils/errors.js';

const router = express.Router();

const baseUrl = 'https://cms.ecwd.cloud';

// Middleware para tratamento de erros do multer
const handleMulterError = (upload) => {
    return (req, res, next) => {
        upload(req, res, (err) => {
            if (err) {
                console.error('❌ Erro no upload de arquivos:', err.message);
                console.error('Stack:', err.stack);
                console.error('Detalhes do erro:', {
                    code: err.code,
                    field: err.field,
                    name: err.name
                });
                
                if (err.code === 'LIMIT_FILE_SIZE') {
                    const maxSizeMB = 10;
                    const fileName = err.field ? `O arquivo "${err.field}"` : 'Um arquivo';
                    return res.status(400).json({
                        error: 'Arquivo muito grande',
                        message: `${fileName} excede o limite de ${maxSizeMB}MB. Por favor, comprima a imagem antes de enviar.`
                    });
                }
                
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({
                        error: 'Muitos arquivos',
                        message: 'O número máximo de arquivos é 18'
                    });
                }
                
                if (err.message && err.message.includes('Tipo de arquivo inválido')) {
                    return res.status(400).json({
                        error: 'Tipo de arquivo inválido',
                        message: err.message
                    });
                }
                
                // Erros do S3/AWS - capturar qualquer erro relacionado ao S3
                const isS3Error = err.name === 'S3Client' || 
                                 err.$metadata || 
                                 err.Code || 
                                 err.code === 'CredentialsError' || 
                                 err.name === 'NoCredentialsError' ||
                                 err.name === 'AccessDenied' ||
                                 err.code === 'AccessDenied' ||
                                 err.message?.includes('S3') ||
                                 err.message?.includes('AWS') ||
                                 err.message?.includes('bucket') ||
                                 err.stack?.includes('s3') ||
                                 err.stack?.includes('S3');
                
                if (isS3Error) {
                    console.error('❌ Erro no S3/AWS:', err);
                    console.error('   Tipo:', err.name || err.constructor?.name);
                    console.error('   Código:', err.code || err.Code);
                    console.error('   Mensagem:', err.message);
                    console.error('   Stack completo:', err.stack);
                    if (err.$metadata) {
                        console.error('   Metadata:', JSON.stringify(err.$metadata, null, 2));
                    }
                    
                    let errorMessage = 'Erro ao fazer upload para S3';
                    let statusCode = 500;
                    
                    if (err.name === 'NoCredentialsError' || err.code === 'CredentialsError' || err.message?.includes('credentials')) {
                        errorMessage = 'Credenciais AWS não configuradas ou inválidas. Verifique as variáveis AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY no servidor.';
                        statusCode = 500;
                    } else if (err.Code === 'NoSuchBucket' || err.message?.includes('bucket') || err.message?.includes('does not exist')) {
                        errorMessage = `Bucket S3 não encontrado. Verifique se o bucket "${process.env.AWS_S3_BUCKET}" existe na região ${process.env.AWS_REGION}.`;
                        statusCode = 500;
                    } else if (err.Code === 'AccessDenied' || err.name === 'AccessDenied' || err.message?.includes('Access Denied') || err.message?.includes('not authorized')) {
                        errorMessage = 'Acesso negado ao S3. O usuário IAM não tem permissão s3:PutObject. Verifique as permissões IAM.';
                        statusCode = 403;
                    } else if (err.message?.includes('region') || err.message?.includes('Região')) {
                        errorMessage = `Erro de região AWS. Verifique se a região "${process.env.AWS_REGION}" está correta.`;
                        statusCode = 500;
                    } else if (err.Code === 'AccessControlListNotSupported' || err.name === 'AccessControlListNotSupported' || err.message?.includes('does not allow ACLs')) {
                        errorMessage = 'O bucket S3 não permite ACLs. Remova a configuração ACL do código e use política de bucket para acesso público.';
                        statusCode = 400;
                    } else {
                        errorMessage = `Erro S3: ${err.message || 'Erro desconhecido'}`;
                    }
                    
                    return res.status(statusCode).json({
                        error: 'Erro ao fazer upload para S3',
                        message: errorMessage,
                        details: {
                            type: err.name || err.constructor?.name,
                            code: err.code || err.Code || 'N/A'
                        }
                    });
                }
                
                return res.status(500).json({
                    error: 'Erro ao processar upload',
                    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro ao fazer upload de imagens'
                });
            }
            next();
        });
    };
};

// Criar post (protegido)
router.post('/posts', authenticateToken, handleMulterError(uploadS3.array('imagens', 18)), async (req, res, next) => {
    try {
        console.log('📥 Recebendo requisição POST /posts');
        console.log('📦 Files recebidos:', req.files ? req.files.length : 0);
        console.log('📋 Headers:', {
            'content-type': req.headers['content-type'],
            'content-length': req.headers['content-length']
        });
        
      const { 
        titulo, 
        chamada, 
        conteudo,
        urlAmigavel,
        status,
        destaque,
        dataPublicacao,
        sites,
        tags
      } = req.body;

        console.log('📝 Dados body recebidos:', {
            titulo, 
            chamada, 
            conteudo,
            urlAmigavel,
            status,
            destaque,
            dataPublicacao,
            categorias,
            tags
        });

        // URLs das imagens no S3
        const imagens = req.files ? req.files.map(file => {
            console.log('📸 Arquivo processado:', {
                originalname: file.originalname,
                location: file.location,
                size: file.size,
                mimetype: file.mimetype
            });
            return file.location;
        }) : [];

        console.log('🔗 URLs das imagens:', imagens);
        
        // Validações básicas
        if (!titulo || !chamada || !conteudo || !urlAmigavel) {
            return res.status(400).json({
                error: 'Campos obrigatórios faltando',
                message: 'Título, chamada, conteúdo e URL amigável são obrigatórios'
            });
        }
        
        console.log('💾 Criando post no banco de dados...');
        
      // Criar relacionamentos de sites e tags
      const sitesData = sites ? JSON.parse(sites).map(siteId => ({
        siteId: parseInt(siteId)
      })) : [];
      
      const tagsData = tags ? JSON.parse(tags).map(tagId => ({
        tagId: parseInt(tagId)
      })) : [];

      const response = await prisma.post.create({
        data: {
          titulo, 
          chamada, 
          conteudo,
          urlAmigavel,
          status: status || 'RASCUNHO',
          destaque: destaque === 'true' || destaque === true,
          dataPublicacao: dataPublicacao ? new Date(dataPublicacao) : null,
          imagens: imagens,
          sites: {
            create: sitesData
          },
          tags: {
            create: tagsData
          }
        },
        include: {
          sites: {
            include: {
              site: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          }
        }
      });
        
        console.log('✅ Post criado com sucesso:', response.id);
        res.status(201).json(response);
    } catch (error) {
        console.error('❌ Erro ao criar post:', error);
        console.error('Erro completo:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });
        next(error);
    }
})

// Listar posts (público)
router.get('/posts', async (req, res, next) => {
    try {
        console.log('Recebendo requisição GET /posts');
        console.log('Query params:', req.query);

        // Criar objeto de filtro apenas com parâmetros definidos
        const filtro = {};
        
        if (req.query.urlAmigavel) filtro.urlAmigavel = req.query.urlAmigavel;
        if (req.query.status) filtro.status = req.query.status;
        if (req.query.destaque) filtro.destaque = req.query.destaque === 'true';
        
        if (req.query.site) {
            filtro.sites = {
                some: {
                    site: {
                        nome: req.query.site
                    }
                }
            }
        }
        
        if (req.query.tag) {
            filtro.tags = {
                some: {
                    tag: {
                        nome: req.query.tag
                    }
                }
            }
        }

        const posts = await prisma.post.findMany({
            where: filtro,
            include: {
                sites: {
                    include: {
                        site: true
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                }
            },
            orderBy: {
                dataPublicacao: 'desc'
            }
        });
                
        const postsCompleto = posts.map(post => ({
            ...post,
            url: `${baseUrl}/posts/${post.urlAmigavel}`
        }));

        console.log(`Posts encontrados: ${postsCompleto.length}`);
        res.status(200).json(postsCompleto);
        
    } catch (error) {
        next(error);
    }
});

// Obter post pelo ID (público)
router.get('/posts/id/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const post = await prisma.post.findUnique({
            where: {
                id: parseInt(id)
            },
            include: {
                sites: {
                    include: {
                        site: true
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                }
            }
        });
        
        if (!post) {
            throw new NotFoundError('Post não encontrado');
        }
        
        res.json(post);
    } catch (error) {
        next(error);
    }
});


// Obter post pela URL amigável (público)
router.get('/posts/:urlAmigavel', async (req, res, next) => {
    try {
        console.log('Recebendo requisição GET /posts/:urlAmigavel');
        console.log('URL Amigável:', req.params.urlAmigavel);

        const { urlAmigavel } = req.params;
        const post = await prisma.post.findUnique({
            where: {
                urlAmigavel: urlAmigavel
            },
            include: {
                sites: {
                    include: {
                        site: true
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                }
            }
        });
        
        if (!post) {
            throw new NotFoundError('Post não encontrado');
        }
        
        res.json(post);
        console.log('Post encontrado:', post.titulo);
    } catch (error) {
        next(error);
    }
});

// Atualizar post (protegido)
router.put('/posts/:id', authenticateToken, handleMulterError(uploadS3.array('imagens', 18)), async (req, res, next) => {
    try {
        console.log('Recebendo requisição PUT /posts');

        const { id } = req.params;
        const {
            titulo,
            chamada,
            conteudo,
            urlAmigavel,
            status,
            destaque,
            dataPublicacao,
            sites,
            tags,
            oldImages
        } = req.body;

        // Verificar se post existe
        const postExistente = await prisma.post.findUnique({
            where: { id: parseInt(id) }
        });

        if (!postExistente) {
            throw new NotFoundError('Post não encontrado');
        }

        // Processar imagens
        let imagens = [];
        if (oldImages) {
            imagens = JSON.parse(oldImages); // Imagens antigas mantidas
        }
        if (req.files && req.files.length > 0) {
            const novasImagens = req.files.map(file => file.location); // URLs do S3
            imagens = [...imagens, ...novasImagens];
        }

        const data = {
            titulo,
            chamada,
            conteudo,
            urlAmigavel,
            status: status || postExistente.status,
            destaque: destaque === 'true' || destaque === true,
            dataPublicacao: dataPublicacao ? new Date(dataPublicacao) : postExistente.dataPublicacao,
            imagens
        };

        console.log('Atualizando post com dados:', data);

        const response = await prisma.post.update({
            where: { id: parseInt(id) },
            data: data,
            include: {
                sites: {
                    include: {
                        site: true
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                }
            }
        });

        // Atualizar sites
        if (sites) {
            await prisma.postSite.deleteMany({
                where: { postId: parseInt(id) }
            });
            
            const sitesArray = JSON.parse(sites);
            for (const siteId of sitesArray) {
                await prisma.postSite.create({
                    data: {
                        postId: parseInt(id),
                        siteId: parseInt(siteId)
                    }
                });
            }
        }

        // Atualizar tags
        if (tags) {
            await prisma.postTag.deleteMany({
                where: { postId: parseInt(id) }
            });
            
            const tagsArray = JSON.parse(tags);
            for (const tagId of tagsArray) {
                await prisma.postTag.create({
                    data: {
                        postId: parseInt(id),
                        tagId: parseInt(tagId)
                    }
                });
            }
        }

        console.log('Post atualizado com sucesso');
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});

// Deletar post (protegido)
router.delete('/posts/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;

        const post = await prisma.post.findUnique({
            where: { id: parseInt(id) }
        });

        if (!post) {
            throw new NotFoundError('Post não encontrado');
        }

        await prisma.post.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({ message: 'Post deletado com sucesso' });
    } catch (error) {
        next(error);
    }
});

export default router;

