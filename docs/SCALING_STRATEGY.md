# Scaling Strategy - From 500 to Thousands of Users

This document outlines the architecture and implementation steps to scale Boxcord from supporting 500 concurrent users (single instance) to supporting thousands of concurrent users.

## Current Capacity (Single Instance)

After performance optimizations (see [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md)):

- **500 concurrent users**: Excellent performance
  - p95: 17.76ms
  - p99: 364.29ms
  - Success rate: 99.98%
  - Throughput: 115 req/s

## Scaling Targets

| Users | Instances | Load Balancer | Redis | Read Replicas | Message Queue |
|-------|-----------|---------------|-------|---------------|---------------|
| 500 | 1 | Optional | Optional | No | No |
| 1,000 | 2-3 | ✅ Required | ✅ Required | No | Optional |
| 2,000 | 4-5 | ✅ Required | ✅ Required | ✅ Recommended | ✅ Recommended |
| 3,000 | 6-8 | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| 5,000+ | 10-12+ | ✅ Required | ✅ Required | ✅ Required | ✅ Required |

## Architecture for High Scale

### Phase 1: Basic Horizontal Scaling (1,000-2,000 users)

```
                                    ┌─────────────┐
                                    │   Client    │
                                    └──────┬──────┘
                                           │
                                    ┌──────▼──────┐
                                    │ Load Balancer│
                                    │  (ALB/nginx) │
                                    └──────┬──────┘
                                           │
                        ┌──────────────────┼──────────────────┐
                        │                  │                  │
                   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
                   │ API #1  │       │ API #2  │       │ API #3  │
                   │ Socket  │       │ Socket  │       │ Socket  │
                   └────┬────┘       └────┬────┘       └────┬────┘
                        │                  │                  │
                        └──────────────────┼──────────────────┘
                                           │
                        ┌──────────────────┼──────────────────┐
                        │                  │                  │
                   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
                   │PostgreSQL       │  Redis  │       │   S3    │
                   │ Primary│        │ Cache   │       │ Files   │
                   └─────────┘       └─────────┘       └─────────┘
```

**Key Components:**
1. **Load Balancer** (ALB/nginx)
   - Distributes traffic across instances
   - Health checks
   - SSL termination
   - Sticky sessions for WebSocket

2. **Redis** (Shared state)
   - Session storage
   - Cache layer (already implemented)
   - Rate limiting state
   - WebSocket presence

3. **S3** (Already implemented)
   - Shared file storage
   - Works across multiple instances

### Phase 2: Advanced Scaling (3,000-5,000 users)

```
                                    ┌─────────────┐
                                    │   Client    │
                                    └──────┬──────┘
                                           │
                                    ┌──────▼──────┐
                                    │  CloudFront │
                                    │     CDN     │
                                    └──────┬──────┘
                                           │
                                    ┌──────▼──────┐
                                    │     ALB     │
                                    │ Auto Scaling │
                                    └──────┬──────┘
                                           │
                        ┌──────────────────┼──────────────────┐
                        │                  │                  │
                   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
                   │ API #1  │       │ API #N  │       │ Worker  │
                   │ Socket  │  ...  │ Socket  │       │ Queue   │
                   └────┬────┘       └────┬────┘       └────┬────┘
                        │                  │                  │
                        └──────────────────┼──────────────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
         ┌────▼────┐                  ┌───▼────┐                  ┌────▼────┐
         │PostgreSQL                  │ Redis  │                  │ RabbitMQ│
         │ Primary │                  │Cluster │                  │  Queue  │
         │    └────┴────┐             │(3 nodes)                 └─────────┘
         │  Read Replica│             └────────┘
         │  Read Replica│
         └──────────────┘
```

**Additional Components:**
1. **CDN** (CloudFront)
   - Static asset caching
   - Geographic distribution
   - DDoS protection

2. **Database Read Replicas**
   - Separate read/write traffic
   - 2-3 read replicas
   - Reduce primary DB load

3. **Message Queue** (RabbitMQ/BullMQ)
   - Background job processing
   - Email notifications
   - Webhook delivery
   - File processing

4. **Redis Cluster**
   - High availability
   - Automatic failover
   - Increased capacity

## Implementation Roadmap

### Step 1: Enable Redis (Already Configured ✅)

