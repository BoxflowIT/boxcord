// Database client - Prisma instance
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL,
    // Performance optimizations
    errorFormat: 'minimal', // Smaller error payloads
    transactionOptions: {
      maxWait: 2000, // 2s max wait for transaction lock
      timeout: 5000 // 5s transaction timeout
    }
  }).$extends({
    query: {
      $allOperations({ operation, model, args, query }) {
        // Add connection pool optimization
        const start = Date.now();
        const result = query(args);
        result.then(() => {
          const duration = Date.now() - start;
          if (duration > 1000) {
            console.warn(
              `Slow query detected: ${model}.${operation} took ${duration}ms`
            );
          }
        });
        return result;
      }
    }
  });
};

export type ExtendedPrismaClient = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

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
