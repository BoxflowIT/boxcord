# Testing Guide

This document describes how to run various tests for the Boxcord application.

## Test Types

### 1. Unit Tests
Tests individual functions and services.

```bash
# Run all unit tests
yarn test

# Run with coverage
yarn test:coverage

# Run in watch mode
yarn test:watch
```

**Current Status:** ✅ 61/61 passing  
**Coverage:** Backend services, store, hooks

### 2. E2E Tests (Playwright)
End-to-end tests that simulate real user interactions.

```bash
# Run E2E tests (headless)
yarn test:e2e

# Run E2E tests with UI
yarn test:e2e:ui

# Run E2E tests in debug mode
yarn test:e2e --debug
```

**Prerequisites:**
- Backend running on `http://localhost:3001`
- Frontend running on `http://localhost:5173`
- Test database with seed data

**Test Coverage:**
- ✅ Health checks (backend & frontend)
- ✅ API documentation (Swagger)
- ✅ Authentication flow
- ✅ Workspace navigation
- ✅ Messaging functionality
- ✅ Search interface
- ✅ User settings
- ✅ XSS protection verification

**Test File:** [`tests/e2e/user-flows.spec.ts`](../tests/e2e/user-flows.spec.ts)

### 3. Load Tests (K6)
Performance tests that simulate concurrent users.

```bash
# Install K6 (first time)
sudo snap install k6

# Run load test
k6 run tests/load/api-load-test.js

# Run with custom API URL
API_URL=http://production-server.com k6 run tests/load/api-load-test.js
```

**Test Scenarios:**
- 30% Health check monitoring (lightweight)
- 30% Read-heavy users (browsing)
- 30% Active users (mixed operations)
- 10% Power users (heavy load)

**Load Profile:**
1. Warm up: 50 users (30s)
2. Normal load: 100 users (3m)
3. High load: 200 users (1.5m)
4. Stress test: 500 users (1m)

**Latest Results** (Full 7-minute test, up to 500 concurrent users, **AFTER OPTIMIZATIONS**):
- ✅ **99.98% success rate** (64,705/64,712 checks passed)
- ✅ **0% HTTP error rate** (0 failed requests)
- ✅ **115 req/s** sustained throughput (+77% vs baseline)
- ✅ **p95: 17.76ms** (target: <500ms) - **TARGET ACHIEVED** 🎉
- ✅ **p99: 364.29ms** (target: <1s) - **TARGET ACHIEVED** 🎉
- ✅ **Health endpoint p95: 44.36ms** (target: <100ms) - **TARGET ACHIEVED** 🎉

**Performance Metrics:**
```
Optimized Test (500 peak users):
  http_req_duration: avg=16.8ms, p95=17.76ms, p99=364.29ms
  http_reqs: 48,482 total (~115 req/s)
  checks: 99.98% passed (64,705/64,712)
  iterations: 26,892 completed

Normal Load (100-200 users):
  http_req_duration: avg=~5ms, p95=~12ms
  checks: 99.9%+ passed
```

**Comparison - Before vs After Optimization:**
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| p95 | 5.75s | 17.76ms | **99.69% faster** |
| p99 | 6.03s | 364.29ms | **93.96% faster** |
| Average | 914ms | 16.8ms | **98.16% faster** |
| Health p95 | 5.84s | 44.36ms | **99.24% faster** |
| Throughput | 65 req/s | 115 req/s | **+77%** |
| Success | 98.68% | 99.98% | **+1.3%** |

**Conclusion:** System is production-ready for extreme load (500+ concurrent users) with all performance targets achieved. 

**📖 For optimization details, see:** [docs/PERFORMANCE_TUNNING.md](./PERFORMANCE_TUNNING.md)

**Test File:** [`tests/load/api-load-test.js`](../tests/load/api-load-test.js)

### 4. XSS Filtering Tests
Validates that XSS sanitization is working correctly.

```bash
# Run XSS filtering verification
node scripts/test-xss-filtering.cjs
```

