#!/usr/bin/env bash
# Setup PostgreSQL for CI (macOS via Homebrew or Linux via system package).
# Usage: ./scripts/setup-postgres.sh <database_name>
#   e.g. ./scripts/setup-postgres.sh boxcord_test
set -euo pipefail

DB_NAME="${1:?Usage: setup-postgres.sh <database_name>}"

OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
  # macOS: use Homebrew
  export PATH="${HOMEBREW_PREFIX:-/opt/homebrew}/bin:$PATH"
  brew list postgresql@16 &>/dev/null || brew install postgresql@16
  export PATH="$(brew --prefix postgresql@16)/bin:$PATH"
  brew services start postgresql@16
  PG_PORT=5432
  PSQL_CMD="psql"
  PSQL_DB="postgres"
elif [ "$OS" = "Linux" ]; then
  # Linux: system PostgreSQL on port 5433 (5432 reserved for Docker containers)
  if ! command -v psql &>/dev/null; then
    echo "ERROR: PostgreSQL not installed. Run: sudo apt-get install postgresql postgresql-client" >&2
    exit 1
  fi
  sudo systemctl start postgresql 2>/dev/null || true
  PG_PORT=5433
  PSQL_CMD="sudo -u postgres psql"
  PSQL_DB="postgres"
else
  echo "ERROR: Unsupported OS: $OS" >&2
  exit 1
fi

# Wait for PostgreSQL to be ready
for i in $(seq 1 30); do pg_isready -p "$PG_PORT" -q && break; sleep 1; done
if ! pg_isready -p "$PG_PORT" -q; then
  echo "PostgreSQL did not become ready in time." >&2
  exit 1
fi

# Create role and database
$PSQL_CMD -p "$PG_PORT" -v ON_ERROR_STOP=1 -d "$PSQL_DB" -c "
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'boxcord') THEN
    CREATE ROLE boxcord LOGIN;
  END IF;
END
\$\$;
"

$PSQL_CMD -p "$PG_PORT" -v ON_ERROR_STOP=1 -d "$PSQL_DB" -c "ALTER ROLE boxcord WITH LOGIN NOSUPERUSER CREATEDB PASSWORD 'boxcord';"
$PSQL_CMD -p "$PG_PORT" -v ON_ERROR_STOP=1 -d "$PSQL_DB" -c "DROP DATABASE IF EXISTS ${DB_NAME};"
$PSQL_CMD -p "$PG_PORT" -v ON_ERROR_STOP=1 -d "$PSQL_DB" -c "CREATE DATABASE ${DB_NAME} OWNER boxcord;"

echo "✅ PostgreSQL ready — database '${DB_NAME}' on port ${PG_PORT} (${OS})"
