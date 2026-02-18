# Production Deployment Guide

Complete guide for deploying Boxcord to production.

## Prerequisites

- [ ] PostgreSQL database (Railway, Supabase, AWS RDS, etc.)
- [ ] Redis instance (optional, but recommended)
- [ ] AWS Cognito User Pool (shared with Boxtime)
- [ ] Domain name (optional)

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

## Deployment Platforms

### Railway (Recommended)

1. **Connect Repository**

   ```bash
   # Railway will auto-detect Node.js and use nixpacks
   # Make sure railway.json is configured
   ```

2. **Configure Environment**
   - Add all required environment variables in Railway dashboard
   - Railway provides PostgreSQL and Redis add-ons

3. **Deploy**

   ```bash
   # Automatic on push to main branch
   # Or manually trigger deployment
   ```

4. **Setup Custom Domain** (optional)
   - Add custom domain in Railway settings
   - Update DNS records

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
curl https://your-domain.com/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 3. WebSocket Test

Open browser console:

```javascript
const socket = io('https://your-domain.com');
socket.on('connect', () => console.log('✅ WebSocket connected'));
```

### 4. Setup Monitoring

- [ ] Configure Sentry alerts
- [ ] Setup uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure log aggregation (Datadog, LogDNA)

### 5. Performance

- [ ] Enable Redis caching
- [ ] Setup CDN for static assets (Cloudflare)
- [ ] Configure database connection pooling
- [ ] Enable Prisma Accelerate (optional)

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
   - Railway: Handled automatically
   - Kubernetes: Use `sessionAffinity: ClientIP`
   - Load balancer: Enable session persistence

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
# Serve static assets from CDN
# Cloudflare, AWS CloudFront, or similar
# Configure CORS for WebSocket upgrades
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

### Alerts

Configure alerts for:

- High error rate (> 1%)
- Slow response times (> 500ms)
- Database connection errors
- High memory usage (> 80%)
- WebSocket disconnections

## Security Checklist

- [ ] Use HTTPS only (enable HSTS)
- [ ] Set secure JWT_SECRET (min 32 chars)
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Enable Helmet security headers
- [ ] Regular dependency updates
- [ ] Database backups enabled
- [ ] Secrets stored in environment (never in code)

## Backup & Recovery

### Database Backups

```bash
# Automated backups (Railway/Supabase handle this)
# Or manual:
pg_dump $DATABASE_URL > backup.sql

# Restore:
psql $DATABASE_URL < backup.sql
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
