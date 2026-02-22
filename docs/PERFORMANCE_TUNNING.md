# High Load Performance Optimizations

This document describes the performance optimizations implemented to handle extreme load (500+ concurrent users).

## Problem Statement

Initial load testing revealed performance issues under extreme load:

**Before Optimizations:**
- p95 response time: 5.75s (target: <500ms)
- p99 response time: 6.03s (target: <1000ms)
- Health endpoint p95: 5.84s (target: <100ms)
- Average response time: 914ms
- Success rate: 98.68%

System was production-ready for normal traffic (100-200 users) but struggled with 500+ concurrent users.

## Root Causes Identified

### 1. Health Check Bottleneck
- Every request to `/health` performed database and Redis queries
- With 500 concurrent users, this meant 500+ simultaneous DB connections
- No caching, all checks executed in real-time

### 2. Database Connection Pool Limits
- Default Prisma connection pool: ~10 connections
- Insufficient for high concurrent load
- Requests queued waiting for available connections

### 3. Fastify Configuration
- Conservative connection timeout (10s)
- Suboptimal request handling settings
- No request ID tracking

## Optimizations Implemented

### 1. Health Check Caching ⚡

**File:** `src/apps/api/routes/health.routes.ts`

**Changes:**
- Added in-memory cache for health check results
- TTL: 5 seconds
- Separated lightweight `/health` (cached) from `/health/detailed` (uncached)

**Impact:**
```typescript
// Before: Every request = DB query + Redis check
// After: 
Request 1: 186ms (performs checks, caches result)
Request 2-N: 3-6ms (returns cached result)
= 98% faster for subsequent requests
```

**Code:**
```typescript
let cachedHealth: HealthStatus | null = null;
let cacheTimestamp = 0;
const HEALTH_CACHE_TTL = 5000; // 5 seconds

async function getCachedHealth(): Promise<HealthStatus> {
  const now = Date.now();
  
  if (cachedHealth && (now - cacheTimestamp) < HEALTH_CACHE_TTL) {
    return cachedHealth; // Return cached
  }

  cachedHealth = await performHealthChecks();
  cacheTimestamp = now;
  
  return cachedHealth;
}
```

**Benefits:**
- Reduces database load by ~99%
- Prevents connection pool exhaustion
- Health checks remain accurate (5s TTL)
- Load balancers get fast responses

### 2. Database Connection Pool Optimization 🗄️

**File:** `.env.example`

**Changes:**
```bash
# Before
DATABASE_URL="postgresql://user:pass@localhost:5433/db?schema=public"

# After
DATABASE_URL="postgresql://user:pass@localhost:5433/db?schema=public&connection_limit=20&pool_timeout=10&connect_timeout=5"
```

**Parameters:**
- `connection_limit=20`: Increased from default ~10 to 20
- `pool_timeout=10`: Max 10s wait for connection from pool
- `connect_timeout=5`: Max 5s for initial TCP connection

**Recommendations by Load:**
- Development: 10 connections (default)
- Low traffic (<100 concurrent): 10-15 connections
- Medium traffic (100-200 concurrent): 15-20 connections
- High traffic (200-500 concurrent): 20-30 connections
- Extreme traffic (500+ concurrent): 30-50 connections

**Important:** Don't set too high! Each connection consumes PostgreSQL resources. Monitor with:
```sql
SELECT count(*) FROM pg_stat_activity;
```

### 3. Fastify Server Optimization 🚀

**File:** `src/apps/api/index.ts`

**Changes:**
```typescript
const app = Fastify({
  // Connection settings
  connectionTimeout: 30000,     // 30s (was 10s)
  keepAliveTimeout: 72000,      // 72s (was 65s)
  requestTimeout: 30000,        // New: 30s max request
  
  // Payload limits
  bodyLimit: 50 * 1024 * 1024,  // 50MB (was 100MB)
  
  // Performance tuning
  disableRequestLogging: true,  // New: custom logging plugin
  trustProxy: true,             // New: trust load balancer headers
  ignoreTrailingSlash: true,    // New: /health = /health/
  caseSensitive: false,         // New: case-insensitive routing
  
  // Request tracking
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'requestId'
});
```

**Benefits:**
- Longer connection timeouts prevent premature disconnects
- Reduced bodyLimit saves memory
- Request ID tracking improves debugging
- Trust proxy enables proper client IP tracking behind load balancers

## Results After Optimization

**Test:** 7 minutes, 26,892 iterations, 48,482 HTTP requests, up to 500 concurrent users

### Response Times
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| p95 | 5.75s | 17.76ms | **99.69% faster** |
| p99 | 6.03s | 364.29ms | **93.96% faster** |
| Average | 914ms | 16.8ms | **98.16% faster** |
| Health p95 | 5.84s | 44.36ms | **99.24% faster** |

### Reliability
| Metric | Before | After |
|--------|--------|-------|
| Success Rate | 98.68% | **99.98%** |
| Failed Checks | 540/41,040 | **7/64,712** |
| HTTP Errors | 0% | **0%** |
| Throughput | 65 req/s | **115 req/s** (+77%) |

### Threshold Achievement
- ✅ **p95 < 500ms** - ACHIEVED (17.76ms)
- ✅ **p99 < 1000ms** - ACHIEVED (364.29ms)
- ✅ **Health p95 < 100ms** - ACHIEVED (44.36ms)
- ✅ **Error rate < 1%** - ACHIEVED (0%)

## Production Deployment Checklist

### 1. Update Environment Variables

