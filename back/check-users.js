import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        console.log('🔍 Verificando usuários no banco de dados...\n');
        
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
            }
        });

        if (users.length === 0) {
            console.log('❌ Nenhum usuário encontrado no banco de dados!\n');
            console.log('💡 Criando usuário admin de teste...\n');
            
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const newUser = await prisma.user.create({
                data: {
                    name: 'Administrador',
                    email: 'admin@cms.ecwd.cloud',
                    password: hashedPassword
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true
                }
            });

            console.log('✅ Usuário admin criado com sucesso!');
            console.log('📧 Email: admin@cms.ecwd.cloud');
            console.log('🔑 Senha: admin123');
            console.log('\n⚠️  IMPORTANTE: Mude esta senha em produção!\n');
            console.log('Dados do usuário:', newUser);
        } else {
            console.log(`✅ ${users.length} usuário(s) encontrado(s):\n`);
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name} (${user.email})`);
                console.log(`   ID: ${user.id}`);
                console.log(`   Criado em: ${user.createdAt}\n`);
            });
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
        if (error.code === 'P2021') {
            console.log('\n💡 A tabela "users" não existe no banco de dados.');
            console.log('Execute: npx prisma migrate deploy\n');
        }
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();