Current state: Redis is optional and works when configured.

**Production Setup:**
```bash
# Use Redis Cluster or ElastiCache
REDIS_URL=redis://redis-cluster:6379/0
PRISMA_QUERY_CACHE_TTL=60

# For clustering
REDIS_CLUSTER_NODES=redis-1:6379,redis-2:6379,redis-3:6379
```

**Benefits:**
- Shared cache across instances
- Session persistence
- Real-time presence tracking

### Step 2: Setup Load Balancer

#### AWS Application Load Balancer (ALB)

```yaml
# Infrastructure as Code (Terraform/CloudFormation)
LoadBalancer:
  Type: ApplicationLoadBalancer
  Scheme: internet-facing
  
  HealthCheck:
    Path: /health
    Interval: 30s
    Timeout: 5s
    HealthyThreshold: 2
    UnhealthyThreshold: 3
  
  TargetGroup:
    Protocol: HTTP
    Port: 3001
    TargetType: ip
    Deregistration: 30s
    
  Stickiness:
    Enabled: true  # For WebSocket
    Type: lb_cookie
    Duration: 86400  # 24 hours
```

#### Nginx (Self-hosted)

```nginx
upstream backend {
    least_conn;  # Route to least busy server
    
    server api-1:3001 max_fails=3 fail_timeout=30s;
    server api-2:3001 max_fails=3 fail_timeout=30s;
    server api-3:3001 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name api.boxflow.com;
    
    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;
    
    # WebSocket support
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://backend;
        access_log off;
    }
}
```

### Step 3: Database Optimization

#### Connection Pooling (Already Implemented ✅)

Current: 20 connections per instance

**Scale up:**
```env
# For 5 instances
DATABASE_URL="postgresql://...?connection_limit=30&pool_timeout=10"

# Ensure PostgreSQL can handle all connections
# 5 instances × 30 connections = 150 total
# PostgreSQL max_connections should be 200+
```

#### Read Replicas (3,000+ users)

**Setup PostgreSQL Replication:**
```sql
-- On primary
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET max_wal_senders = 10;
ALTER SYSTEM SET max_replication_slots = 10;
SELECT pg_reload_conf();

-- Create replication user
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'secure_pass';
```

**Update Application:**
```typescript
// src/03-infrastructure/database/client.ts
import { PrismaClient } from '@prisma/client';

const writeDb = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

const readDb = new PrismaClient({
  datasourceUrl: process.env.DATABASE_READ_REPLICA_URL
});

// Use read replica for queries
async function getMessages(channelId: string) {
  return readDb.message.findMany({
    where: { channelId }
  });
}

// Use primary for writes
async function createMessage(data: CreateMessageInput) {
  return writeDb.message.create({ data });
}
```

### Step 4: WebSocket Scaling

WebSocket connections are stateful and require special handling.

#### Option A: Sticky Sessions (Simple)

Load balancer routes same user to same instance.

**Pros:**
- Simple to implement
- No code changes

**Cons:**
- Uneven load distribution
- Instance failure disconnects users

#### Option B: Redis Pub/Sub (Recommended for 2,000+)

All instances share real-time state via Redis.

```typescript
// src/apps/api/plugins/socket-cluster.ts
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

const pubClient = new Redis(process.env.REDIS_URL);
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

// Now messages broadcast across all instances
io.to(channelId).emit('message:new', message);
```

**Install:**
```bash
yarn add @socket.io/redis-adapter
```

### Step 5: Background Job Processing

Move heavy/async operations to background workers.

#### Setup BullMQ with Redis

```typescript
// src/03-infrastructure/queue/queue.ts
import { Queue, Worker } from 'bullmq';

const emailQueue = new Queue('emails', {
  connection: { host: 'redis', port: 6379 }
});

const webhookQueue = new Queue('webhooks', {
  connection: { host: 'redis', port: 6379 }
});

// Add job
export async function sendEmailNotification(data: EmailData) {
  await emailQueue.add('sendEmail', data);
}

// Worker (separate process)
const emailWorker = new Worker('emails', async (job) => {
  const { to, subject, body } = job.data;
  await sendGridService.send({ to, subject, body });
}, { connection: { host: 'redis', port: 6379 } });
```

