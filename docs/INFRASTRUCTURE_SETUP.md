# Infrastructure Deployment Guide

**Status:** 🏗️ Ready for deployment | **Target:** 1,000-3,000+ concurrent users | **Updated:** 2026-03-09

This guide provides step-by-step instructions for deploying Boxcord to production infrastructure capable of supporting thousands of concurrent users.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Overview](#infrastructure-overview)
3. [Phase 1: Basic Setup (1,000 Users)](#phase-1-basic-setup-1000-users)
4. [Phase 2: Advanced Setup (3,000+ Users)](#phase-2-advanced-setup-3000-users)
5. [Monitoring & Alerting](#monitoring--alerting)
6. [Cost Estimates](#cost-estimates)
7. [Troubleshooting](#troubleshooting)
8. [Migration Checklist](#migration-checklist)

---

## Prerequisites

### What You'll Need

**Required:**
- AWS account (or similar cloud provider)
- Domain name configured
- SSL certificate (AWS ACM or Let's Encrypt)
- PostgreSQL database (RDS or self-hosted)
- S3 bucket for file uploads
- Basic understanding of Docker and load balancers

**Recommended:**
- AWS CLI installed and configured
- Docker installed locally for testing
- Access to CI/CD pipeline (GitHub Actions, etc.)

### Current Application Capabilities

✅ **Already implemented in codebase:**
- Database connection pooling (20 connections/instance)
- S3 file storage integration
- Health check endpoint (`/health`)
- Redis cache support (graceful degradation)
- BullMQ message queue (emails, webhooks, notifications)
- WebSocket real-time messaging
- Stateless architecture (ready for horizontal scaling)
- Environment-based configuration

---

## Infrastructure Overview

### Scaling Targets

| Users | Instances | Load Balancer | Redis | Read Replicas | Message Queue | Est. Cost/mo |
|-------|-----------|---------------|-------|---------------|---------------|--------------|
| 500   | 1         | Optional      | Optional | No          | No            | $60          |
| 1,000 | 2-3       | **Required**  | **Required** | No      | Optional      | $415         |
| 2,000 | 4-5       | **Required**  | **Required** | Recommended | Recommended | $905         |
| 3,000 | 6-8       | **Required**  | **Required** | **Required** | **Required** | $1,670       |
| 5,000+ | 10-12+   | **Required**  | **Required** | **Required** | **Required** | $2,800+      |

### Architecture Diagram (1,000 Users)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ HTTPS
       ▼
┌──────────────┐
│ Load Balancer│  ← AWS ALB or nginx
│   (ALB)      │  ← Sticky sessions for WebSocket
└──────┬───────┘
       │
       │ Distributes traffic
       │
       ├──────────────┬──────────────┐
       │              │              │
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ API #1   │   │ API #2   │   │ API #3   │  ← Docker containers
│ Socket   │   │ Socket   │   │ Socket   │  ← Node.js + Fastify
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │
     └──────────────┼──────────────┘
                    │
     ┌──────────────┼──────────────┐
     │              │              │
     ▼              ▼              ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│PostgreSQL   │  Redis  │   │   S3    │
│   RDS   │   │ Cluster │   │ Bucket  │
└─────────┘   └─────────┘   └─────────┘
```

---

## Phase 1: Basic Setup (1,000 Users)

This phase deploys a basic high-availability setup with 2-3 application instances, load balancer, Redis, and monitoring.

### Step 1: Setup PostgreSQL Database

#### Option A: AWS RDS (Recommended)

1. **Create RDS PostgreSQL Instance:**
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier boxcord-prod \
     --db-instance-class db.t3.medium \
     --engine postgres \
     --engine-version 16.1 \
     --master-username boxcord_admin \
     --master-user-password <SECURE_PASSWORD> \
     --allocated-storage 100 \
     --storage-type gp3 \
     --vpc-security-group-ids sg-xxxxx \
     --backup-retention-period 30 \
     --preferred-backup-window "03:00-04:00" \
     --preferred-maintenance-window "sun:04:00-sun:05:00" \
     --multi-az \
     --publicly-accessible false
   ```

2. **Configure Connection Limits:**
   ```sql
   -- Connect to RDS and increase max connections
   ALTER SYSTEM SET max_connections = 200;
   SELECT pg_reload_conf();
   ```

3. **Create Application Database:**
   ```sql
   CREATE DATABASE boxcord_production;
   CREATE USER boxcord_app WITH ENCRYPTED PASSWORD '<APP_PASSWORD>';
   GRANT ALL PRIVILEGES ON DATABASE boxcord_production TO boxcord_app;
   ```

#### Option B: Self-Hosted PostgreSQL

1. **Install PostgreSQL 16:**
   ```bash
   sudo apt update
   sudo apt install postgresql-16 postgresql-contrib-16
   ```

2. **Configure for Production:**
   ```bash
   sudo nano /etc/postgresql/16/main/postgresql.conf
   ```
   
   Add/modify:
   ```conf
   # Connections
   max_connections = 200
   
   # Memory
   shared_buffers = 4GB
   effective_cache_size = 12GB
   maintenance_work_mem = 1GB
   work_mem = 64MB
   
   # Performance
   random_page_cost = 1.1
   effective_io_concurrency = 200
   
   # Logging
   log_min_duration_statement = 1000  # Log queries >1s
   log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
   ```

3. **Setup Automated Backups:**
   ```bash
   # Install pg_dump cron job
   crontab -e
   ```
   
   Add:
   ```cron
   0 3 * * * pg_dump -U boxcord_app -h localhost boxcord_production | gzip > /backups/boxcord_$(date +\%Y\%m\%d).sql.gz
   0 4 * * * find /backups -name "boxcord_*.sql.gz" -mtime +30 -delete
   ```

### Step 2: Setup Redis Cluster

#### Option A: AWS ElastiCache (Recommended)

1. **Create Redis Cluster:**
   ```bash
   aws elasticache create-replication-group \
     --replication-group-id boxcord-redis \
     --replication-group-description "Boxcord Cache & Sessions" \
     --engine redis \
     --engine-version 7.0 \
     --cache-node-type cache.t3.medium \
     --num-cache-clusters 2 \
     --automatic-failover-enabled \
     --multi-az-enabled \
     --cache-subnet-group-name boxcord-subnet-group \
     --security-group-ids sg-xxxxx \
     --port 6379
   ```

2. **Enable Redis AUTH:**
   ```bash
   aws elasticache modify-replication-group \
     --replication-group-id boxcord-redis \
     --auth-token <SECURE_TOKEN> \
     --auth-token-update-strategy SET \
     --apply-immediately
   ```

3. **Get Connection String:**
   ```bash
   aws elasticache describe-replication-groups \
     --replication-group-id boxcord-redis \
     --query 'ReplicationGroups[0].NodeGroups[0].PrimaryEndpoint.Address' \
     --output text
   ```

#### Option B: Self-Hosted Redis

1. **Install Redis 7:**
   ```bash
   sudo apt install redis-server
   ```

2. **Configure for Production:**
   ```bash
   sudo nano /etc/redis/redis.conf
   ```
   
   Modify:
   ```conf
   # Security
   requirepass <STRONG_PASSWORD>
   bind 0.0.0.0
   protected-mode yes
   
   # Performance
   maxmemory 2gb
   maxmemory-policy allkeys-lru
   
   # Persistence
   save 900 1
   save 300 10
   save 60 10000
   appendonly yes
   appendfsync everysec
   ```

3. **Restart Redis:**
   ```bash
   sudo systemctl restart redis-server
   sudo systemctl enable redis-server
   ```

### Step 3: Setup Load Balancer

#### Option A: AWS Application Load Balancer (ALB)

1. **Create Target Group:**
   ```bash
   aws elbv2 create-target-group \
     --name boxcord-targets \
     --protocol HTTP \
     --port 3001 \
     --vpc-id vpc-xxxxx \
     --health-check-enabled \
     --health-check-path /health \
     --health-check-interval-seconds 30 \
     --health-check-timeout-seconds 5 \
     --healthy-threshold-count 2 \
     --unhealthy-threshold-count 3 \
     --target-type instance
   ```

2. **Create ALB:**
   ```bash
   aws elbv2 create-load-balancer \
     --name boxcord-alb \
     --subnets subnet-xxxxx subnet-yyyyy \
     --security-groups sg-xxxxx \
     --scheme internet-facing \
     --type application \
     --ip-address-type ipv4
   ```

3. **Configure Listener with SSL:**
   ```bash
   aws elbv2 create-listener \
     --load-balancer-arn <ALB_ARN> \
     --protocol HTTPS \
     --port 443 \
     --certificates CertificateArn=<ACM_CERT_ARN> \
     --default-actions Type=forward,TargetGroupArn=<TARGET_GROUP_ARN>
   ```

4. **Enable Sticky Sessions (Critical for WebSocket):**
   ```bash
   aws elbv2 modify-target-group-attributes \
     --target-group-arn <TARGET_GROUP_ARN> \
     --attributes \
       Key=stickiness.enabled,Value=true \
       Key=stickiness.type,Value=lb_cookie \
       Key=stickiness.lb_cookie.duration_seconds,Value=86400
   ```

#### Option B: nginx Load Balancer

1. **Install nginx:**
   ```bash
   sudo apt install nginx
   ```

2. **Configure Load Balancing:**
   ```bash
   sudo nano /etc/nginx/sites-available/boxcord
   ```
   
   Add:
   ```nginx
   upstream boxcord_backend {
       # Use least connections for better distribution
       least_conn;
       
       # Application instances
       server 10.0.1.10:3001 max_fails=3 fail_timeout=30s;
       server 10.0.1.11:3001 max_fails=3 fail_timeout=30s;
       server 10.0.1.12:3001 max_fails=3 fail_timeout=30s;
       
       # Sticky sessions (IP-based)
       ip_hash;
   }
   
   server {
       listen 80;
       server_name boxcord.boxflow.com;
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name boxcord.boxflow.com;
       
       # SSL Configuration (managed by ACM when using ALB)
       ssl_certificate /etc/letsencrypt/live/boxcord.boxflow.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/boxcord.boxflow.com/privkey.pem;
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;
       ssl_prefer_server_ciphers on;
       
       # WebSocket support
       location / {
           proxy_pass http://boxcord_backend;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           
           # Timeouts for WebSocket
           proxy_connect_timeout 7d;
           proxy_send_timeout 7d;
           proxy_read_timeout 7d;
       }
       
       # Health check endpoint
       location /health {
           proxy_pass http://boxcord_backend;
           access_log off;
       }
       
       # Static files (optional)
       location /static/ {
           alias /var/www/boxcord/static/;
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

3. **Enable and Start:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/boxcord /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Step 4: Deploy Application Instances

#### Docker Compose Deployment (Simple)

1. **Create `docker-compose.prod.yml`:**
   ```yaml
   version: '3.8'
   
   services:
     boxcord-1:
       image: boxcord:latest
       container_name: boxcord-api-1
       restart: unless-stopped
       ports:
         - "3001:3001"
       environment:
         NODE_ENV: production
         PORT: 3001
         DATABASE_URL: postgresql://boxcord_app:<YOUR_PASSWORD>@db.example.com:5432/boxcord_production?connection_limit=30&pool_timeout=10
         REDIS_URL: redis://:<YOUR_REDIS_TOKEN>@redis.example.com:6379
         AWS_S3_BUCKET: boxcord-files-prod
         AWS_REGION: eu-north-1
         JWT_SECRET: <SECURE_JWT_SECRET>
         SENTRY_DSN: <YOUR_SENTRY_DSN>
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
         interval: 30s
         timeout: 10s
         retries: 3
         start_period: 40s
       logging:
         driver: "json-file"
         options:
           max-size: "10m"
           max-file: "3"
   
     boxcord-2:
       image: boxcord:latest
       container_name: boxcord-api-2
       restart: unless-stopped
       ports:
         - "3002:3001"
       environment:
         NODE_ENV: production
         PORT: 3001
         DATABASE_URL: postgresql://boxcord_app:<YOUR_PASSWORD>@db.example.com:5432/boxcord_production?connection_limit=30&pool_timeout=10
         REDIS_URL: redis://:<YOUR_REDIS_TOKEN>@redis.example.com:6379
         AWS_S3_BUCKET: boxcord-files-prod
         AWS_REGION: eu-north-1
         JWT_SECRET: <SECURE_JWT_SECRET>
         SENTRY_DSN: <YOUR_SENTRY_DSN>
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
         interval: 30s
         timeout: 10s
         retries: 3
         start_period: 40s
   
     boxcord-3:
       image: boxcord:latest
       container_name: boxcord-api-3
       restart: unless-stopped
       ports:
         - "3003:3001"
       environment:
         NODE_ENV: production
         PORT: 3001
         DATABASE_URL: postgresql://boxcord_app:<YOUR_PASSWORD>@db.example.com:5432/boxcord_production?connection_limit=30&pool_timeout=10
         REDIS_URL: redis://:<YOUR_REDIS_TOKEN>@redis.example.com:6379
         AWS_S3_BUCKET: boxcord-files-prod
         AWS_REGION: eu-north-1
         JWT_SECRET: <SECURE_JWT_SECRET>
         SENTRY_DSN: <YOUR_SENTRY_DSN>
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
         interval: 30s
         timeout: 10s
         retries: 3
         start_period: 40s
   ```

2. **Deploy:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Verify Health:**
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3002/health
   curl http://localhost:3003/health
   ```

#### AWS ECS Deployment (Recommended for Production)

1. **Create Task Definition:**
   ```json
   {
     "family": "boxcord-api",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "1024",
     "memory": "2048",
     "containerDefinitions": [
       {
         "name": "boxcord",
         "image": "<AWS_ACCOUNT_ID>.dkr.ecr.eu-north-1.amazonaws.com/boxcord:latest",
         "portMappings": [
           {
             "containerPort": 3001,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "NODE_ENV",
             "value": "production"
           },
           {
             "name": "PORT",
             "value": "3001"
           }
         ],
         "secrets": [
           {
             "name": "DATABASE_URL",
             "valueFrom": "arn:aws:secretsmanager:eu-north-1:xxxxx:secret:boxcord/db-url"
           },
           {
             "name": "REDIS_URL",
             "valueFrom": "arn:aws:secretsmanager:eu-north-1:xxxxx:secret:boxcord/redis-url"
           },
           {
             "name": "JWT_SECRET",
             "valueFrom": "arn:aws:secretsmanager:eu-north-1:xxxxx:secret:boxcord/jwt"
           }
         ],
         "healthCheck": {
           "command": ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"],
           "interval": 30,
           "timeout": 5,
           "retries": 3,
           "startPeriod": 60
         },
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/boxcord-api",
             "awslogs-region": "eu-north-1",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }
   ```

2. **Create ECS Service:**
   ```bash
   aws ecs create-service \
     --cluster boxcord-cluster \
     --service-name boxcord-api \
     --task-definition boxcord-api:1 \
     --desired-count 3 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=DISABLED}" \
     --load-balancers "targetGroupArn=<TARGET_GROUP_ARN>,containerName=boxcord,containerPort=3001" \
     --health-check-grace-period-seconds 60
   ```

3. **Setup Auto-Scaling:**
   ```bash
   # Register scalable target
   aws application-autoscaling register-scalable-target \
     --service-namespace ecs \
     --resource-id service/boxcord-cluster/boxcord-api \
     --scalable-dimension ecs:service:DesiredCount \
     --min-capacity 3 \
     --max-capacity 8
   
   # Create scaling policy (CPU-based)
   aws application-autoscaling put-scaling-policy \
     --service-namespace ecs \
     --resource-id service/boxcord-cluster/boxcord-api \
     --scalable-dimension ecs:service:DesiredCount \
     --policy-name cpu-scaling \
     --policy-type TargetTrackingScaling \
     --target-tracking-scaling-policy-configuration '{
       "TargetValue": 70.0,
       "PredefinedMetricSpecification": {
         "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
       },
       "ScaleInCooldown": 300,
       "ScaleOutCooldown": 60
     }'
   ```

### Step 5: Run Database Migrations

1. **Connect to one application instance:**
   ```bash
   docker exec -it boxcord-api-1 /bin/bash
   ```

2. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Verify migration:**
   ```bash
   npx prisma db seed  # Optional: seed initial data
   ```

---

## Phase 2: Advanced Setup (3,000+ Users)

This phase adds read replicas, WebSocket clustering, message queue workers, and CDN for serving 3,000+ concurrent users.

### Step 1: Setup Database Read Replicas

#### AWS RDS Read Replica

1. **Create Read Replica:**
   ```bash
   aws rds create-db-instance-read-replica \
     --db-instance-identifier boxcord-replica-1 \
     --source-db-instance-identifier boxcord-prod \
     --db-instance-class db.t3.medium \
     --availability-zone eu-north-1b \
     --publicly-accessible false
   ```

2. **Create Second Replica (Optional):**
   ```bash
   aws rds create-db-instance-read-replica \
     --db-instance-identifier boxcord-replica-2 \
     --source-db-instance-identifier boxcord-prod \
     --db-instance-class db.t3.medium \
     --availability-zone eu-north-1c \
     --publicly-accessible false
   ```

3. **Update Application Configuration:**
   
   Add to environment variables:
   ```env
   DATABASE_READ_REPLICA_URL=postgresql://<DB_USER>:<DB_PASSWORD>@<REPLICA_HOST>:5432/<DB_NAME>
   ```

4. **Implement Read/Write Client Separation:**
   
   **Create:** `src/03-infrastructure/database/read-replica.ts`
   ```typescript
   import { PrismaClient } from '@prisma/client';
   
   // Primary database (writes)
   export const writeDb = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL
       }
     },
     log: ['error', 'warn']
   });
   
   // Read replica (reads only)
   export const readDb = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_READ_REPLICA_URL || process.env.DATABASE_URL
       }
     },
     log: ['error', 'warn']
   });
   
   // Helper to use correct client
   export function getDbClient(operation: 'read' | 'write'): PrismaClient {
     return operation === 'read' ? readDb : writeDb;
   }
   ```

5. **Update Services to Use Read Replicas:**
   
   **Example:** `src/02-application/services/message.service.ts`
   ```typescript
   import { readDb, writeDb } from '../../03-infrastructure/database/read-replica.js';
   
   // Read operations use replica
   async function getMessages(channelId: string) {
     return readDb.message.findMany({
       where: { channelId },
       orderBy: { createdAt: 'desc' },
       take: 50
     });
   }
   
   // Write operations use primary
   async function createMessage(data: CreateMessageInput) {
     return writeDb.message.create({ data });
   }
   ```

#### Self-Hosted PostgreSQL Replication

1. **Configure Primary for Replication:**
   
   Edit `/etc/postgresql/16/main/postgresql.conf`:
   ```conf
   wal_level = replica
   max_wal_senders = 10
   max_replication_slots = 10
   hot_standby = on
   ```

2. **Create Replication User:**
   ```sql
   CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD '<YOUR_REPLICATION_PASSWORD>';
   ```

3. **Configure `pg_hba.conf`:**
   ```conf
   # Allow replication connections from replica servers
   host    replication     replicator      10.0.1.20/32          md5
   host    replication     replicator      10.0.1.21/32          md5
   ```

4. **Setup Replica Server:**
   ```bash
   # Stop PostgreSQL on replica
   sudo systemctl stop postgresql
   
   # Remove existing data
   sudo rm -rf /var/lib/postgresql/16/main/*
   
   # Create base backup from primary
   sudo -u postgres pg_basebackup \
     -h 10.0.1.10 \
     -D /var/lib/postgresql/16/main \
     -U replicator \
     -P \
     -v \
     -R \
     -X stream \
     -C -S replica_1
   
   # Start replica
   sudo systemctl start postgresql
   ```

5. **Verify Replication:**
   ```sql
   -- On primary
   SELECT client_addr, state, sync_state FROM pg_stat_replication;
   
   -- On replica
   SELECT pg_is_in_recovery();  -- Should return 't'
   ```

### Step 2: Implement WebSocket Clustering with Redis

For 2,000+ users, WebSocket connections need to work across multiple instances using Redis Pub/Sub.

1. **Install Redis Adapter:**
   ```bash
   yarn add @socket.io/redis-adapter redis
   ```

2. **Update Socket.io Configuration:**
   
   **Edit:** `src/apps/api/plugins/socket.ts`
   ```typescript
   import { FastifyPluginAsync } from 'fastify';
   import fastifySocketIo from 'fastify-socket.io';
   import { createAdapter } from '@socket.io/redis-adapter';
   import { createClient } from 'redis';
   
   const socketPlugin: FastifyPluginAsync = async (app) => {
     await app.register(fastifySocketIo, {
       cors: {
         origin: process.env.CLIENT_URL || 'http://localhost:5173',
         credentials: true
       }
     });
   
     // Setup Redis adapter for clustering (if Redis available)
     if (process.env.REDIS_URL) {
       const pubClient = createClient({ url: process.env.REDIS_URL });
       const subClient = pubClient.duplicate();
   
       await Promise.all([pubClient.connect(), subClient.connect()]);
   
       app.io.adapter(createAdapter(pubClient, subClient));
   
       app.log.info('Socket.io Redis adapter enabled for clustering');
     }
   
     // ... rest of socket configuration
   };
   
   export default socketPlugin;
   ```

3. **Test Multi-Instance WebSocket:**
   ```bash
   # Start 3 instances
   PORT=3001 node dist/apps/api/index.js &
   PORT=3002 node dist/apps/api/index.js &
   PORT=3003 node dist/apps/api/index.js &
   
   # Connect two clients to different instances
   # They should still be able to message each other via Redis Pub/Sub
   ```

### Step 3: Deploy Message Queue Workers

Separate worker processes handle background jobs (emails, webhooks, notifications).

1. **Create Worker Dockerfile:**
   
   **Create:** `Dockerfile.worker`
   ```dockerfile
   FROM node:20-alpine
   
   WORKDIR /app
   
   COPY package.json yarn.lock ./
   RUN yarn install --production --frozen-lockfile
   
   COPY dist ./dist
   COPY prisma ./prisma
   
   RUN npx prisma generate
   
   # Run worker script
   CMD ["node", "dist/workers/queue-worker.js"]
   ```

2. **Create Worker Script:**
   
   **Create:** `src/workers/queue-worker.ts`
   ```typescript
   import { Worker, Job } from 'bullmq';
   import { getRedisConnection } from '../03-infrastructure/queue/message-queue.js';
   
   const connection = getRedisConnection();
   
   // Email worker
   const emailWorker = new Worker(
     'emails',
     async (job: Job) => {
       console.log(`Processing email job: ${job.id}`);
       // Process email job
       await sendEmail(job.data);
     },
     { connection, concurrency: 10 }
   );
   
   // Webhook worker
   const webhookWorker = new Worker(
     'webhooks',
     async (job: Job) => {
       console.log(`Processing webhook job: ${job.id}`);
       // Process webhook job
       await sendWebhook(job.data);
     },
     { connection, concurrency: 20 }
   );
   
   // Notification worker
   const notificationWorker = new Worker(
     'notifications',
     async (job: Job) => {
       console.log(`Processing notification job: ${job.id}`);
       // Process notification job
       await sendNotification(job.data);
     },
     { connection, concurrency: 30 }
   );
   
   console.log('✅ Queue workers started');
   
   // Graceful shutdown
   process.on('SIGTERM', async () => {
     await Promise.all([
       emailWorker.close(),
       webhookWorker.close(),
       notificationWorker.close()
     ]);
     process.exit(0);
   });
   ```

3. **Deploy Workers:**
   ```bash
   # Docker Compose
   docker-compose -f docker-compose.workers.yml up -d
   
   # Or ECS
   aws ecs create-service \
     --cluster boxcord-cluster \
     --service-name boxcord-workers \
     --task-definition boxcord-worker:1 \
     --desired-count 2 \
     --launch-type FARGATE
   ```

### Step 4: Setup CDN for Static Assets

1. **Create CloudFront Distribution:**
   ```bash
   aws cloudfront create-distribution \
     --origin-domain-name boxcord-static.s3.amazonaws.com \
     --default-root-object index.html \
     --enabled \
     --comment "Boxcord Static Assets"
   ```

2. **Configure Caching:**
   ```json
   {
     "CacheBehaviors": [
       {
         "PathPattern": "/assets/*",
         "TargetOriginId": "S3-boxcord-static",
         "ViewerProtocolPolicy": "redirect-to-https",
         "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
         "CachedMethods": ["GET", "HEAD"],
         "Compress": true,
         "DefaultTTL": 86400,
         "MaxTTL": 31536000,
         "MinTTL": 0
       }
     ]
   }
   ```

3. **Update Application URLs:**
   ```env
   CDN_URL=https://d123456.cloudfront.net
   ```

---

## Monitoring & Alerting

### CloudWatch Dashboards (AWS)

1. **Create Custom Dashboard:**
   ```bash
   aws cloudwatch put-dashboard \
     --dashboard-name Boxcord-Production \
     --dashboard-body file://cloudwatch-dashboard.json
   ```

2. **Dashboard Configuration (`cloudwatch-dashboard.json`):**
   ```json
   {
     "widgets": [
       {
         "type": "metric",
         "properties": {
           "metrics": [
             ["AWS/ECS", "CPUUtilization", {"stat": "Average"}],
             [".", "MemoryUtilization", {"stat": "Average"}]
           ],
           "period": 300,
           "stat": "Average",
           "region": "eu-north-1",
           "title": "ECS Metrics"
         }
       },
       {
         "type": "metric",
         "properties": {
           "metrics": [
             ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average"}],
             [".", "RequestCount", {"stat": "Sum"}],
             [".", "HTTPCode_Target_5XX_Count", {"stat": "Sum"}]
           ],
           "period": 300,
           "stat": "Average",
           "region": "eu-north-1",
           "title": "Load Balancer Metrics"
         }
       },
       {
         "type": "metric",
         "properties": {
           "metrics": [
             ["AWS/RDS", "DatabaseConnections", {"stat": "Average"}],
             [".", "CPUUtilization", {"stat": "Average"}],
             [".", "ReadLatency", {"stat": "Average"}],
             [".", "WriteLatency", {"stat": "Average"}]
           ],
           "period": 300,
           "stat": "Average",
           "region": "eu-north-1",
           "title": "Database Metrics"
         }
       },
       {
         "type": "metric",
         "properties": {
           "metrics": [
             ["AWS/ElastiCache", "CPUUtilization", {"stat": "Average"}],
             [".", "NetworkBytesIn", {"stat": "Sum"}],
             [".", "NetworkBytesOut", {"stat": "Sum"}],
             [".", "CacheHits", {"stat": "Sum"}],
             [".", "CacheMisses", {"stat": "Sum"}]
           ],
           "period": 300,
           "stat": "Average",
           "region": "eu-north-1",
           "title": "Redis Cache Metrics"
         }
       }
     ]
   }
   ```

### Alert Configuration

1. **Create SNS Topic for Alerts:**
   ```bash
   aws sns create-topic --name boxcord-alerts
   aws sns subscribe \
     --topic-arn arn:aws:sns:eu-north-1:xxxxx:boxcord-alerts \
     --protocol email \
     --notification-endpoint devops@example.com
   ```

2. **Setup CloudWatch Alarms:**
   
   **High CPU Alert:**
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name boxcord-high-cpu \
     --alarm-description "Alert when CPU exceeds 80%" \
     --metric-name CPUUtilization \
     --namespace AWS/ECS \
     --statistic Average \
     --period 300 \
     --threshold 80 \
     --comparison-operator GreaterThanThreshold \
     --evaluation-periods 2 \
     --alarm-actions arn:aws:sns:eu-north-1:xxxxx:boxcord-alerts
   ```
   
   **High Memory Alert:**
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name boxcord-high-memory \
     --alarm-description "Alert when memory exceeds 85%" \
     --metric-name MemoryUtilization \
     --namespace AWS/ECS \
     --statistic Average \
     --period 300 \
     --threshold 85 \
     --comparison-operator GreaterThanThreshold \
     --evaluation-periods 2 \
     --alarm-actions arn:aws:sns:eu-north-1:xxxxx:boxcord-alerts
   ```
   
   **High Error Rate:**
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name boxcord-high-errors \
     --alarm-description "Alert when 5xx errors exceed 1%" \
     --metric-name HTTPCode_Target_5XX_Count \
     --namespace AWS/ApplicationELB \
     --statistic Sum \
     --period 300 \
     --threshold 50 \
     --comparison-operator GreaterThanThreshold \
     --evaluation-periods 1 \
     --alarm-actions arn:aws:sns:eu-north-1:xxxxx:boxcord-alerts
   ```
   
   **Slow Response Time:**
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name boxcord-slow-response \
     --alarm-description "Alert when response time exceeds 500ms" \
     --metric-name TargetResponseTime \
     --namespace AWS/ApplicationELB \
     --statistic Average \
     --period 300 \
     --threshold 0.5 \
     --comparison-operator GreaterThanThreshold \
     --evaluation-periods 2 \
     --alarm-actions arn:aws:sns:eu-north-1:xxxxx:boxcord-alerts
   ```
   
   **Database Connections High:**
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name boxcord-db-connections-high \
     --alarm-description "Alert when DB connections exceed 150" \
     --metric-name DatabaseConnections \
     --namespace AWS/RDS \
     --statistic Average \
     --period 300 \
     --threshold 150 \
     --comparison-operator GreaterThanThreshold \
     --evaluation-periods 1 \
     --alarm-actions arn:aws:sns:eu-north-1:xxxxx:boxcord-alerts
   ```

### Grafana Dashboard (Self-Hosted Alternative)

1. **Install Grafana:**
   ```bash
   sudo apt-get install -y adduser libfontconfig1
   wget https://dl.grafana.com/oss/release/grafana_10.2.3_amd64.deb
   sudo dpkg -i grafana_10.2.3_amd64.deb
   sudo systemctl start grafana-server
   sudo systemctl enable grafana-server
   ```

2. **Configure Prometheus Data Source:**
   - Add Prometheus endpoint
   - Import Node Exporter dashboard (ID: 1860)
   - Import PostgreSQL dashboard (ID: 9628)

3. **Create Custom Boxcord Dashboard:**
   - Application metrics (request rate, response time, error rate)
   - Database metrics (connections, query time, cache hit rate)
   - Redis metrics (memory usage, ops/sec, cache hit rate)
   - WebSocket metrics (connections, messages/sec)

---

## Cost Estimates

### 1,000 Concurrent Users

| Service | Specification | Monthly Cost |
|---------|--------------|--------------|
| **ECS Fargate** | 3 tasks × 1 vCPU × 2GB RAM | $140 |
| **RDS PostgreSQL** | db.t3.medium (2 vCPU, 4GB) | $120 |
| **ElastiCache Redis** | cache.t3.medium (2 nodes) | $80 |
| **ALB** | Application Load Balancer | $25 |
| **S3** | 100GB storage + transfer | $15 |
| **CloudWatch** | Logs + metrics | $20 |
| **Data Transfer** | 500GB outbound | $15 |
| **Total** |  | **~$415/month** |

### 3,000 Concurrent Users

| Service | Specification | Monthly Cost |
|---------|--------------|--------------|
| **ECS Fargate** | 8 tasks × 2 vCPU × 4GB RAM | $600 |
| **RDS PostgreSQL** | db.m5.xlarge (4 vCPU, 16GB) | $380 |
| **RDS Read Replicas** | 2 × db.t3.large | $240 |
| **ElastiCache Redis** | cache.m5.large (3 nodes cluster) | $240 |
| **ALB** | Application Load Balancer | $35 |
| **S3** | 500GB storage + transfer | $50 |
| **CloudFront** | CDN for static assets | $30 |
| **CloudWatch** | Logs + metrics + alerts | $40 |
| **Data Transfer** | 2TB outbound | $180 |
| **Total** |  | **~$1,670/month** |

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Pool Exhausted

**Symptoms:**
```
Error: Connection pool timeout
P2024: Timed out fetching a new connection from the connection pool
```

**Solutions:**
1. Check current connections:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   SELECT pid, usename, application_name, client_addr, state 
   FROM pg_stat_activity 
   WHERE datname = 'boxcord_production';
   ```

2. Increase connection limit:
   ```bash
   # In DATABASE_URL
   ?connection_limit=50&pool_timeout=20
   ```

3. Increase PostgreSQL max_connections:
   ```sql
   ALTER SYSTEM SET max_connections = 300;
   SELECT pg_reload_conf();
   ```

4. Kill idle connections:
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle'
   AND state_change < NOW() - INTERVAL '10 minutes';
   ```

#### 2. WebSocket Disconnections

**Symptoms:**
- Users frequently disconnected
- "Connection lost" messages
- WebSocket upgrade failures

**Solutions:**
1. Check load balancer timeout:
   ```bash
   # ALB idle timeout (increase to 1 hour)
   aws elbv2 modify-target-group-attributes \
     --target-group-arn <ARN> \
     --attributes Key=deregistration_delay.connection_termination.enabled,Value=true
   ```

2. Verify sticky sessions enabled:
   ```bash
   aws elbv2 describe-target-group-attributes \
     --target-group-arn <ARN> \
     | grep stickiness
   ```

3. Check nginx timeout (if using nginx):
   ```nginx
   proxy_read_timeout 7d;
   proxy_send_timeout 7d;
   ```

4. Monitor WebSocket connections:
   ```typescript
   app.io.engine.clientsCount  // Current connections
   ```

#### 3. High Memory Usage / OOM Kills

**Symptoms:**
- Containers restarting frequently
- "Out of memory" errors in logs
- Slow performance

**Solutions:**
1. Check memory usage:
   ```bash
   docker stats boxcord-api-1
   ```

2. Reduce memory usage:
   ```typescript
   // Reduce body size limit
   app.register(fastifyPlugin, {
     bodyLimit: 5 * 1024 * 1024  // 5MB instead of 10MB
   });
   ```

3. Implement streaming uploads:
   ```typescript
   // For large files, stream to S3 instead of loading in memory
   import { Upload } from '@aws-sdk/lib-storage';
   ```

4. Increase container memory:
   ```yaml
   # docker-compose
   mem_limit: 4g
   mem_reservation: 2g
   ```

#### 4. Redis Connection Errors

**Symptoms:**
```
Error: Redis connection timeout
ECONNREFUSED: Connection refused
```

**Solutions:**
1. Verify Redis is running:
   ```bash
   redis-cli -h <REDIS_HOST> -a <YOUR_REDIS_TOKEN> ping
   ```

2. Check security groups (AWS):
   ```bash
   # Allow port 6379 from ECS security group
   aws ec2 authorize-security-group-ingress \
     --group-id sg-xxxxx \
     --protocol tcp \
     --port 6379 \
     --source-group sg-yyyyy
   ```

3. Verify AUTH token:
   ```bash
   redis-cli -h <HOST> -a <WRONG_TOKEN>  # Should fail
   redis-cli -h <HOST> -a <CORRECT_TOKEN> ping  # Should return PONG
   ```

4. Check connection string format:
   ```env
   # Correct format
   REDIS_URL=redis://:<YOUR_REDIS_TOKEN>@host:6379
   ```

#### 5. Slow Query Performance

**Symptoms:**
- API response times >500ms
- Database CPU high
- Timeout errors

**Solutions:**
1. Identify slow queries:
   ```sql
   -- Enable slow query log
   ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries >1s
   SELECT pg_reload_conf();
   
   -- View slow queries
   SELECT query, calls, total_exec_time, mean_exec_time
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. Check missing indexes:
   ```sql
   -- Find tables with sequential scans
   SELECT schemaname, tablename, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch
   FROM pg_stat_user_tables
   WHERE seq_scan > 1000
   ORDER BY seq_tup_read DESC;
   ```

3. Verify indexes exist:
   ```sql
   -- Check indexes on messages table
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'Message';
   ```

4. Use read replicas for heavy queries:
   ```typescript
   // Route analytics queries to replica
   const stats = await readDb.message.groupBy({
     by: ['channelId'],
     _count: true
   });
   ```

---

## Migration Checklist

### Pre-Deployment

- [ ] Code deployed to staging and tested
- [ ] Load tests passed at target capacity (1.5x expected users)
- [ ] Database migrations tested on staging copy
- [ ] Backup restoration tested and verified
- [ ] Rollback plan documented and practiced
- [ ] All secrets stored in secret manager
- [ ] SSL certificates installed and tested
- [ ] DNS records configured (A, CNAME, TTL)
- [ ] Monitoring dashboards created
- [ ] Alerts configured and tested
- [ ] On-call rotation scheduled

### Deployment Day

- [ ] Communicate maintenance window to users
- [ ] Create database snapshot before migration
- [ ] Run database migrations
- [ ] Deploy new application version
- [ ] Verify health checks passing
- [ ] Test critical user flows (login, send message, upload file)
- [ ] Monitor error rates for 1 hour
- [ ] Check database connection count
- [ ] Verify WebSocket connections working
- [ ] Test file uploads/downloads
- [ ] Confirm Redis cache working

### Post-Deployment (First Week)

- [ ] Monitor CPU/memory usage daily
- [ ] Review slow query logs
- [ ] Check error rates and types
- [ ] Verify backup automation working
- [ ] Review auto-scaling triggers
- [ ] Test disaster recovery procedure
- [ ] Document any issues encountered
- [ ] Update runbook with new learnings

### Performance Benchmarks (Target)

After Phase 1 deployment (1,000 users):
- **Response Time:** p95 < 100ms, p99 < 500ms
- **Error Rate:** < 0.1%
- **CPU Usage:** < 70% average
- **Memory Usage:** < 80% average
- **Database Connections:** < 150 total
- **Redis Cache Hit Rate:** > 80%
- **WebSocket Connection Success:** > 99.5%

---

## Support & Resources

### Documentation
- [SCALING_STRATEGY.md](./SCALING_STRATEGY.md) - Detailed scaling architecture
- [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md) - Performance tuning guide
- [API.md](./API.md) - Complete API reference
- [TESTING.md](./TESTING.md) - Testing guide and load test procedures

### Monitoring Links
- CloudWatch Dashboard: https://console.aws.amazon.com/cloudwatch/home#dashboards:name=Boxcord-Production
- ECS Services: https://console.aws.amazon.com/ecs/home#/clusters/boxcord-cluster/services
- RDS Monitoring: https://console.aws.amazon.com/rds/home#database:id=boxcord-prod
- ElastiCache: https://console.aws.amazon.com/elasticache/home#redis-group-nodes:id=boxcord-redis

### Emergency Procedures

**Critical Outage:**
1. Check AWS status: https://status.aws.amazon.com/
2. Review CloudWatch alarms
3. Check application logs: `aws logs tail /ecs/boxcord-api --follow`
4. Verify database connectivity
5. Check Redis connectivity
6. Review recent deployments
7. Execute rollback if needed

**Rollback Procedure:**
```bash
# Revert to previous ECS task definition
aws ecs update-service \
  --cluster boxcord-cluster \
  --service boxcord-api \
  --task-definition boxcord-api:PREVIOUS_VERSION \
  --force-new-deployment
```

---

## Next Steps

1. **Start with Phase 1** for 1,000 users:
   - Setup load balancer + Redis + 3 instances
   - Cost: ~$415/month
   - Timeline: 1-2 days

2. **Scale to Phase 2** when approaching 2,000 users:
   - Add read replicas + WebSocket clustering
   - Deploy message queue workers
   - Cost: ~$1,670/month
   - Timeline: 2-3 days

3. **Monitor and optimize:**
   - Review metrics weekly
   - Adjust auto-scaling thresholds
   - Optimize slow queries
   - Review cost opportunities

**Questions?** Contact DevOps team or create issue in repository.

---

**Last Updated:** 2026-03-09  
**Version:** 1.1  
**Maintainer:** DevOps Team
