# ecrumedia Platform

A full-stack admin dashboard and client portal.

## Tech Stack
- React 19 + TypeScript + Tailwind CSS (Frontend)
- NestJS + Prisma (Backend)
- PostgreSQL (Database)

## Local Development

1. Install dependencies:
```bash
npm install
cd backend && npm install && cd ..
```

2. Start database:
```bash
cd backend && docker-compose up -d && cd ..
```

3. Setup backend:
```bash
cd backend
cp .env.example .env
npx prisma migrate dev
cd ..
```

4. Run dev servers:
```bash
npm run dev                    # Frontend on :5173
cd backend && npm run start:dev # Backend on :3000
```

## 🚀 Deployment

**Auto-deploy on every push to main!**

### Setup (one time):
1. See **DEPLOY.txt** for detailed steps
2. Quick ref: **QUICKDEPLOY.txt**

### Deploy:
```bash
git push origin main  # That's it!
```

GitHub Actions automatically builds and deploys everything.

---

*Built on TailAdmin React Template*