**Jobs to Move to Queue:**
- Email notifications (@mentions, DMs)
- Webhook delivery
- File processing (thumbnails, compression)
- Analytics/metrics aggregation
- Cleanup tasks (old files, expired sessions)

### Step 6: CDN for Static Assets

**CloudFront Configuration:**
```yaml
Distribution:
  Origins:
    - DomainName: s3-bucket.s3.amazonaws.com
      Id: S3-Origin
      
  Behaviors:
    - PathPattern: /uploads/*
      TargetOriginId: S3-Origin
      ViewerProtocolPolicy: redirect-to-https
      Compress: true
      CacheTTL: 86400  # 24 hours
```

**Update File URLs:**
```typescript
// Return CDN URL instead of direct S3
const fileUrl = process.env.CDN_URL 
  ? `${process.env.CDN_URL}/uploads/${filename}`
  : await s3Service.getPresignedUrl(filename);
```

## Auto-Scaling Configuration

### Kubernetes (K8s)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: boxcord-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: boxcord-api
  template:
    metadata:
      labels:
        app: boxcord-api
    spec:
      containers:
      - name: api
        image: boxcord:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: REDIS_URL
          value: redis://redis:6379
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
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
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: boxcord-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: boxcord-api
  minReplicas: 1      # Production: min 1, max 5
  maxReplicas: 5       # Staging: min 1, max 3
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### AWS ECS with Auto Scaling

```yaml
Service:
  DesiredCount: 1
  
AutoScaling:  # Production: min 1, max 5 | Staging: min 1, max 3
  MinCapacity: 1
  MaxCapacity: 5
  
  TargetTrackingScaling:
    - MetricType: ECSServiceAverageCPUUtilization
      TargetValue: 70
    - MetricType: ECSServiceAverageMemoryUtilization
      TargetValue: 80
    - MetricType: ALBRequestCountPerTarget
      TargetValue: 1000
```

## Monitoring for High Scale

### Key Metrics to Track

**Application Metrics:**
```typescript
// Add to metrics.service.ts
import { Gauge, Counter } from 'prom-client';

// Active WebSocket connections
const activeConnections = new Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  labelNames: ['instance']
});

// Total users online
const onlineUsers = new Gauge({
  name: 'users_online_total',
  help: 'Total number of online users'
});

// Message rate
const messageRate = new Counter({
  name: 'messages_total',
  help: 'Total messages sent',
  labelNames: ['type']  // channel, dm
});

// Database pool usage
const dbPoolUsage = new Gauge({
  name: 'database_pool_used',
  help: 'Number of used database connections'
});
```

**CloudWatch Dashboards:**
```yaml
Dashboard:
  Widgets:
    - Type: Metric
      Properties:
        Metrics:
          - [AWS/ECS, CPUUtilization, ServiceName, boxcord-api]
          - [AWS/ECS, MemoryUtilization, ServiceName, boxcord-api]
          - [AWS/ApplicationELB, TargetResponseTime, LoadBalancer, boxcord-lb]
          - [AWS/ApplicationELB, RequestCount, LoadBalancer, boxcord-lb]
          - [AWS/RDS, DatabaseConnections, DBInstanceIdentifier, boxcord-db]
          - [AWS/ElastiCache, CPUUtilization, CacheClusterId, boxcord-redis]
```

**Alerts:**
```yaml
Alarms:
  - Name: HighCPU
    Metric: CPUUtilization
    Threshold: 80
    Duration: 5 minutes
    
  - Name: HighMemory
    Metric: MemoryUtilization
    Threshold: 85
    Duration: 5 minutes
    
  - Name: SlowResponseTime
    Metric: TargetResponseTime
    Threshold: 1s
    
  - Name: HighErrorRate
    Metric: HTTPCode_ELB_5XX_Count
    Threshold: 10 per 5min
    
  - Name: DatabaseConnectionsHigh
    Metric: DatabaseConnections
    Threshold: 80

  - Name: RDSHighCPU
    Metric: CPUUtilization (RDS)
    Threshold: 80%

  - Name: RDSLowStorage
    Metric: FreeStorageSpace
    Threshold: < 2GB

  - Name: RedisHighCPU
    Metric: CPUUtilization (ElastiCache)
    Threshold: 80%
```

## Cost Estimation

