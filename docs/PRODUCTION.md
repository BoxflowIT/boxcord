# Production Deployment Guide

Complete guide for deploying Boxcord to production.

## Prerequisites

- [x] PostgreSQL database (AWS RDS) ✅ `boxcord-production` (eu-north-1)
- [x] Redis instance (AWS ElastiCache) ✅ `boxcord-production` (noeviction)
- [x] AWS Cognito User Pool ✅ (shared with Boxtime)
- [x] Domain name ✅ `boxcord.boxflow.com`

## Environment Variables

### Required

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/database

# Server
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Authentication
COGNITO_USER_POOL_ID=eu-north-1_xxxxx
COGNITO_CLIENT_ID=your-client-id
COGNITO_REGION=eu-north-1
JWT_SECRET=your-production-secret-min-32-chars

# Boxtime Integration
BOXTIME_API_URL=https://boxtime.boxflow.com

# Push Notifications
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:support@boxflow.com
```

### Recommended

```bash
# Redis Cache
REDIS_URL=redis://user:pass@host:port
PRISMA_QUERY_CACHE_TTL=60

# Sentry Error Tracking
SENTRY_DSN=https://your-key@sentry.io/project
```

### Optional (for scaling)

```bash
# AWS S3 File Storage (required for multi-server deployments)
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=boxcord-uploads

# SendGrid Email Notifications
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@boxflow.com
```

## Environments

| Environment | URL | Deploy trigger |
|-------------|-----|----------------|
| **Production** | `https://boxcord.boxflow.com` | Push to `main` |
| **Staging** | `https://staging.boxcord.boxflow.com` | Push to `develop` |

Both environments run the same AWS architecture (ECS Fargate + RDS + ElastiCache + CloudFront) with separate databases and resources.

## Deployment Platforms

### AWS (Recommended)

Boxcord runs on AWS using ECS Fargate, RDS PostgreSQL, ElastiCache Redis, and CloudFront.
See [infra/README.md](../infra/README.md) for the full infrastructure setup guide.

1. **Deploy Infrastructure** — CloudFormation creates all resources
2. **Build & Push Docker Image** — `docker build` + push to ECR
3. **Deploy Frontend** — `aws s3 sync` to S3, CloudFront invalidation
4. **Update ECS Service** — Register new task definition, update service

All of this is automated via GitHub Actions (`deploy-aws.yml`).

### Docker

```bash
# Build
docker build -t boxcord .

# Run
docker run -p 3001:3001 \
  -e DATABASE_URL=... \
  -e JWT_SECRET=... \
  # ... other env vars
  boxcord
```

### Manual Deployment

```bash
# 1. Install dependencies
npm install --production

# 2. Build frontend
cd client && npm install && npm run build && cd ..

# 3. Run migrations
npx prisma migrate deploy

# 4. Generate Prisma Client
npx prisma generate

# 5. Start server
npm start
```

## Post-Deployment Checklist

### 1. Database Setup

```bash
# Verify migrations
npx prisma migrate status

# Seed initial data (optional)
npx tsx prisma/seed.ts
```

### 2. Health Check

