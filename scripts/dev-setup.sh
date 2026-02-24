#!/bin/bash
# Quick start script for local development

set -e

echo "🚀 Starting Boxcord Development Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found!"
    if [ -f .env.local.example ]; then
        echo "📝 Creating .env from .env.local.example..."
        cp .env.local.example .env
        echo "✅ Created .env file"
        echo "⚠️  Please review .env and update values if needed"
    else
        echo "❌ Error: .env.local.example not found!"
        exit 1
    fi
fi

# Start Docker containers
echo ""
echo "🐳 Starting Docker containers..."
docker compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec boxcord-db pg_isready -U boxcord > /dev/null 2>&1; do
    sleep 1
done
echo "✅ PostgreSQL is ready"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
until docker exec boxcord-redis redis-cli ping > /dev/null 2>&1; do
    sleep 1
done
echo "✅ Redis is ready"

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
yarn prisma migrate deploy

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
yarn prisma generate

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "🎯 Next steps:"
echo "  1. Backend:  yarn dev"
echo "  2. Frontend: cd client && yarn dev"
echo "  3. Open:     http://localhost:5173"
echo ""
echo "📚 Documentation: See docs/DEVELOPMENT.md"
echo "🐛 Troubleshooting: yarn docker:logs"
echo ""
