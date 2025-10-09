#!/usr/bin/env bash
set -euo pipefail

SQL_FILE="$(dirname "$0")/003_add_barcode_and_updated_at.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "ERROR: SQL file not found: $SQL_FILE"
  exit 1
fi

if [ -z "${PG_URL:-}" ]; then
  echo "ERROR: PG_URL environment variable is not set."
  echo "Set it to your Postgres connection string, e.g.:"
  echo "  export PG_URL=\"postgres://user:pass@host:5432/dbname\""
  exit 1
fi

echo "About to run migration file: $SQL_FILE"
echo "Target DB: $PG_URL"

read -p "Are you sure you want to apply this migration? This will modify the database schema. (y/N) " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborted by user. No changes made."
  exit 0
fi

echo "Applying migration..."

# Use psql to run the SQL. psql will parse the URL format when provided as the first argument.
psql "$PG_URL" -f "$SQL_FILE"

echo "Migration applied successfully."

echo "If you need to rollback, run the rollback script: scripts/003_add_barcode_and_updated_at_rollback.sql"