### Infrastructure Costs (Monthly, AWS eu-north-1)

**For 1,000 concurrent users (3 instances):**
- EC2 (3x t3.large): $150
- RDS PostgreSQL (db.t3.large): $120
- ElastiCache Redis (cache.t3.medium): $70
- ALB: $25
- S3 + CloudFront: $50
- **Total: ~$415/month**

**For 3,000 concurrent users (8 instances):**
- EC2 (8x t3.large): $400
- RDS PostgreSQL (db.r5.xlarge + 2 replicas): $650
- ElastiCache Redis Cluster (3x cache.m5.large): $420
- ALB: $30
- S3 + CloudFront: $150
- SQS/SNS for queues: $20
- **Total: ~$1,670/month**

**For 5,000 concurrent users (12 instances):**
- EC2 (12x t3.xlarge): $900
- RDS PostgreSQL (db.r5.2xlarge + 3 replicas): $1,400
- ElastiCache Redis Cluster (3x cache.m5.xlarge): $840
- ALB: $35
- S3 + CloudFront: $250
- SQS/SNS for queues: $40
- **Total: ~$3,465/month**

### Alternative: Managed Platforms

**PaaS (Simpler, more expensive per user):**
- 1,000 users: ~$500-700/month
- 3,000 users: ~$1,500-2,000/month
- 5,000 users: ~$3,000-4,000/month

## Performance Testing at Scale

### Load Test for Target User Count

> **Note:** Production-ready load test scripts are available in `load-tests/`:
> - `k6 run load-tests/health.js` — Baseline health check (verifies DB + Redis)
> - `k6 run load-tests/api-smoke.js` — Smoke test (5 VUs, 1 min)
> - `k6 run load-tests/api-load.js` — Full load test (ramp to 50 VUs, 17 min)
> - `k6 run load-tests/spike.js` — Spike test / auto-scaling validation (100 VUs)

```javascript
// tests/load/high-scale-test.js (reference for 3,000+ user target)
import http from 'k6/http';
import { check, sleep } from 'k6';
import ws from 'k6/ws';

export const options = {
  // Test for 3,000 concurrent users
  stages: [
    { duration: '2m', target: 500 },
    { duration: '5m', target: 1000 },
    { duration: '5m', target: 2000 },
    { duration: '5m', target: 3000 },
    { duration: '10m', target: 3000 },  // Sustained load
    { duration: '5m', target: 0 }
  ],
  
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    ws_connecting: ['p(95)<1000'],
    ws_msgs_received: ['count>0']
  }
};

export default function () {
  // 50% HTTP API calls
  if (Math.random() < 0.5) {
    const res = http.get('https://api.boxflow.com/api/v1/messages');
    check(res, { 'status 200': (r) => r.status === 200 });
  }
  // 50% WebSocket connections
  else {
    const url = 'wss://api.boxflow.com';
    const params = { tags: { name: 'WebSocket' } };
    
    ws.connect(url, params, function (socket) {
      socket.on('open', () => {
        socket.send(JSON.stringify({ type: 'ping' }));
      });
      
      socket.on('message', (data) => {
        // Handle message
      });
      
      socket.setTimeout(() => {
        socket.close();
      }, 30000);  // 30s connection
    });
  }
  
  sleep(Math.random() * 5);  // 0-5s between actions
}
```

**Run Test:**
```bash
# From 1 machine (limited)
k6 run tests/load/high-scale-test.js

# From k6 Cloud (distributed)
k6 cloud tests/load/high-scale-test.js
```

## Deployment Checklist for High Scale

> **Note:** Items marked with 🏗️ are infrastructure/deployment tasks. Items marked with ✅ are code-ready.

### Before Deploying to Support 1,000+ Users

**Code Ready (Application Layer):**
- ✅ Database connection pool tuned (20 connections/instance, configurable)
- ✅ S3 file storage implemented and working
- ✅ Health checks implemented (`/health` endpoint)
- ✅ Redis cache support implemented (optional, works when configured)
- ✅ Load testing completed at 500 concurrent users (99.98% success rate)

