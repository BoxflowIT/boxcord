# AWS Infrastructure — Boxcord

## Architecture

```
                  ┌──────────────────────────────────────┐
                  │            CloudFront CDN             │
                  │  (HTTPS, SPA routing, WebSocket)      │
                  └──────┬─────────────┬─────────────────┘
                         │             │
               ┌─────────▼──┐    ┌─────▼──────────┐
               │  S3 Bucket  │    │   App Runner    │
               │  (Frontend) │    │   (Backend API) │
               └─────────────┘    └───┬────────┬───┘
                                      │        │
                              ┌───────▼──┐ ┌───▼────────┐
                              │   RDS    │ │ ElastiCache │
                              │ Postgres │ │   Redis     │
                              └──────────┘ └────────────┘
```

**Routing through CloudFront:**
- `/*` → S3 (static frontend assets)
- `/api/*` → App Runner (backend API)
- `/socket.io/*` → App Runner (WebSocket)
- `/health` → App Runner (health check)

## Prerequisites

- AWS CLI v2 configured with `eu-north-1` region
- An existing VPC with at least 2 private subnets and internet access (NAT Gateway)
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
    BoxtimeApiUrl="https://boxtime.boxflow.com/api" \
    ContainerImageUri="ACCOUNT.dkr.ecr.eu-north-1.amazonaws.com/boxcord-production:latest"
```

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
APPRUNNER_SERVICE_ARN      → from stack outputs
APPRUNNER_SERVICE_ARN_STAGING → staging stack output
```

**Variables** (Settings → Secrets and variables → Actions → Variables):
```
ECR_REPOSITORY_NAME          → boxcord-production
ECR_REPOSITORY_NAME_STAGING  → boxcord-staging
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
- `AWSAppRunnerFullAccess` (App Runner deploy)
- `AmazonS3FullAccess` on the frontend buckets
- `CloudFrontFullAccess` (cache invalidation)

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
| `staging.boxcord.boxflow.com` | CNAME | `dxxxxxxxx.cloudfront.net` |

> To use a custom domain with CloudFront, you need an ACM certificate
> in **us-east-1** (CloudFront requirement).

```bash
aws acm request-certificate \
  --domain-name boxcord.boxflow.com \
  --subject-alternative-names "*.boxcord.boxflow.com" \
  --validation-method DNS \
  --region us-east-1
```

## Environment Variables

The CloudFormation template configures these on App Runner automatically:

| Variable | Source |
|----------|--------|
| `DATABASE_URL` | RDS endpoint from stack |
| `REDIS_URL` | ElastiCache endpoint from stack |
| `COGNITO_USER_POOL_ID` | Parameter |
| `COGNITO_CLIENT_ID` | Parameter |
| `JWT_SECRET` | Parameter |
| `BOXTIME_API_URL` | Parameter |
| `CORS_ORIGIN` | Derived from domain |
| `AWS_REGION` | Stack region |
| `AWS_S3_BUCKET` | Parameter |
| `SERVE_STATIC` | `false` (CloudFront serves frontend) |
| `NODE_ENV` | `production` |

## Costs (estimated, eu-north-1)

| Service | Instance | ~Cost/month |
|---------|----------|-------------|
| RDS PostgreSQL | db.t4g.micro | $15 |
| ElastiCache Redis | cache.t4g.micro | $13 |
| App Runner | 0.25 vCPU / 0.5 GB | $7-25 |
| CloudFront + S3 | — | $1-2 |
| **Total** | | **~$35-55** |

## Scaling

- **App Runner**: Auto-scales 1→5 instances based on concurrency (configurable in template)
- **RDS**: Change `DBInstanceClass` parameter to scale vertically; add read replicas for read scaling
- **ElastiCache**: Change `CacheNodeType` parameter; enable cluster mode for horizontal scaling
- **CloudFront**: Scales automatically to global traffic
