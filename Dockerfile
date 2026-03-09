# ─── Stage 1: Build ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files first for better caching
COPY package.json yarn.lock ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev for build)
RUN yarn install --frozen-lockfile --ignore-engines

# Generate Prisma Client
RUN yarn prisma:generate

# Copy source code
COPY tsconfig.json ./
COPY src ./src/

# Build TypeScript → dist/
RUN yarn tsc

# ─── Stage 2: Production ──────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl dumb-init

# Copy package files and install production deps only
COPY package.json yarn.lock ./
COPY prisma ./prisma/

RUN yarn install --frozen-lockfile --ignore-engines --production \
    && yarn prisma:generate \
    && yarn cache clean

# Copy compiled backend from builder
COPY --from=builder /app/dist ./dist/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -q --spider http://localhost:3001/health || exit 1

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S boxcord -u 1001
USER boxcord

# Expose port
EXPOSE 3001

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/apps/api/index.js"]
