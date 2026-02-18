import { z } from 'zod';

// Environment schema validation
const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('3001'),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT / Cognito
  COGNITO_USER_POOL_ID: z.string().min(1),
  COGNITO_CLIENT_ID: z.string().min(1),
  COGNITO_REGION: z.string().default('eu-north-1'),
  JWT_SECRET: z.string().min(20),

  // Boxtime Integration
  BOXTIME_API_URL: z.string().url(),

  // Optional: Redis
  REDIS_URL: z.string().url().optional(),
  PRISMA_QUERY_CACHE_TTL: z.string().optional(),

  // Optional: Sentry
  SENTRY_DSN: z.string().url().optional(),

  // Optional: Swagger
  SWAGGER_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // Push Notifications
  VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),
  VAPID_SUBJECT: z.string().email(),

  // AWS S3 (optional)
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  // SendGrid (optional)
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional()
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

// Export validated config
export const config = validateEnv();

// Helper to check if feature is enabled
export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';
export const isTest = config.NODE_ENV === 'test';

// Feature flags based on configuration
export const features = {
  redis: !!config.REDIS_URL,
  sentry: !!config.SENTRY_DSN,
  swagger: config.SWAGGER_ENABLED,
  s3: !!(config.AWS_S3_BUCKET && config.AWS_ACCESS_KEY_ID),
  email: !!config.SENDGRID_API_KEY
};
