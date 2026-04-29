#!/bin/bash
# Pre-push validation — fast typecheck only (full tests run in CI)
set -e

echo "🔍 Running pre-push checks..."

echo "📦 Backend: TypeScript check..."
yarn typecheck

echo "🎨 Client: TypeScript check..."
cd client && yarn tsc --noEmit

echo "✅ Typechecks passed! CI will run full tests."
