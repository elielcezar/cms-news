import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de migração para converter posts existentes para o sistema multilíngue
 * 
 * Este script:
 * 1. Busca todos os posts existentes
 * 2. Cria uma tradução PT para cada post (migrando dados existentes)
 * 3. Atualiza slugs para incluir prefixo /pt/
 */

async function migrateExistingPosts() {
  console.log('🔄 Iniciando migração de posts existentes para sistema multilíngue...\n');

  try {
    // Buscar todos os posts
    const posts = await prisma.$queryRaw`
      SELECT id, titulo, chamada, conteudo, urlAmigavel 
      FROM posts
    `;

    if (!posts || posts.length === 0) {
      console.log('✅ Nenhum post existente para migrar.');
      return;
    }

    console.log(`📊 Encontrados ${posts.length} posts para migrar.\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const post of posts) {
      try {
        // Gerar nova URL com prefixo /pt/
        let newSlug = `pt/${post.urlAmigavel}`;
        
        // Verificar se já existe (improvável, mas por segurança)
        const existingTranslation = await prisma.$queryRaw`
          SELECT id FROM post_translations 
          WHERE urlAmigavel = ${newSlug}
        `;

        if (existingTranslation && existingTranslation.length > 0) {
          console.log(`⚠️  Post #${post.id}: Tradução PT já existe, pulando...`);
          continue;
        }

        // Criar tradução PT
        await prisma.$executeRaw`
          INSERT INTO post_translations (postId, idioma, titulo, chamada, conteudo, urlAmigavel, createdAt, updatedAt)
          VALUES (
            ${post.id},
            'pt',
            ${post.titulo},
            ${post.chamada},
            ${post.conteudo},
            ${newSlug},
            NOW(),
            NOW()
          )
        `;

        console.log(`✅ Post #${post.id}: "${post.titulo.substring(0, 50)}..." migrado com sucesso`);
        successCount++;

      } catch (error) {
        console.error(`❌ Erro ao migrar post #${post.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Resumo da Migração:');
    console.log(`   ✅ Sucesso: ${successCount} posts`);
    console.log(`   ❌ Erros: ${errorCount} posts`);
    console.log(`   📝 Total: ${posts.length} posts\n`);

    if (successCount > 0) {
      console.log('✅ Migração concluída com sucesso!');
    }

  } catch (error) {
    console.error('❌ Erro fatal durante migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateExistingPosts()
  .catch((error) => {
    console.error('❌ Erro ao executar script de migração:', error);
    process.exit(1);
  });