```bash
# Production .env
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&connection_limit=30&pool_timeout=10&connect_timeout=5"
```

Adjust `connection_limit` based on Expected traffic:
- 100-200 concurrent users: `connection_limit=20`
- 200-500 concurrent users: `connection_limit=30`
- 500+ concurrent users: `connection_limit=40-50`

### 2. Database Server Sizing

Ensure PostgreSQL can handle the connections:
```sql
-- Check current max_connections
SHOW max_connections;

-- Recommended: Set to 2-3x your connection pool
ALTER SYSTEM SET max_connections = 100;
SELECT pg_reload_conf();
```

### 3. Monitoring

Monitor these metrics:
- Health check cache hit rate
- Database connection pool usage
- Response times (p50, p95, p99)
- Active database connections

**CloudWatch/Grafana Queries:**
```
# Health check latency
avg(http_request_duration_seconds{endpoint="/health"})

# Database connections
sum(pg_stat_activity_count)

# Cache effectiveness
rate(health_check_cache_hits) / rate(health_check_total_requests)
```

### 4. Load Balancer Configuration

Configure your load balancer health checks:
```yaml
# AWS ALB/NLB
health_check:
  path: /health
  interval: 30s
  timeout: 5s
  healthy_threshold: 2
  unhealthy_threshold: 3

# Nginx upstream health check
upstream backend {
  server api:3001 max_fails=3 fail_timeout=30s;
  check interval=3000 rise=2 fall=3 timeout=1000 type=http;
  check_http_send "GET /health HTTP/1.0\r\n\r\n";
  check_http_expect_alive http_2xx http_3xx;
}
```

### 5. Kubernetes/Container Settings

```yaml
# Resource limits
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "2000m"

# Probes
livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10
  
readinessProbe:
  httpGet:
    path: /ready
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Horizontal Scaling

With these optimizations, horizontal scaling is now effective:

**Single Instance Performance:**
- Handles 500 concurrent users
- 115 requests/second sustained
- p95 response time: 17.76ms

**Multi-Instance Scaling:**
- 2 instances: ~1000 concurrent users
- 3 instances: ~1500 concurrent users
- 5 instances: ~2500 concurrent users

**Load Balancing Strategy:**
- Use least-connections algorithm
- Enable sticky sessions for WebSocket
- Health check interval: 30s
- Unhealthy threshold: 3 consecutive failures

## Troubleshooting

### High Health Check Latency

**Symptoms:** Health endpoint still slow (>100ms p95)

**Fixes:**
1. Check cache is working:
```bash
# Should be fast (~5ms) except first request
for i in {1..5}; do
  curl -w "Time: %{time_total}s\n" -o /dev/null -s http://localhost:3001/health
done
```

2. Verify database connection pool:
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Should be less than connection_limit
```

### Connection Pool Exhausted

**Symptoms:** Errors like "Can't reach database server" or "Connection pool timeout"

**Fixes:**
1. Increase `connection_limit` in DATABASE_URL
2. Increase PostgreSQL `max_connections`
3. Add connection pooling (PgBouncer)
4. Scale horizontally (add more instances)

### Memory Issues

**Symptoms:** High memory usage, OOM kills

**Fixes:**
1. Reduce `bodyLimit` (currently 50MB)
2. Increase container memory limits
3. Check for memory leaks (heap snapshots)
4. Reduce `connection_limit` if too high

### Request Timeouts

**Symptoms:** 504 Gateway Timeout errors

**Fixes:**
1. Increase load balancer timeout (>30s)
2. Increase Fastify `requestTimeout`
3. Optimize slow database queries
4. Add query timeouts in Prisma

## Future Optimizations

Potential areas for further improvement:

1. **Redis Caching Layer**
   - Cache frequently accessed data
   - Reduce database load further
   - Already partially implemented

2. **Query Optimization**
   - Add database indexes
   - Optimize N+1 queries
   - Use Prisma's `include` efficiently

3. **CDN for Static Assets**
   - Offload file downloads
   - Reduce server bandwidth
   - S3 + CloudFront

4. **Message Queue**
   - Background job processing
   - Async operations (email, webhooks)
   - Bull/BullMQ with Redis

5. **Read Replicas**
   - Separate read/write databases
   - Distribute read load
   - PostgreSQL streaming replication

## Benchmarking

To benchmark your own environment:

```bash
# Install K6
sudo snap install k6

# Run short test (2 minutes, up to 200 users)
k6 run --duration 2m --vus 200 tests/load/api-load-test.js

# Run full test (7 minutes, up to 500 users)
k6 run tests/load/api-load-test.js

# Production stress test (10 minutes, up to 1000 users)
k6 run --duration 10m --vus 1000 tests/load/api-load-test.js
```

**Target Metrics:**
- p95 < 500ms ✅
- p99 < 1000ms ✅
- Error rate < 1% ✅
- Health p95 < 100ms ✅

## Summary

These optimizations dramatically improved system performance under extreme load:

**Key Changes:**
1. ⚡ Health check caching (5s TTL)
2. 🗄️ Database connection pool tuning
3. 🚀 Fastify server optimization
4. 📊 Separated lightweight/detailed health checks

**Results:**
- **99.69% faster p95** (5.75s → 17.76ms)
- **99.98% success rate** (vs 98.68%)
- **+77% throughput** (65 → 115 req/s)
- **All performance targets achieved** ✅

The system is now production-ready for extreme load scenarios (500+ concurrent users) while maintaining excellent performance and reliability.

For questions or issues, see [TESTING.md](./TESTING.md) or create an issue.
