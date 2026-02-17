// Database client - Prisma instance
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL,
    // Optimized connection pooling for Railway
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // Performance optimizations
    errorFormat: 'minimal', // Smaller error payloads
    transactionOptions: {
      maxWait: 2000, // 2s max wait for transaction lock
      timeout: 5000 // 5s transaction timeout
    }
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  // eslint-disable-next-line no-console
  console.log('✅ Database connected');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  // eslint-disable-next-line no-console
  console.log('Database disconnected');
}
