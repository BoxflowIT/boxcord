# AWS Infrastructure — Boxcord

## Architecture

```
                  ┌──────────────────────────────────────┐
                  │            CloudFront CDN             │
                  │  (HTTPS, SPA routing, WebSocket)      │
                  └──────┬─────────────┬─────────────────┘
                         │             │
               ┌─────────▼──┐    ┌─────▼──────────┐
               │  S3 Bucket  │    │      ALB        │
               │  (Frontend) │    │  (Load Balancer) │
               └─────────────┘    └───────┬────────┘
                                          │
                                  ┌───────▼────────┐
                                  │  ECS Fargate    │
                                  │  (Backend API)  │
                                  └───┬────────┬───┘
                                      │        │
                              ┌───────▼──┐ ┌───▼────────┐
                              │   RDS    │ │ ElastiCache │
                              │ Postgres │ │   Redis     │
                              └──────────┘ └────────────┘
```

**Routing through CloudFront:**
- `/*` → S3 (static frontend assets)
- `/api/*` → ALB → ECS Fargate (backend API)
- `/socket.io/*` → ALB → ECS Fargate (WebSocket)
- `/health` → ALB → ECS Fargate (health check)

## Prerequisites

- AWS CLI v2 configured with `eu-north-1` region
- An existing VPC with at least 2 private subnets (for ECS/RDS/Redis) and 2 public subnets (for ALB)
- Private subnets must have internet access via NAT Gateway
- Existing AWS resources: Cognito User Pool, S3 bucket (`boxcord-uploads`)

## Deploy Infrastructure

### 1. Create the CloudFormation stack

```bash
aws cloudformation deploy \
  --template-file infra/cloudformation.yml \
  --stack-name boxcord-production \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-north-1 \
  --parameter-overrides \
    Environment=production \
    VpcId=vpc-xxxxxxxx \
    PrivateSubnetIds=subnet-aaa,subnet-bbb \
    PublicSubnetIds=subnet-ccc,subnet-ddd \
    DBMasterPassword="<secure-password-min-16-chars>" \
    CognitoUserPoolId="eu-north-1_XXXXXXX" \
    CognitoClientId="xxxxxxxxxxxxxxxxxxxxxxxxxx" \
    JwtSecret="<jwt-secret-min-20-chars>" \
    BoxtimeApiUrl="https://boxtime.boxflow.com" \
    CertificateArn="arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID"
```

> **Note:** `ContainerImageUri` defaults to nginx:alpine for initial stack creation.
> After pushing your first Docker image to ECR, update the stack with the real image URI.

### 2. Get stack outputs

```bash
aws cloudformation describe-stacks \
  --stack-name boxcord-production \
  --query 'Stacks[0].Outputs' \
  --output table
```

### 3. Set GitHub repository secrets & variables

**Secrets** (Settings → Secrets and variables → Actions):
```
AWS_DEPLOY_ROLE_ARN        → IAM role ARN for OIDC (see below)
```

**Variables** (Settings → Secrets and variables → Actions → Variables):
```
ECR_REPOSITORY_NAME          → boxcord-production
ECR_REPOSITORY_NAME_STAGING  → boxcord-staging
ECS_CLUSTER_NAME             → boxcord-production (from ECSClusterName output)
ECS_SERVICE_NAME             → boxcord-production (from ECSServiceName output)
ECS_TASK_FAMILY              → boxcord-production
ECS_CLUSTER_NAME_STAGING     → boxcord-staging
ECS_SERVICE_NAME_STAGING     → boxcord-staging
ECS_TASK_FAMILY_STAGING      → boxcord-staging
ALB_DNS_NAME                 → from ALBDnsName output (without http://)
FRONTEND_BUCKET_NAME         → from FrontendBucketName output
FRONTEND_BUCKET_NAME_STAGING → from staging stack
CLOUDFRONT_DISTRIBUTION_ID   → from CloudFrontDistributionId output
CLOUDFRONT_DISTRIBUTION_ID_STAGING → from staging stack
PRODUCTION_URL               → https://boxcord.boxflow.com
STAGING_URL                  → https://staging.boxcord.boxflow.com
```

### 4. Set up GitHub OIDC for AWS

Create an IAM OIDC Identity Provider for GitHub Actions:

