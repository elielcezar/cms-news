import { PrismaClient } from '@prisma/client';

// 🔍 DEBUG: Ver DATABASE_URL antes de criar o Prisma
console.log('🔍 Prisma Config - DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');


// Instância singleton do Prisma para evitar múltiplas conexões
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Em desenvolvimento, usa variável global para manter a instância durante hot-reload
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.prisma;
}

export default prisma;