```bash
curl https://boxcord.boxflow.com/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 3. WebSocket Test

Open browser console:

```javascript
const socket = io('https://boxcord.boxflow.com');
socket.on('connect', () => console.log('✅ WebSocket connected'));
```

### 4. Setup Monitoring

- [x] Configure CloudWatch dashboard ✅ (`Boxcord-Production`, 22 widgets)
- [x] Configure CloudWatch alarms ✅ (8 alarms → SNS `boxcord-alerts`)
- [x] Configure Sentry alerts ✅ (client + server, error tracking active)
- [ ] Setup uptime monitoring (UptimeRobot / BetterStack)

### 5. Performance

- [x] Enable Redis caching ✅ (ElastiCache, noeviction policy)
- [x] Setup CDN for static assets ✅ (CloudFront `E184WCVC6C5PL4`)
- [x] Configure database connection pooling ✅ (Prisma, 20 connections/instance)
- [ ] Enable Prisma Accelerate (optional, not needed with current setup)

## Scaling

### Horizontal Scaling

When running multiple instances:

1. **Enable S3 for file storage**

   ```bash
   AWS_S3_BUCKET=boxcord-uploads
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   ```

2. **Use Redis for caching** (not in-memory)

   ```bash
   REDIS_URL=redis://...
   ```

3. **Enable sticky sessions** for WebSocket
   - AWS ALB: Handled automatically with ECS
   - ECS Fargate: Increase `DesiredCount` for more tasks behind ALB

### Database Optimization

1. **Connection pooling**

   ```prisma
   datasource db {
     url = env("DATABASE_URL")
     relationMode = "prisma"
     pooling = true
   }
   ```

2. **Read replicas** (for high traffic)
   - Point read-only queries to replicas
   - Keep writes on primary

### CDN Setup

```bash
# Static assets served via S3 + CloudFront CDN
# Production:  https://boxcord.boxflow.com (CloudFront → S3)
# Staging:     https://staging.boxcord.boxflow.com (CloudFront → S3)
```

## Monitoring & Observability

### Logs

Production logs are JSON-formatted:

```json
{
  "level": "info",
  "time": "2026-02-18T17:00:00.000Z",
  "module": "api",
  "msg": "Request completed",
  "method": "GET",
  "url": "/api/v1/channels",
  "statusCode": 200,
  "responseTime": 45
}
```

Ship to log aggregation service:

- Datadog
- LogDNA
- Elasticsearch + Kibana

### Metrics

Track:

- Response times (p50, p95, p99)
- Error rates
- WebSocket connections
- Database query performance
- Cache hit rates

### Alerts (CloudWatch — 8 alarms active)

All alarms send to SNS topic `arn:aws:sns:eu-north-1:650485669960:boxcord-alerts`:

- ECS CPU > 80%, Memory > 85%
- RDS CPU > 80%, Low storage < 2GB, Connections > 80
- Redis CPU > 80%
- ALB 5xx > 10/5min, Response time > 1s

## Security Checklist

- [x] Use HTTPS only (enable HSTS) ✅ `strict-transport-security: max-age=15552000; includeSubDomains`
- [x] JWT via AWS Cognito ✅ (RS256, JWKS validation)
- [x] Enable rate limiting ✅ (100 req/min default, Redis-backed)
- [x] Configure CORS properly ✅ (`origin: boxcord.boxflow.com`, credentials)
- [x] Enable Helmet security headers ✅ (CSP, X-Frame-Options, Referrer-Policy, etc.)
- [x] Regular dependency updates ✅ (0 vulnerabilities as of 2026-03-10)
- [x] Database backups enabled ✅ (RDS: 14-day prod, 7-day staging)
- [x] Secrets stored in environment ✅ (ECS task definition env vars)

## Backup & Recovery

### Database Backups

```bash
# Automated backups via RDS automated snapshots
# Production: 14-day retention | Staging: 7-day retention
# Point-in-time recovery: 5-minute granularity

# Create manual snapshot before major changes:
aws rds create-db-snapshot \
  --db-instance-identifier boxcord-production \
  --db-snapshot-identifier boxcord-pre-migration-$(date +%Y%m%d)
```

### Disaster Recovery

1. Keep `.env.example` updated with required variables
2. Document deployment process
3. Test recovery process quarterly
4. Monitor backup status

## Troubleshooting

### WebSocket Not Connecting

1. Check CORS configuration
2. Verify load balancer supports WebSockets
3. Check firewall rules
4. Enable sticky sessions

### Slow Performance

1. Enable Redis caching
2. Check database query performance
3. Review Prisma query logs
4. Enable CDN for static assets

### High Memory Usage

1. Check for memory leaks (Heap snapshots)
2. Review WebSocket connection limits
3. Optimize Prisma queries
4. Consider horizontal scaling

## Support

For issues:

1. Check logs for errors
2. Review Sentry for exceptions
3. Verify environment variables
4. Check health endpoint: `/health`
