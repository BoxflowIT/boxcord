#!/usr/bin/env bash
# Setup PostgreSQL 16 via Homebrew for CI (macOS self-hosted runner).
# Usage: ./scripts/setup-postgres.sh <database_name>
#   e.g. ./scripts/setup-postgres.sh boxcord_test
set -euo pipefail

DB_NAME="${1:?Usage: setup-postgres.sh <database_name>}"

export PATH="${HOMEBREW_PREFIX:-/opt/homebrew}/bin:$PATH"
brew list postgresql@16 &>/dev/null || brew install postgresql@16
export PATH="$(brew --prefix postgresql@16)/bin:$PATH"

brew services start postgresql@16

for i in $(seq 1 30); do pg_isready -q && break; sleep 1; done
if ! pg_isready -q; then
  echo "PostgreSQL did not become ready in time." >&2
  exit 1
fi

psql -v ON_ERROR_STOP=1 postgres <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'boxcord') THEN
    CREATE ROLE boxcord LOGIN;
  END IF;
END
$$;
ALTER ROLE boxcord WITH LOGIN NOSUPERUSER CREATEDB PASSWORD 'boxcord';
SQL

psql -v ON_ERROR_STOP=1 postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
psql -v ON_ERROR_STOP=1 postgres -c "CREATE DATABASE ${DB_NAME} OWNER boxcord;"

echo "✅ PostgreSQL ready — database '${DB_NAME}' created"
