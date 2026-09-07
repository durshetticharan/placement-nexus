# Placement Nexus — Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose v2+
- Git
- A PostgreSQL 16 instance (or use the bundled Docker service)
- Node.js 20 (for local development)
- Python 3.11 (for local AI service development)

---

## Environment Variables

Create environment files **before** deploying. Never commit real secrets.

### Backend (`backend/.env`)

Copy from `backend/.env.example` and fill in:

```
DATABASE_URL=postgresql://placementnexus:STRONG_PASSWORD@localhost:5432/placement_nexus?schema=public
PORT=5000
NODE_ENV=production
JWT_ACCESS_SECRET=<64-hex-char random string>
JWT_REFRESH_SECRET=<different 64-hex-char random string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CORS_ORIGIN=https://your-frontend-domain.com
AI_SERVICE_URL=http://localhost:8000
AI_INTERNAL_KEY=<32-hex-char random string>
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### AI Service (`ai-service/.env`)

```
AI_INTERNAL_KEY=<same key as backend AI_INTERNAL_KEY>
AI_PROVIDER=mock         # or "gemini" for live AI
AI_GEMINI_API_KEY=       # only required if AI_PROVIDER=gemini
```

### Docker Compose (`.env` in project root)

```
POSTGRES_PASSWORD=STRONG_DB_PASSWORD
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
CORS_ORIGIN=https://your-frontend-domain.com
AI_INTERNAL_KEY=...
AI_PROVIDER=mock
AI_GEMINI_API_KEY=       # optional
```

---

## Database Setup

### First deployment
```bash
cd backend
npx prisma migrate deploy    # runs all pending migrations
npx prisma generate          # ensure client is up to date
npm run seed                 # optional: seed initial data
```

### Production migration (never use `prisma migrate reset`)
```bash
# 1. Backup first (see Backup section)
pg_dump -U placementnexus placement_nexus > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply migrations
npx prisma migrate deploy

# 3. Verify
npx prisma migrate status
```

---

## Local Development

```bash
# 1. Start PostgreSQL (via Docker or local)
docker run -d --name pg -e POSTGRES_PASSWORD=root -p 5432:5432 postgres:16-alpine

# 2. Backend
cd backend
cp .env.example .env    # fill in values
npm install
npx prisma migrate dev  # create/apply migrations
npx prisma generate
npm run seed            # seed test data
npm run dev             # starts on :5000 with tsx watch

# 3. Frontend (separate terminal)
cd frontend
npm install
npm run dev             # starts Vite on :5173 with proxy to :5000

# 4. AI Service (separate terminal)
cd ai-service
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env    # fill in values
uvicorn app.main:app --reload --port 8000
```

---

## Docker Deployment

```bash
# From project root — ensure .env is configured
docker compose up --build -d

# Check status
docker compose ps
docker compose logs backend -f
docker compose logs frontend -f

# Stop
docker compose down
```

Services:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api/v1` (internal; proxied via nginx)
- AI service: internal only (not exposed to host)
- PostgreSQL: internal only (not exposed to host)

---

## Health Checks

| Endpoint                        | Description                |
|---------------------------------|----------------------------|
| `GET /api/v1/health`            | Liveness — process running |
| `GET /api/v1/health/ready`      | Readiness — DB connected   |
| `GET /api/v1/health/db`         | DB connectivity check      |
| `GET http://localhost:8000/health` | AI service liveness     |

---

## Production Build (Without Docker)

### Backend
```bash
cd backend
npm ci --omit=dev
npx prisma generate
npm run build           # compiles TypeScript to dist/
NODE_ENV=production node dist/server.js
```

### Frontend
```bash
cd frontend
npm ci
npm run build           # outputs to dist/
# Serve dist/ with nginx or any static file server
```

### AI Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

---

## Backup Strategy

### Manual backup
```bash
# Full logical backup
pg_dump -h localhost -U placementnexus -d placement_nexus \
  -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# Restore
pg_restore -h localhost -U placementnexus -d placement_nexus \
  --clean backup_YYYYMMDD_HHMMSS.dump
```

### Recommendations
- **Frequency**: Daily automated backups minimum; hourly for active production
- **Retention**: Keep 7 daily, 4 weekly, 3 monthly
- **Verification**: Restore to a test environment weekly to confirm backup integrity
- **Off-site**: Store backups in a separate location (S3, GCS, etc.)

### Docker volume backup
```bash
docker run --rm \
  -v placement-nexus_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_volume_$(date +%Y%m%d).tar.gz /data
```

---

## Rollback Strategy

### Application rollback
```bash
git log --oneline       # find the target commit
git checkout <commit>   # check out to verify
# Rebuild and redeploy from that commit
```

### Migration rollback
Prisma does not support automatic migration rollback. Use the **backup-restore** strategy:

1. Stop the application
2. Restore from the last pre-migration backup:
   ```bash
   pg_restore --clean -d placement_nexus backup_pre_migration.dump
   ```
3. Deploy the previous application version
4. Investigate and fix the migration before re-applying

---

## Troubleshooting

| Problem | Resolution |
|---------|-----------|
| `Connection refused :5000` | Backend not started. Check `docker compose logs backend` |
| `P1001: Can't reach database` | PostgreSQL not running or `DATABASE_URL` wrong |
| `JWT_ACCESS_SECRET missing` | Set environment variable before starting |
| `CORS error in browser` | Check `CORS_ORIGIN` matches the frontend URL exactly |
| `AI service 503` | AI service not running, or `AI_INTERNAL_KEY` mismatch |
| `Multer LIMIT_FILE_SIZE` | File exceeds 5MB limit |
| `prisma migrate deploy` fails | Run `npx prisma migrate status` to diagnose |
