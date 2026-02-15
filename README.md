# Community Connect — Ops / Admin README

This README is for future maintainers/admins. It focuses on:
- Running & testing locally (dev)
- Deploying to a VPS (prod)
- Soft-wipe & redeploy (reset volumes)
- Deploying changes that include DB schema/migrations
- Accessing Postgres directly for debugging
- Viewing logs and common operational commands

---

## 0) Repo files & environment model

### Compose files
- `docker-compose.yaml`  
  Shared base config for all environments.
- `docker-compose.override.yaml` (dev only)  
  Auto-applied by Docker Compose when running locally.
- `docker-compose.prod.yaml` (prod only)  
  Explicitly applied on VPS.

### Caddy files
- `Caddyfile.dev`  
  For local TLS: `https://localhost`
- `Caddyfile.prod`  
  For production domain.

### Env file policy (important)
- **Local machine**:
  - `.env` is the real env file used locally
  - `.env.prod` exists only as a **reference copy** of production values (do not rely on it at runtime)
- **Production VPS**:
  - `.env` is the real env file used in prod

> Keep `.env` and `.env.prod` out of git. Provide `.env.example` with placeholders.

---

## 1) Prerequisites

### Local
- Docker + Docker Compose
- (Optional) psql client if you want to connect from host: `psql`

### VPS
- Ubuntu (or similar) with:
  - Docker
  - Docker Compose plugin (`docker compose`)
- Firewall/NSG: allow inbound **80/443** (and SSH)

---

## 2) Running locally (dev)

### 2.1 Start the stack
From the project root:
```bash
docker compose up -d --build
```

This uses:
- `docker-compose.yaml`
- plus `docker-compose.override.yaml` automatically
- plus `.env` in the repo root

### 2.2 Access the service
- Main URL: `https://localhost/`  
  (TLS is handled by Caddy dev using `tls internal`)

### 2.3 Confirm containers are healthy
```bash
docker compose ps
```

### 2.4 View logs (dev)
```bash
docker compose logs -f
# or per service:
docker compose logs -f app
docker compose logs -f caddy
docker compose logs -f db
docker compose logs -f db-init
```

### 2.5 Quick smoke tests
```bash
# See that Caddy responds
curl -kI https://localhost/

# Optional: check app directly (dev override publishes 127.0.0.1:3000)
curl -I http://127.0.0.1:3000/
```

---

## 3) Deploying to VPS (prod)

### 3.1 One-time: put `.env` on the VPS
On the VPS, in the repo root, create/edit:
- `.env` (production settings)

Make sure in prod:
- `BASE_URL=https://<your-domain>` (e.g. `https://yyapp.castle-field.com`)
- Auth settings match prod domain (see Auth0 section below)

### 3.2 Deploy / update
From the repo root on the VPS:
```bash
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d --build
```

### 3.3 Check status
```bash
docker compose ps
docker compose logs -f caddy
docker compose logs -f app
```

### 3.4 Confirm ports (host)
```bash
ss -lntp | grep -E ':(80|443|3000|5432)\b' || true
```
Expected:
- 80/443 open (Caddy)
- 3000/5432 should **not** be publicly exposed in prod

---

## 4) Soft-wipe / reset & redeploy (DANGER)

A “soft wipe” removes volumes. You will lose Postgres data.

### 4.1 Local soft wipe
```bash
docker compose down -v
docker compose up -d --build
```

### 4.2 Prod soft wipe (only if you really mean it)
```bash
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml down -v
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d --build
```

> Strongly recommended: take a DB backup first (see section 9).

---

## 5) Deploying PRs that change DB schema / migrations

This project includes a `db-init` service that runs DB setup / schema push once per DB volume.
Depending on your current implementation, schema changes may be applied via:
- `npm run db:push`
- migrations scripts
- or a specific migration runner

### 5.1 Standard update flow (most PRs)
```bash
git pull
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d --build
docker compose logs -f db-init
docker compose logs -f app
```

### 5.2 If schema changes did not apply
Sometimes you want to re-run `db-init` without nuking volumes.

Try:
```bash
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d --build --force-recreate db-init
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml logs -f db-init
```

If `db-init` is designed to run only once, you may need to manually invoke migration commands inside the `app` or `db-init` image. Example pattern:
```bash
docker compose exec app sh -lc "npm run db:push"
# or
docker compose exec app sh -lc "npm run migrate"
```

> Choose the command that matches your repo scripts. Check `package.json` scripts.

### 5.3 If migrations require data transformations
Best practice:
1) Backup DB first (section 9)
2) Run migration command
3) Verify tables and app behavior
4) Only then restart services

---

## 6) Accessing Postgres on VPS (debug / view / edit)

### 6.1 Open `psql` inside the DB container
From repo root:
```bash
docker compose exec db psql -U "$POSTGRES_ADMIN_USER" -d "$POSTGRES_DB"
```