```bash
# Create OIDC provider (one-time)
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# Create deploy role (use the trust policy below)
aws iam create-role \
  --role-name boxcord-github-deploy \
  --assume-role-policy-document file://infra/github-oidc-trust.json
```

Trust policy (`infra/github-oidc-trust.json`):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:BoxflowIT/boxcord:*"
        }
      }
    }
  ]
}
```

Attach permissions to the deploy role:
- `AmazonEC2ContainerRegistryPowerUser` (ECR push)
- `AmazonECS_FullAccess` (ECS deploy)
- `AmazonS3FullAccess` on the frontend buckets
- `CloudFrontFullAccess` (cache invalidation)
- `iam:PassRole` for the ECS task roles

## First Docker Push

After the stack is created and ECR is available:

```bash
# Get ECR URI from stack outputs
ECR_URI=$(aws cloudformation describe-stacks \
  --stack-name boxcord-production \
  --query 'Stacks[0].Outputs[?OutputKey==`ECRRepositoryUri`].OutputValue' \
  --output text)

# Login to ECR
aws ecr get-login-password --region eu-north-1 | \
  docker login --username AWS --password-stdin 650485669960.dkr.ecr.eu-north-1.amazonaws.com

# Build and push
docker build -t boxcord .
docker tag boxcord:latest ${ECR_URI}:latest
docker push ${ECR_URI}:latest

# Update ECS service with new image
aws ecs update-service \
  --cluster boxcord-production \
  --service boxcord-production \
  --force-new-deployment
```

## Database Migration

### Export from Railway

```bash
# Get Railway DATABASE_URL from Railway dashboard
pg_dump "$RAILWAY_DATABASE_URL" --no-owner --no-acl > boxcord-dump.sql
```

### Import to RDS

```bash
# Get RDS endpoint from stack outputs
RDS_HOST=$(aws cloudformation describe-stacks \
  --stack-name boxcord-production \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text)

# Import via bastion host or SSM Session Manager
psql "postgresql://boxcord:PASSWORD@${RDS_HOST}:5432/boxcord" < boxcord-dump.sql
```

### Run Prisma migrations

```bash
DATABASE_URL="postgresql://boxcord:PASSWORD@${RDS_HOST}:5432/boxcord" \
  npx prisma migrate deploy
```

## DNS Configuration

Point your domain to CloudFront:

| Record | Type  | Value                          |
|--------|-------|--------------------------------|
| `boxcord.boxflow.com` | CNAME | `dxxxxxxxx.cloudfront.net` |

> The ACM certificate in **us-east-1** is required for CloudFront custom domain.
> Pass the ARN via the `CertificateArn` parameter.

## Environment Variables

The CloudFormation template configures these on ECS automatically:

| Variable | Source |
|----------|--------|
| `DATABASE_URL` | RDS endpoint from stack |
| `REDIS_URL` | ElastiCache endpoint from stack |
| `COGNITO_USER_POOL_ID` | Parameter |
| `COGNITO_CLIENT_ID` | Parameter |
| `JWT_SECRET` | Parameter |
| `BOXTIME_API_URL` | Parameter |
| `CORS_ORIGIN` | Derived from domain |
| `AWS_S3_BUCKET` | Parameter |
| `SERVE_STATIC` | `false` (CloudFront serves frontend) |
| `NODE_ENV` | `production` |
| `GIPHY_API_KEY` | Parameter |

## Costs (estimated, eu-north-1)

| Service | Instance | ~Cost/month |
|---------|----------|-------------|
| RDS PostgreSQL | db.t4g.micro | $15 |
| ElastiCache Redis | cache.t4g.micro | $13 |
| ECS Fargate | 0.25 vCPU / 0.5 GB | $9-25 |
| ALB | — | $16 |
| CloudFront + S3 | — | $1-2 |
| **Total** | | **~$55-70** |

## Scaling

- **ECS Fargate**: Auto-scales 1→5 tasks based on CPU utilization (70% target)
- **RDS**: Change `DBInstanceClass` parameter to scale vertically; add read replicas for read scaling
- **ElastiCache**: Change `CacheNodeType` parameter; enable cluster mode for horizontal scaling
- **CloudFront**: Scales automatically to global traffic
- **ALB**: Scales automatically based on traffic
