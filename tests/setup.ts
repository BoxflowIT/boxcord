// Test setup
import { vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

// Global test timeout
vi.setConfig({ testTimeout: 10000 });
