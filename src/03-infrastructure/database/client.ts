// Database client - Prisma instance
import { PrismaClient } from '@prisma/client';
import { cacheService } from '../cache/redis.cache.js';

function getCacheKey(model: string, operation: string, args: any): string {
  return `prisma:${model}:${operation}:${JSON.stringify(args)}`;
}

function shouldCache(operation: string): boolean {
  // Only cache read operations
  return ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'].includes(operation);
}

async function invalidateCacheForModel(model: string): Promise<void> {
  // Remove all cache entries for the given model
  await cacheService.deletePattern(`prisma:${model}:*`);
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL,
    // Performance optimizations
    errorFormat: 'minimal', // Smaller error payloads
    transactionOptions: {
      maxWait: 2000, // 2s max wait for transaction lock
      timeout: 5000, // 5s transaction timeout
      isolationLevel: 'ReadCommitted' // Balance between consistency and performance
    },
    // Connection pooling optimization
    omit: {
      user: {
        // Exclude sensitive fields by default
        updatedAt: true
      }
    }
  }).$extends({
    query: {
      $allOperations({ operation, model, args, query }) {
        // Skip caching if model is undefined
        if (!model) {
          return query(args);
        }

        // Query caching for read operations (async)
        if (shouldCache(operation)) {
          const cacheKey = getCacheKey(model, operation, args);
          
          return (async () => {
            // Check cache first
            const cached = await cacheService.get(cacheKey);
            if (cached !== null) {
              return cached;
            }

            // Execute query if not cached
            const start = Date.now();
            try {
              const data = await query(args);
              const duration = Date.now() - start;
              
              // Cache successful result
              await cacheService.set(cacheKey, data);
              
              if (duration > 1000) {
                console.warn(
                  `⚠️  Slow query: ${model}.${operation} took ${duration}ms`
                );
              }
              
              return data;
            } catch (error) {
              console.error(`❌ Query error in ${model}.${operation}:`, error);
              throw error;
            }
          })();
        }

        // For non-cacheable operations, just monitor performance
        const start = Date.now();
        const result = query(args);
        
        result
          .then(() => {
            const duration = Date.now() - start;
            if (duration > 1000) {
              console.warn(
                `⚠️  Slow query: ${model}.${operation} took ${duration}ms`
              );
            }
          })
          .catch((error) => {
            console.error(`❌ Query error in ${model}.${operation}:`, error);
          });
        
        return result;
      },
      // Invalidate cache on write operations
      $allModels: {
        async create({ model, args, query }) {
          const result = await query(args);
          invalidateCacheForModel(model);
          return result;
        },
        async update({ model, args, query }) {
          const result = await query(args);
          invalidateCacheForModel(model);
          return result;
        },
        async delete({ model, args, query }) {
          const result = await query(args);
          invalidateCacheForModel(model);
          return result;
        },
        async upsert({ model, args, query }) {
          const result = await query(args);
          invalidateCacheForModel(model);
          return result;
        },
        async createMany({ model, args, query }) {
          const result = await query(args);
          invalidateCacheForModel(model);
          return result;
        },
        async updateMany({ model, args, query }) {
          const result = await query(args);
          invalidateCacheForModel(model);
          return result;
        },
        async deleteMany({ model, args, query }) {
          const result = await query(args);
          invalidateCacheForModel(model);
          return result;
        }
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
  // Clear cache on disconnect
  await cacheService.clear();
  // eslint-disable-next-line no-console
  console.log('Database disconnected');
}

// Export cache utilities for testing/debugging
export async function clearQueryCache(): Promise<void> {
  await cacheService.clear();
}

export function getCacheStats(): { connected: boolean } {
  return { connected: cacheService.isConnected() };
}
