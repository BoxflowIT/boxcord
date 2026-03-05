// Database client - Prisma instance
import { PrismaClient } from '@prisma/client';
import { logger } from '../../00-core/logger.js';
import { cacheService } from '../cache/redis.cache.js';

function getCacheKey(model: string, operation: string, args: unknown): string {
  return `prisma:${model}:${operation}:${JSON.stringify(args)}`;
}

const READ_OPERATIONS = new Set([
  'findUnique',
  'findFirst',
  'findMany',
  'count',
  'aggregate'
]);

const WRITE_OPERATIONS = new Set([
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany'
]);

// Models that must NEVER be cached — their data changes frequently and
// stale reads cause user-visible bugs (e.g. votes disappearing on refresh).
const NEVER_CACHE_MODELS = new Set(['Poll', 'PollOption', 'PollVote']);

// Models whose cache should also be invalidated when a related model changes
const RELATED_CACHE_INVALIDATION: Record<string, string[]> = {
  PollVote: ['Poll', 'PollOption'],
  PollOption: ['Poll']
};

async function invalidateCacheForModel(model: string): Promise<void> {
  // Remove all cache entries for the given model
  await cacheService.deletePattern(`prisma:${model}:*`);
  // Also invalidate related model caches
  const related = RELATED_CACHE_INVALIDATION[model];
  if (related) {
    await Promise.all(
      related.map((m) => cacheService.deletePattern(`prisma:${m}:*`))
    );
  }
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

        // Never cache poll-related models — always hit the database
        if (NEVER_CACHE_MODELS.has(model)) {
          return query(args);
        }

        // Cache read operations
        if (READ_OPERATIONS.has(operation)) {
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
                logger.warn(
                  { model, operation, duration },
                  `Slow query: ${model}.${operation} took ${duration}ms`
                );
              }

              return data;
            } catch (error) {
              logger.error(
                { model, operation, error },
                `Query error in ${model}.${operation}`
              );
              throw error;
            }
          })();
        }

        // Write operations: execute then invalidate cache
        if (WRITE_OPERATIONS.has(operation)) {
          return (async () => {
            const start = Date.now();
            try {
              const result = await query(args);
              const duration = Date.now() - start;

              // Invalidate cache for this model and related models
              await invalidateCacheForModel(model);

              if (duration > 1000) {
                logger.warn(
                  { model, operation, duration },
                  `Slow query: ${model}.${operation} took ${duration}ms`
                );
              }

              return result;
            } catch (error) {
              logger.error(
                { model, operation, error },
                `Query error in ${model}.${operation}`
              );
              throw error;
            }
          })();
        }

        // Fallback for any other operations
        return query(args);
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
  logger.info('✅ Database connected');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  // Clear cache on disconnect
  await cacheService.clear();
  logger.info('Database disconnected');
}

// Export cache utilities for testing/debugging
export async function clearQueryCache(): Promise<void> {
  await cacheService.clear();
}

export function getCacheStats(): { connected: boolean } {
  return { connected: cacheService.isConnected() };
}
