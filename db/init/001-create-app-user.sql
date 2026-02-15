DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_setting('APP_DB_USER', true)) THEN
    EXECUTE format('CREATE USER %I WITH PASSWORD %L',
      current_setting('APP_DB_USER'),
      current_setting('APP_DB_PASSWORD')
    );
  END IF;
END $$;

-- Create DB + grant (or if you already create DB via POSTGRES_DB, just grant)
GRANT ALL PRIVILEGES ON DATABASE app_db TO app_user;

\connect app_db

GRANT USAGE ON SCHEMA public TO app_user;
GRANT CREATE ON SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON SEQUENCES TO app_user;