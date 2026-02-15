#!/bin/sh
set -eu

PGOPTIONS="-c app.app_user=$APP_USER -c app.app_pass=$APP_PASS" \
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_setting('app.app_user')) THEN
    EXECUTE format('CREATE ROLE %I WITH LOGIN PASSWORD %L',
      current_setting('app.app_user'),
      current_setting('app.app_pass')
    );
  END IF;
END
$$;
SQL