Useful psql commands:
```sql
\l                 -- list databases
\c <db_name>       -- connect to db
\dn                -- list schemas
\dt                -- list tables
\dt *.*            -- list tables across schemas
\d <table>         -- describe table
\x                 -- toggle expanded display
```

### 6.2 One-liner queries from the host
```bash
docker compose exec db psql -U "$POSTGRES_ADMIN_USER" -d "$POSTGRES_DB" -c '\dt'
docker compose exec db psql -U "$POSTGRES_ADMIN_USER" -d "$POSTGRES_DB" -c 'SELECT NOW();'
```

### 6.3 Enter a shell inside the db container (optional)
```bash
docker compose exec db sh
# then run:
psql -U "$POSTGRES_ADMIN_USER" -d "$POSTGRES_DB"
```

### 6.4 Editing data safely
For quick edits:
```sql
BEGIN;
UPDATE ...;
SELECT ...; -- verify
COMMIT;     -- or ROLLBACK;
```

---

## 7) Logs and debugging commands

### 7.1 Follow logs
```bash
docker compose logs -f
```

### 7.2 Follow logs for a single service
```bash
docker compose logs -f app
docker compose logs -f caddy
docker compose logs -f db
docker compose logs -f db-init
```

### 7.3 Inspect container list and ports
```bash
docker compose ps
docker container ls
docker compose port app 3000 || true
```

### 7.4 Check health / restart a service
```bash
docker compose restart app
docker compose restart caddy
```

### 7.5 Exec into containers
```bash
docker compose exec app sh
docker compose exec caddy sh
docker compose exec db sh
```

### 7.6 Verify internal networking (from within caddy container)
```bash
docker compose exec caddy sh -lc "wget -qO- http://app:3000/ | head"
```

---

## 8) Auth0 / OAuth environment notes (common failure point)

If using Auth0 (or similar), ensure the provider dashboard includes both dev and prod:

### Dev (localhost)
- Base URL: `https://localhost`
- Allowed Callback URLs: `https://localhost/<callback-path>`
- Allowed Logout URLs: `https://localhost`
- Allowed Web Origins: `https://localhost`

### Prod
- Base URL: `https://yyapp.castle-field.com`
- Allowed Callback URLs: `https://yyapp.castle-field.com/<callback-path>`
- Allowed Logout URLs: `https://yyapp.castle-field.com`
- Allowed Web Origins: `https://yyapp.castle-field.com`

If login “works” but session doesn’t persist, check cookie settings:
- HTTPS vs HTTP mismatch
- Secure cookie flags
- BASE_URL mismatch (very common)

---

## 9) Backups (recommended before real usage)

### 9.1 Create a manual SQL dump (VPS)
Run on VPS from repo root:
```bash
mkdir -p backups
docker compose exec -T db pg_dump -U "$POSTGRES_ADMIN_USER" "$POSTGRES_DB" > backups/backup_$(date +%F).sql
```

Optional compress:
```bash
gzip -9 backups/backup_$(date +%F).sql
```

### 9.2 Restore from a dump (DANGER: overwrites data depending on method)
Typical approaches:
- Drop & recreate db then restore
- Restore to a fresh db name first, then cut over

Example restore into existing db (may fail if objects already exist):
```bash
cat backups/backup_YYYY-MM-DD.sql | docker compose exec -T db psql -U "$POSTGRES_ADMIN_USER" -d "$POSTGRES_DB"
```

---

## 10) Common “gotchas” and fixes

### 10.1 “Connection refused” on localhost
- Use `https://localhost/` (Caddy dev terminates TLS)
- Don’t hit `https://localhost:3000` (app serves HTTP on 3000)

### 10.2 “role ... does not exist” when using psql
Usually env vars not loaded in your shell. Use explicit values or run psql inside the container:
```bash
docker compose exec db psql -U "$POSTGRES_ADMIN_USER" -d "$POSTGRES_DB"
```

### 10.3 Need to see tables
Inside `psql`:
```sql
\dt
```

### 10.4 Rebuild after code changes
```bash
docker compose up -d --build
```

### 10.5 Hard reset everything locally
```bash
docker compose down -v
docker compose up -d --build
```

---

## 11) Operational “standard procedure” (good default)

### Update code on VPS
```bash
git pull
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d --build
docker compose logs -f app
```

### If the update includes schema changes
1) Backup
2) Deploy
3) Watch db-init/app logs
4) Verify schema + app endpoints

```bash
mkdir -p backups
docker compose exec -T db pg_dump -U "$POSTGRES_ADMIN_USER" "$POSTGRES_DB" > backups/backup_$(date +%F).sql

git pull
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d --build
docker compose logs -f db-init
docker compose logs -f app

docker compose exec db psql -U "$POSTGRES_ADMIN_USER" -d "$POSTGRES_DB" -c '\dt'
```

---

## 12) Useful references
- Docker Compose docs: `docker compose --help`
- psql meta commands: `\?` inside psql
