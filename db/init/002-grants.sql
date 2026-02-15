-- 1) schema access
GRANT USAGE ON SCHEMA public TO app_user;

-- 2) existing tables/sequences
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- 3) future tables/sequences created by the migration role (often "postgres") TODO: extract the role name from .env
ALTER DEFAULT PRIVILEGES FOR ROLE "user" IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES FOR ROLE "user" IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_user;