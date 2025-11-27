# ecrumedia Client Portal - Quick Start Guide

## 🚀 Getting Started

This guide will help you get the ecrumedia client portal up and running in development mode.

## Prerequisites

- Node.js 20+ (LTS)
- Docker Desktop (for PostgreSQL and Redis)
- npm or yarn

## Project Structure

```
platform.ecrumedia.com/
├── backend/           # NestJS API backend
│   ├── src/          # Source code
│   ├── prisma/       # Database schema and migrations
│   └── docker-compose.yml  # PostgreSQL + Redis containers
└── src/              # React frontend
    ├── pages/        # Page components
    ├── components/   # Reusable components
    └── i18n/         # German translations
```

## Setup Instructions

### 1. Start the Database (Backend)

```bash
cd backend
docker-compose up -d
```

This will start:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

### 2. Start the Backend API

```bash
cd backend
npm install          # If not already installed
npm run start:dev
```

The API will be available at `http://localhost:3000`

**API Endpoints:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user profile

### 3. Start the Frontend

```bash
# From the root directory
npm install          # If not already installed
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Test the Application

### Register a New User

1. Navigate to `http://localhost:5173/auth/register`
2. Fill in the registration form
3. Submit to create an account

### Login

1. Navigate to `http://localhost:5173/auth/login`
2. Enter your email and password
3. Submit to login

## Database Management

### View Database with Prisma Studio

```bash
cd backend
npx prisma studio
```

This opens a GUI at `http://localhost:5555` to view and edit database records.

### Run Migrations

```bash
cd backend
npx prisma migrate dev
```

### Reset Database

```bash
cd backend
npx prisma migrate reset
```

## Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecrumedia_portal?schema=public"
JWT_SECRET="your-secret-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

## Current Features

### ✅ Implemented

- **User Registration** - Create new client accounts
- **User Login** - JWT-based authentication
- **Session Management** - Token storage and validation
- **German Localization** - Complete UI in German
- **Database Schema** - All models created (Users, Invoices, WordPress, Domains, etc.)
- **Security** - Password hashing, JWT guards, role-based access

### 🚧 In Progress

- Route configuration for auth pages
- Protected routes wrapper
- Dashboard UI

### 📋 Planned

- Invoice management
- WordPress site management
- Domain management
- Email account management
- Admin "Als Kunde einloggen" feature

## Troubleshooting

### Backend won't start

- Check if PostgreSQL is running: `docker ps`
- If not: `cd backend && docker-compose up -d`
- Check logs: `docker logs ecrumedia_postgres`

### Frontend can't connect to API

- Verify backend is running on port 3000
- Check CORS configuration in `backend/src/main.ts`
- Verify `FRONTEND_URL` in `.env` matches your frontend URL

### Database connection error

- Verify `DATABASE_URL` in `backend/.env`
- Check if PostgreSQL container is running
- Verify credentials match docker-compose.yml

## Next Development Steps

1. **Add routing** - Configure React Router for auth pages
2. **Create dashboard** - Client and admin dashboards
3. **Invoice module** - Create invoice management endpoints and UI
4. **WordPress module** - One-click WordPress installation
5. **Admin features** - "Als Kunde einloggen" functionality

## Useful Commands

### Backend
```bash
npm run start:dev     # Start dev server
npm run build         # Build for production
npm run lint          # Lint code
npx prisma studio     # Database GUI
npx prisma generate   # Generate Prisma client
```

### Frontend
```bash
npm run dev           # Start dev server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Lint code
```

### Docker
```bash
docker-compose up -d          # Start containers
docker-compose down           # Stop containers
docker-compose logs -f        # View logs
docker ps                     # List running containers
```

## Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [i18next Documentation](https://www.i18next.com/)

## Support

For questions or issues, contact the development team.

---

**Last Updated:** November 7, 2025  
**Version:** 0.1.0 (Development)
