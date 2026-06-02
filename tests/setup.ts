// Test setup
import { vi } from 'vitest';

// Mock environment variables (must include all required by config schema)
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
process.env.JWT_SECRET = 'test-secret-key-minimum-20-chars';
process.env.COGNITO_USER_POOL_ID = 'eu-north-1_TestPool';
process.env.COGNITO_CLIENT_ID = 'test-client-id';
process.env.BOXTIME_API_URL = 'http://localhost:4000';
process.env.VAPID_PUBLIC_KEY = 'test-public-key';
process.env.VAPID_PRIVATE_KEY = 'test-private-key';
process.env.VAPID_SUBJECT = 'mailto:test@example.com';

// Global test timeout
vi.setConfig({ testTimeout: 10000 });
