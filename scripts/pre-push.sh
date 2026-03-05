#!/bin/bash
# Pre-push validation script
# Run this before pushing to catch errors early
set -e

echo "🔍 Running pre-push checks..."

# Backend checks
echo "📦 Backend: TypeScript check..."
yarn typecheck

echo "📦 Backend: Lint..."
yarn lint

echo "📦 Backend: Tests..."
yarn test

# Client checks
echo "🎨 Client: Installing dependencies..."
cd client && yarn install --frozen-lockfile --ignore-engines

echo "🎨 Client: TypeScript check..."
yarn tsc --noEmit

echo "🎨 Client: Lint..."
yarn lint

echo "🎨 Client: Tests..."
yarn test

echo "🎨 Client: Build..."
yarn build

echo "✅ All checks passed! Safe to push."