**Test Coverage:**
- ✅ Script tag injection
- ✅ IMG tag with onerror
- ✅ Iframe tag injection
- ✅ Safe HTML preservation (bold, links)
- ✅ Nested object sanitization

**Results:** All 6 tests passing

## Development Workflow

### Pre-commit Hook
Automatically runs on `git commit`:
- Formats code with Prettier
- Lints with ESLint
- Only checks staged files

### Pre-push Hook
Automatically runs on `git push`:
- TypeScript type checking
- Full linting (backend + client)
- All unit tests
- Client E2E tests

## CI/CD Pipeline

The GitHub Actions workflow runs:
1. TypeScript compilation check
2. ESLint (backend + client)
3. Unit tests (all 61 tests)
4. Code coverage report

## Test Files Structure

```
tests/
├── e2e/
│   └── user-flows.spec.ts       # Playwright E2E tests
├── load/
│   └── api-load-test.js         # K6 load tests
├── services/                     # Backend unit tests
│   ├── chatbot.service.test.ts
│   ├── push.service.test.ts
│   ├── reaction.service.test.ts
│   ├── user.service.test.ts
│   ├── webhook.service.test.ts
│   └── workspace.service.test.ts
└── setup.ts                      # Test setup/mocks

client/tests/
├── components/                   # Frontend component tests
├── hooks/
├── services/
└── store/                        # State management tests
```

## Performance Targets

### Response Time Targets
- Health checks: p95 < 100ms
- API endpoints: p95 < 500ms
- API endpoints: p99 < 1000ms

### Reliability Targets
- Uptime: 99.9%
- Error rate: < 1%
- Success rate: > 99%

### Load Targets
- Concurrent users: 500+
- Requests/second: 100+
- Sustained load: 100 users for 10+ minutes

## Current Status Summary

| Test Type | Status | Coverage | Notes |
|-----------|--------|----------|-------|
| Unit Tests | ✅ Passing | 61 tests | Backend services |
| E2E Tests | ✅ Ready | 12 scenarios | Playwright configured |
| Load Tests | ✅ **OPTIMIZED** | 4 scenarios | All targets achieved (500+ users) |
| XSS Tests | ✅ Passing | 6 payloads | Sanitization active |
| Code Coverage | ✅ Configured | 70% threshold | Using v8 |

## Next Steps

1. **Test Coverage**
   - [ ] Write more E2E test scenarios
   - [ ] Add authenticated E2E flows (requires test user)
   - [ ] Test file upload/download flows
   - [ ] Test WebSocket real-time features

2. **Load Testing**
   - [x] ~~Optimize for extreme load (500+ users)~~ ✅ COMPLETED
   - [ ] Run load tests on staging environment
   - [ ] Test with production-like data volumes
   - [ ] Test WebSocket concurrent connections
   - [ ] Stress test with 1000+ concurrent users

3. **Monitoring**
   - [ ] Set up performance monitoring in production
   - [ ] Configure CloudWatch/Grafana dashboards
   - [ ] Set up alerting for performance degradation
   - [ ] Track real user metrics (RUM)

4. **Further Optimizations** (Optional)
   - [ ] Implement Redis caching layer (already partially done)
   - [ ] Add database read replicas
   - [ ] Message queue for background jobs
   - [ ] CDN for static assets
   - [ ] Query optimization and indexing

## Troubleshooting

### Tests Fail Locally
```bash
# Clear caches and reinstall
rm -rf node_modules client/node_modules
yarn install
cd client && yarn install

# Reset test database
yarn prisma migrate reset --force
yarn prisma db seed
```

### E2E Tests Can't Connect
```bash
# Ensure both servers are running
yarn dev        # Terminal 1 (backend on :3001)
cd client && yarn dev  # Terminal 2 (frontend on :5173)

# Then run E2E tests
yarn test:e2e   # Terminal 3
```

### Load Tests Show High Error Rate
- Check server is running and healthy
- Verify database connections available
- Check Redis connection pool size
- Monitor system resources (CPU, memory)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [K6 Documentation](https://k6.io/docs/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
