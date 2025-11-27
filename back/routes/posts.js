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
        categorias,
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
        
      // Criar relacionamentos de categorias e tags
      const categoriasData = categorias ? JSON.parse(categorias).map(categoriaId => ({
        categoriaId: parseInt(categoriaId)
      })) : [];
      
      const tagsData = tags ? JSON.parse(tags).map(tagId => ({
        tagId: parseInt(tagId)
      })) : [];

      // Gerar URL amigável com prefixo pt/
      let urlFinal = urlAmigavel.startsWith('pt/') ? urlAmigavel : `pt/${urlAmigavel}`;
      
      // Verificar se já existe
      let contador = 1;
      let urlTemp = urlFinal;
      while (await prisma.postTranslation.findUnique({ where: { urlAmigavel: urlTemp } })) {
        const baseSlug = urlAmigavel.replace('pt/', '');
        urlTemp = `pt/${baseSlug}-${contador}`;
        contador++;
      }
      urlFinal = urlTemp;

      const response = await prisma.post.create({
        data: {
          status: status || 'RASCUNHO',
          destaque: destaque === 'true' || destaque === true,
          dataPublicacao: dataPublicacao ? new Date(dataPublicacao) : null,
          imagens: imagens,
          idiomaDefault: 'pt',
          categorias: {
            create: categoriasData
          },
          tags: {
            create: tagsData
          },
          translations: {
            create: {
              idioma: 'pt',
              titulo,
              chamada,
              conteudo,
              urlAmigavel: urlFinal
            }
          }
        },
        include: {
          categorias: {
            include: {
              categoria: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          },
          translations: true
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

// Listar posts para admin (protegido - retorna todos os posts)
router.get('/admin/posts', authenticateToken, async (req, res, next) => {
    try {
        console.log('Recebendo requisição GET /admin/posts (ADMIN)');
        console.log('Query params:', req.query);

        // Idioma solicitado (default: pt)
        const lang = req.query.lang || 'pt';

        // Criar objeto de filtro (SEM filtro de status - retorna todos)
        const filtro = {};
        
        // Filtro por status (opcional para admin)
        if (req.query.status) {
            filtro.status = req.query.status;
        }
        
        // Filtro por destaque/featured
        const destaqueValue = req.query.featured || req.query.destaque;
        if (destaqueValue) filtro.destaque = destaqueValue === 'true';
        
        // Filtro por categoria
        const categoriaValue = req.query.category || req.query.categoria;
        if (categoriaValue) {
            const categoriaId = parseInt(categoriaValue);
            if (!isNaN(categoriaId)) {
                filtro.categorias = {
                    some: {
                        categoriaId: categoriaId
                    }
                };
            } else {
                filtro.categorias = {
                    some: {
                        categoria: {
                            translations: {
                                some: {
                                    nome: categoriaValue,
                                    idioma: lang
                                }
                            }
                        }
                    }
                };
            }
        }
        
        // Filtro por tag
        if (req.query.tag) {
            const tagId = parseInt(req.query.tag);
            if (!isNaN(tagId)) {
                filtro.tags = {
                    some: {
                        tagId: tagId
                    }
                };
            } else {
                filtro.tags = {
                    some: {
                        tag: {
                            nome: req.query.tag
                        }
                    }
                };
            }
        }

        const posts = await prisma.post.findMany({
            where: filtro,
            include: {
                categorias: {
                    include: {
                        categoria: {
                            include: {
                                translations: {
                                    where: { idioma: lang }
                                }
                            }
                        }
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                },
                translations: {
                    where: {
                        idioma: lang
                    }
                }
            },
            orderBy: {
                createdAt: 'desc' // Ordenar por data de criação (mais recentes primeiro)
            }
        });

        // Transformar posts para incluir dados da tradução no nível raiz
        const postsCompleto = posts.map(post => {
            const translation = post.translations[0]; // Pega a tradução do idioma solicitado
            
            // Para admin, retornar mesmo sem tradução (mas marcar)
            if (!translation) {
                console.warn(`⚠️  Post #${post.id} não tem tradução em ${lang}`);
                return {
                    id: post.id,
                    titulo: `[Sem tradução em ${lang}]`,
                    chamada: '',
                    conteudo: '',
                    urlAmigavel: '',
                    imagens: post.imagens,
                    status: post.status,
                    destaque: post.destaque,
                    dataPublicacao: post.dataPublicacao,
                    idiomaDefault: post.idiomaDefault,
                    createdAt: post.createdAt,
                    updatedAt: post.updatedAt,
                    categorias: post.categorias.map(pc => ({
                        id: pc.categoria.id,
                        nome: pc.categoria.translations[0]?.nome || 'Sem tradução'
                    })),
                    tags: post.tags.map(pt => ({
                        id: pt.tag.id,
                        nome: pt.tag.nome
                    })),
                    translationsAvailable: post.translations?.map(t => t.idioma) || []
                };
            }

            return {
                id: post.id,
                titulo: translation.titulo,
                chamada: translation.chamada,
                conteudo: translation.conteudo,
                urlAmigavel: translation.urlAmigavel,
                imagens: post.imagens,
                status: post.status,
                destaque: post.destaque,
                dataPublicacao: post.dataPublicacao,
                idiomaDefault: post.idiomaDefault,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                categorias: post.categorias.map(pc => ({
                    id: pc.categoria.id,
                    nome: pc.categoria.translations[0]?.nome || 'Sem tradução'
                })),
                tags: post.tags.map(pt => ({
                    id: pt.tag.id,
                    nome: pt.tag.nome
                })),
                translationsAvailable: post.translations?.map(t => t.idioma) || [lang]
            };
        });

        console.log(`✅ Posts encontrados (ADMIN): ${postsCompleto.length} (idioma: ${lang})`);
        res.status(200).json(postsCompleto);
        
    } catch (error) {
        next(error);
    }
});

// Listar posts (público)
router.get('/posts', async (req, res, next) => {
    try {
        console.log('Recebendo requisição GET /posts');
        console.log('Query params:', req.query);

        // Idioma solicitado (default: pt)
        const lang = req.query.lang || 'pt';

        // Criar objeto de filtro apenas com parâmetros definidos
        // IMPORTANTE: Endpoint público sempre retorna apenas posts PUBLICADOS
        const filtro = {
            status: 'PUBLICADO' // Sempre filtrar por status PUBLICADO
        };
        
        // Filtro por destaque/featured (aceita 'destaque' ou 'featured' para compatibilidade)
        const destaqueValue = req.query.featured || req.query.destaque;
        if (destaqueValue) filtro.destaque = destaqueValue === 'true';
        
        // Filtro por categoria (aceita 'category' ou 'categoria' para compatibilidade)
        const categoriaValue = req.query.category || req.query.categoria;
        if (categoriaValue) {
            const categoriaId = parseInt(categoriaValue);
            if (!isNaN(categoriaId)) {
                // Filtrar por ID da categoria
                filtro.categorias = {
                    some: {
                        categoriaId: categoriaId
                    }
                };
            } else {
                // Filtrar por nome da categoria
                filtro.categorias = {
                    some: {
                        categoria: {
                            translations: {
                                some: {
                                    nome: categoriaValue,
                                    idioma: lang
                                }
                            }
                        }
                    }
                };
            }
        }
        
        // Compatibilidade: aceitar 'site' também (legado)
        if (req.query.site && !categoriaValue) {
            filtro.categorias = {
                some: {
                    categoria: {
                        translations: {
                            some: {
                                nome: req.query.site,
                                idioma: lang
                            }
                        }
                    }
                }
            };
        }
        
        // Filtro por tag (nome ou ID)
        if (req.query.tag) {
            const tagId = parseInt(req.query.tag);
            if (!isNaN(tagId)) {
                // Filtrar por ID da tag
                filtro.tags = {
                    some: {
                        tagId: tagId
                    }
                };
            } else {
                // Filtrar por nome da tag
                filtro.tags = {
                    some: {
                        tag: {
                            nome: req.query.tag
                        }
                    }
                };
            }
        }

        const posts = await prisma.post.findMany({
            where: filtro,
            include: {
                categorias: {
                    include: {
                        categoria: {
                            include: {
                                translations: {
                                    where: { idioma: lang }
                                }
                            }
                        }
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                },
                translations: {
                    where: {
                        idioma: lang
                    }
                }
            },
            orderBy: {
                dataPublicacao: 'desc'
            }
        });

        // Transformar posts para incluir dados da tradução no nível raiz
        const postsCompleto = posts.map(post => {
            const translation = post.translations[0]; // Pega a tradução do idioma solicitado
            
            if (!translation) {
                console.warn(`⚠️  Post #${post.id} não tem tradução em ${lang}`);
                return null; // Ignora posts sem tradução no idioma solicitado
            }

            return {
                id: post.id,
                titulo: translation.titulo,
                chamada: translation.chamada,
                conteudo: translation.conteudo,
                urlAmigavel: translation.urlAmigavel,
                imagens: post.imagens,
                status: post.status,
                destaque: post.destaque,
                dataPublicacao: post.dataPublicacao,
                idiomaDefault: post.idiomaDefault,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                categorias: post.categorias.map(pc => ({
                    id: pc.categoria.id,
                    nome: pc.categoria.translations[0]?.nome || 'Sem tradução'
                })),
                tags: post.tags.map(pt => ({
                    id: pt.tag.id,
                    nome: pt.tag.nome
                })),
                url: `${baseUrl}/posts/${translation.urlAmigavel}`,
                // Manter referência às traduções disponíveis
                translationsAvailable: posts.find(p => p.id === post.id)?.translations?.map(t => t.idioma) || [lang]
            };
        }).filter(post => post !== null); // Remove posts sem tradução

        console.log(`Posts encontrados: ${postsCompleto.length} (idioma: ${lang})`);
        res.status(200).json(postsCompleto);
        
    } catch (error) {
        next(error);
    }
});

// Obter post pelo ID (público)
// Obter post por ID para admin (protegido - retorna todos os status)
router.get('/admin/posts/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const lang = req.query.lang || 'pt';

        console.log(`📥 Recebendo requisição GET /admin/posts/${id} (ADMIN)`);

        const post = await prisma.post.findFirst({
            where: {
                id: parseInt(id)
                // SEM filtro de status - retorna todos
            },
            include: {
                categorias: {
                    include: {
                        categoria: true
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                },
                translations: true // Incluir todas as traduções
            }
        });
        
        if (!post) {
            throw new NotFoundError('Post não encontrado');
        }

        // Encontrar tradução no idioma solicitado
        const translation = post.translations.find(t => t.idioma === lang);
        
        // Para admin, retornar mesmo sem tradução (mas com campos vazios)
        if (!translation) {
            console.warn(`⚠️ Post #${post.id} não tem tradução em ${lang}`);
            return res.json({
                id: post.id,
                titulo: '',
                chamada: '',
                conteudo: '',
                urlAmigavel: '',
                imagens: post.imagens || [],
                status: post.status,
                destaque: post.destaque,
                dataPublicacao: post.dataPublicacao,
                idiomaDefault: post.idiomaDefault,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                categorias: post.categorias || [],
                tags: post.tags || [],
                translations: post.translations.map(t => ({
                    idioma: t.idioma,
                    titulo: t.titulo,
                    urlAmigavel: t.urlAmigavel
                }))
            });
        }

        // Montar resposta com dados da tradução
        const postCompleto = {
            id: post.id,
            titulo: translation.titulo,
            chamada: translation.chamada,
            conteudo: translation.conteudo,
            urlAmigavel: translation.urlAmigavel,
            imagens: post.imagens || [],
            status: post.status,
            destaque: post.destaque,
            dataPublicacao: post.dataPublicacao,
            idiomaDefault: post.idiomaDefault,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            categorias: post.categorias || [],
            tags: post.tags || [],
            translations: post.translations.map(t => ({
                idioma: t.idioma,
                titulo: t.titulo,
                urlAmigavel: t.urlAmigavel
            }))
        };
        
        console.log(`✅ Post encontrado (ADMIN): ${postCompleto.titulo}`);
        res.json(postCompleto);
    } catch (error) {
        next(error);
    }
});

// Obter post por ID (público - apenas PUBLICADOS)
router.get('/posts/id/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const lang = req.query.lang || 'pt';

        const post = await prisma.post.findFirst({
            where: {
                id: parseInt(id),
                status: 'PUBLICADO' // Apenas posts publicados
            },
            include: {
                categorias: {
                    include: {
                        categoria: true
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                },
                translations: true // Incluir todas as traduções
            }
        });
        
        if (!post) {
            throw new NotFoundError('Post não encontrado');
        }

        // Encontrar tradução no idioma solicitado
        const translation = post.translations.find(t => t.idioma === lang);
        
        if (!translation) {
            return res.status(404).json({
                error: `Tradução não disponível em ${lang}`,
                availableLanguages: post.translations.map(t => t.idioma)
            });
        }

        // Montar resposta com dados da tradução
        const postCompleto = {
            id: post.id,
            titulo: translation.titulo,
            chamada: translation.chamada,
            conteudo: translation.conteudo,
            urlAmigavel: translation.urlAmigavel,
            imagens: post.imagens,
            status: post.status,
            destaque: post.destaque,
            dataPublicacao: post.dataPublicacao,
            idiomaDefault: post.idiomaDefault,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            categorias: post.categorias,
            tags: post.tags,
            translations: post.translations.map(t => ({
                idioma: t.idioma,
                titulo: t.titulo,
                urlAmigavel: t.urlAmigavel
            }))
        };
        
        res.json(postCompleto);
    } catch (error) {
        next(error);
    }
});


// Obter post pela URL amigável (público)
router.get('/posts/:lang/:slug', async (req, res, next) => {
    try {
        console.log('Recebendo requisição GET /posts/:lang/:slug');
        const { lang, slug } = req.params;
        const urlAmigavel = `${lang}/${slug}`;
        console.log('URL Amigável completa:', urlAmigavel);

        // Buscar tradução pela URL amigável
        const translation = await prisma.postTranslation.findUnique({
            where: {
                urlAmigavel: urlAmigavel
            },
            include: {
                post: {
                    include: {
                        categorias: {
                            include: {
                                categoria: true
                            }
                        },
                        tags: {
                            include: {
                                tag: true
                            }
                        },
                        translations: true
                    }
                }
            }
        });
        
        if (!translation) {
            throw new NotFoundError('Post não encontrado');
        }

        const post = translation.post;
        
        // Verificar se o post está publicado (endpoint público - apenas posts PUBLICADOS)
        if (post.status !== 'PUBLICADO') {
            throw new NotFoundError('Post não encontrado');
        }
        
        // Montar resposta
        const postCompleto = {
            id: post.id,
            titulo: translation.titulo,
            chamada: translation.chamada,
            conteudo: translation.conteudo,
            urlAmigavel: translation.urlAmigavel,
            imagens: post.imagens,
            status: post.status,
            destaque: post.destaque,
            dataPublicacao: post.dataPublicacao,
            idiomaDefault: post.idiomaDefault,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            categorias: post.categorias,
            tags: post.tags,
            translations: post.translations.map(t => ({
                idioma: t.idioma,
                titulo: t.titulo,
                urlAmigavel: t.urlAmigavel
            }))
        };
        
        res.json(postCompleto);
        console.log('Post encontrado:', translation.titulo);
    } catch (error) {
        next(error);
    }
});

// Atualizar post (protegido)
router.put('/posts/:id', authenticateToken, handleMulterError(uploadS3.array('imagens', 18)), async (req, res, next) => {
    try {
        console.log('Recebendo requisição PUT /posts');

        const { id } = req.params;
        const lang = req.query.lang || 'pt'; // Idioma da tradução a atualizar
        const {
            titulo,
            chamada,
            conteudo,
            urlAmigavel,
            status,
            destaque,
            dataPublicacao,
            categorias,
            tags,
            oldImages
        } = req.body;

        // Verificar se post existe
        const postExistente = await prisma.post.findUnique({
            where: { id: parseInt(id) },
            include: {
                translations: true
            }
        });

        if (!postExistente) {
            throw new NotFoundError('Post não encontrado');
        }

        // Processar imagens (armazenadas no post base)
        let imagens = postExistente.imagens || [];
        if (oldImages) {
            imagens = JSON.parse(oldImages);
        }
        if (req.files && req.files.length > 0) {
            const novasImagens = req.files.map(file => file.location);
            imagens = [...imagens, ...novasImagens];
        }

        // Atualizar dados do post base
        const dataPost = {
            status: status || postExistente.status,
            destaque: destaque === 'true' || destaque === true,
            dataPublicacao: dataPublicacao ? new Date(dataPublicacao) : postExistente.dataPublicacao,
            imagens
        };

        console.log(`Atualizando post #${id} e tradução ${lang}...`);

        // Atualizar post base
        await prisma.post.update({
            where: { id: parseInt(id) },
            data: dataPost
        });

        // Verificar se existe tradução no idioma solicitado
        const translationExistente = postExistente.translations.find(t => t.idioma === lang);

        if (titulo || chamada || conteudo || urlAmigavel) {
            if (translationExistente) {
                // Atualizar tradução existente
                const dataTranslation = {};
                if (titulo) dataTranslation.titulo = titulo;
                if (chamada) dataTranslation.chamada = chamada;
                if (conteudo) dataTranslation.conteudo = conteudo;
                if (urlAmigavel) {
                    // Garantir prefixo de idioma
                    const urlFinal = urlAmigavel.startsWith(`${lang}/`) ? urlAmigavel : `${lang}/${urlAmigavel}`;
                    dataTranslation.urlAmigavel = urlFinal;
                }

                await prisma.postTranslation.update({
                    where: { id: translationExistente.id },
                    data: dataTranslation
                });
            } else {
                // Criar nova tradução
                if (!titulo || !chamada || !conteudo || !urlAmigavel) {
                    return res.status(400).json({
                        error: 'Para criar nova tradução, todos os campos são obrigatórios: titulo, chamada, conteudo, urlAmigavel'
                    });
                }

                const urlFinal = urlAmigavel.startsWith(`${lang}/`) ? urlAmigavel : `${lang}/${urlAmigavel}`;

                await prisma.postTranslation.create({
                    data: {
                        postId: parseInt(id),
                        idioma: lang,
                        titulo,
                        chamada,
                        conteudo,
                        urlAmigavel: urlFinal
                    }
                });
            }
        }

        // Atualizar categorias
        if (categorias !== undefined && categorias !== null) {
            // Deletar categorias existentes
            await prisma.postCategoria.deleteMany({
                where: { postId: parseInt(id) }
            });
            
            // Adicionar novas categorias se houver
            let categoriasArray = [];
            if (typeof categorias === 'string') {
                try {
                    categoriasArray = JSON.parse(categorias);
                } catch (e) {
                    console.error('Erro ao fazer parse de categorias:', e);
                    categoriasArray = [];
                }
            } else if (Array.isArray(categorias)) {
                categoriasArray = categorias;
            }
            
            if (categoriasArray.length > 0) {
                for (const categoriaId of categoriasArray) {
                    try {
                        await prisma.postCategoria.create({
                            data: {
                                postId: parseInt(id),
                                categoriaId: parseInt(categoriaId)
                            }
                        });
                    } catch (error) {
                        console.error(`Erro ao criar relacionamento categoria ${categoriaId}:`, error);
                        // Continuar mesmo se uma categoria falhar
                    }
                }
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

        // Buscar post atualizado
        const response = await prisma.post.findUnique({
            where: { id: parseInt(id) },
            include: {
                categorias: {
                    include: {
                        categoria: true
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                },
                translations: true
            }
        });

        console.log('Post atualizado com sucesso');
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});

// Adicionar ou atualizar tradução de um post (protegido)
router.post('/posts/:id/translations', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { idioma, titulo, chamada, conteudo, urlAmigavel } = req.body;

        console.log(`📝 Adicionando/atualizando tradução ${idioma} para post #${id}`);

        // Validar campos obrigatórios
        if (!idioma || !titulo || !chamada || !conteudo || !urlAmigavel) {
            return res.status(400).json({
                error: 'Campos obrigatórios: idioma, titulo, chamada, conteudo, urlAmigavel'
            });
        }

        // Validar idioma
        if (!['pt', 'en', 'es'].includes(idioma)) {
            return res.status(400).json({
                error: 'Idioma inválido. Use: pt, en ou es'
            });
        }

        // Verificar se post existe
        const post = await prisma.post.findUnique({
            where: { id: parseInt(id) },
            include: { translations: true }
        });

        if (!post) {
            throw new NotFoundError('Post não encontrado');
        }

        // Garantir prefixo de idioma na URL
        const urlFinal = urlAmigavel.startsWith(`${idioma}/`) 
            ? urlAmigavel 
            : `${idioma}/${urlAmigavel}`;

        // Verificar se tradução já existe
        const translationExistente = post.translations.find(t => t.idioma === idioma);

        let translation;
        if (translationExistente) {
            // Atualizar existente
            translation = await prisma.postTranslation.update({
                where: { id: translationExistente.id },
                data: {
                    titulo,
                    chamada,
                    conteudo,
                    urlAmigavel: urlFinal
                }
            });
            console.log(`✅ Tradução ${idioma} atualizada`);
        } else {
            // Criar nova
            translation = await prisma.postTranslation.create({
                data: {
                    postId: parseInt(id),
                    idioma,
                    titulo,
                    chamada,
                    conteudo,
                    urlAmigavel: urlFinal
                }
            });
            console.log(`✅ Tradução ${idioma} criada`);
        }

        res.status(200).json({
            message: `Tradução ${idioma} ${translationExistente ? 'atualizada' : 'criada'} com sucesso`,
            translation
        });
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