**Deployment Required (Infrastructure Layer):**
- 🏗️ [ ] Redis cluster setup in production environment
- 🏗️ [ ] Load balancer configured (ALB or nginx) with health checks
- 🏗️ [ ] Sticky sessions enabled for WebSocket connections
- 🏗️ [ ] Deploy 2-3 application instances
- ✅ [x] Monitoring dashboards created (`Boxcord-Production` CloudWatch dashboard, 22 widgets)
- ✅ [x] Alerts configured (8 CloudWatch alarms → SNS `boxcord-alerts`)
- ✅ [x] Auto-scaling rules configured (CPU 70% + Memory 80% target tracking)
- 🏗️ [ ] Rollback plan documented and tested
- ✅ [x] Database backups automated (RDS snapshots: 14-day retention prod, 7-day staging)
- 🏗️ [ ] SSL certificates installed and auto-renewing

### Before Deploying to Support 3,000+ Users

**Code Ready:**
- ✅ Database indexes optimized for high-traffic queries
- ✅ Stateless application design (ready for horizontal scaling)
- ✅ Environment-based configuration (12-factor app)

**Additional Development Required:**
- 🔨 [ ] Implement Redis Pub/Sub adapter for Socket.io clustering
- 🔨 [ ] Add read/write database client separation
- 🔨 [ ] Implement message queue processor (BullMQ)
- 🔨 [ ] Add cache hit rate monitoring metrics

**Deployment Required:**
- 🏗️ [ ] All items from 1,000+ checklist completed
- 🏗️ [ ] Database read replicas setup (2-3 replicas)
- 🏗️ [ ] Deploy 6-8 application instances
- 🏗️ [ ] CDN configured for static assets (CloudFront)
- 🏗️ [ ] Background worker processes deployed (separate containers)
- 🏗️ [ ] Redis cluster with 3+ nodes for high availability
- 🏗️ [ ] Message queue infrastructure (RabbitMQ or AWS SQS)
- 🏗️ [ ] Disaster recovery plan tested (failover <5 minutes)
- 🏗️ [ ] Performance testing at 3x target load (9,000+ virtual users)

## Troubleshooting High Scale Issues

### Database Connection Exhaustion

**Symptoms:**
- "Connection pool timeout" errors
- Slow queries
- High wait times

**Solutions:**
1. Increase connection pool size
2. Add read replicas
3. Optimize slow queries
4. Use PgBouncer for connection pooling

### WebSocket Connection Issues

**Symptoms:**
- Users can't connect
- Random disconnections
- Messages not delivered

**Solutions:**
1. Check load balancer timeout settings
2. Verify sticky sessions enabled
3. Implement Redis adapter for Socket.io
4. Monitor WebSocket connection metrics

### High Memory Usage

**Symptoms:**
- OOM kills
- Containers restarting
- Slow performance

**Solutions:**
1. Reduce bodyLimit in Fastify
2. Implement streaming for large files
3. Add memory limits to containers
4. Scale horizontally (more instances)

### Uneven Load Distribution

**Symptoms:**
- Some instances at 100% CPU
- Others idle
- Poor performance despite capacity

**Solutions:**
1. Use least_conn load balancing algorithm
2. Check health endpoint responding fast
3. Verify all instances registered with LB
4. Review auto-scaling triggers

## Next Steps

1. **Immediate (1,000 users):**
   - Setup Redis cluster
   - Configure load balancer
   - Deploy 2-3 instances
   - Test with load testing

2. **Medium-term (2,000-3,000 users):**
   - Implement Redis Pub/Sub for WebSocket
   - Add read replicas
   - Setup message queue
   - Deploy CDN

3. **Long-term (5,000+ users):**
   - Microservices architecture
   - Geographic distribution
   - Advanced caching strategies
   - Database sharding

## Summary

**Yes, we can absolutely support thousands of users!**

Current architecture with optimizations supports:
- ✅ 500 users per instance (proven with load tests)
- ✅ Horizontal scaling ready (stateless design)
- ✅ Shared storage (S3) already implemented
- ✅ Health checks and monitoring ready
- ✅ Database connection pooling optimized

**To reach 3,000 users, prioritize:**
1. Redis for shared state (critical)
2. Load balancer (ALB or nginx)
3. Deploy 6-8 instances
4. Add read replicas
5. Implement WebSocket clustering

**Cost: ~$1,670/month for 3,000 concurrent users on AWS**

The system is architecturally sound and ready to scale!
