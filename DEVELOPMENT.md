# SkillBridge - Local Development Guide

This guide helps you run the entire system locally for development and testing.

## Prerequisites

- **Node.js** 18.x or higher ([Download](https://nodejs.org))
- **PostgreSQL** 13+ ([Download](https://www.postgresql.org/download) or use [Docker](https://docs.docker.com/engine/install))
- **Git**
- A **Clerk** account (free at [clerk.com](https://clerk.com))
- A **code editor** (VS Code recommended)

## Quick Start (5 minutes)

### Step 1: Setup Clerk

1. Create account at [clerk.com](https://clerk.com)
2. Create a new application
3. Go to **API Keys** and copy:
   - Publishable Key (Frontend)
   - API Key (Backend)
   - JWT Key (Backend)

### Step 2: Setup Database

**Option A: Use Neon (Recommended - Free Cloud Database)**

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string

**Option B: Local PostgreSQL**

```bash
# Create database
createdb skillbridge

# Get connection string (usually):
# postgresql://postgres:password@localhost:5432/skillbridge
```

### Step 3: Clone & Setup Backend

```bash
cd skillbridge-backend

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Edit .env.local with your values:
# DATABASE_URL=your_connection_string
# CLERK_API_KEY=your_clerk_key
# CLERK_JWT_KEY=your_clerk_jwt_key
nano .env.local  # or open in VS Code

# Initialize database schema
npm run migrate

# Start development server
npm run dev
```

Backend runs on `http://localhost:3001`

### Step 4: Setup Frontend

```bash
cd skillbridge-frontend

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Edit .env.local:
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
# NEXT_PUBLIC_BACKEND_URL=http://localhost:3001/api
nano .env.local

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`

## Development Workflow

### Backend Development

```bash
cd skillbridge-backend

# Run with auto-reload on file changes
npm run dev

# In another terminal, run database migrations if schema changes:
npm run migrate

# Check database directly (if using local PostgreSQL)
psql skillbridge
```

### Frontend Development

```bash
cd skillbridge-frontend

# Run with hot-reload
npm run dev

# Build for production
npm run build

# Start production build locally
npm run start
```

### Testing API Endpoints

Use any of these tools:

**cURL**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/batches
```

**Bruno/Postman**
1. Import collection from repo (if provided)
2. Set Bearer token in Authorization tab
3. Send requests

**API Testing in Frontend DevTools**
- Open browser DevTools → Network tab
- Perform actions in app
- See all API requests and responses
- Check headers and payloads

## Common Development Tasks

### Add New API Endpoint

1. Create controller in `skillbridge-backend/src/controllers/`
2. Add route in `skillbridge-backend/src/routes/index.js`
3. Add frontend hook/utility in `skillbridge-frontend/lib/`
4. Create component in `skillbridge-frontend/components/`

### Add New Database Table

1. Edit `skillbridge-backend/src/db/init.js`
2. Run `npm run migrate` in backend
3. Update TypeScript types if using them

### Update Authentication Flow

1. Modify `skillbridge-backend/src/middleware/auth.js`
2. Update `skillbridge-frontend/lib/auth.js`
3. Restart both servers

## Debugging

### Backend Debugging

```bash
# With more verbose logging
DEBUG=* npm run dev

# Or modify server.js to add console.log statements
```

### Frontend Debugging

1. **DevTools Console**
   - Open browser DevTools (F12)
   - Check for errors
   - Use `console.log()`

2. **Network Tab**
   - See all API calls
   - Check request/response payloads
   - Verify Authorization headers

3. **React DevTools** (Browser Extension)
   - Inspect component state
   - See prop values
   - Check render performance

### Database Debugging

```bash
# If using Neon - use their web console
# Or locally with psql:
psql skillbridge

# Common commands:
\dt                    # List tables
SELECT * FROM users;   # View data
\d users              # Show schema

# Check indexes
\di
```

## Environment Variables Explained

### Backend (.env.local)

```env
# Database connection
DATABASE_URL=postgresql://user:pass@host:port/db

# Server config
PORT=3001
NODE_ENV=development

# Clerk authentication
CLERK_API_KEY=sk_test_...           # From Clerk Dashboard
CLERK_JWT_KEY=your_jwt_key          # From Clerk API Keys

# Frontend URLs
FRONTEND_URL=http://localhost:3000  # Where frontend runs
CORS_ORIGIN=http://localhost:3000   # CORS whitelist
```

### Frontend (.env.local)

```env
# Clerk authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001/api
```

## Resetting Everything

```bash
# Backend - Reset database
rm -rf node_modules
npm install
npm run migrate  # Recreates schema

# Frontend - Fresh install
rm -rf node_modules .next
npm install
npm run build

# Or completely wipe and restart
cd skillbridge-backend
dropdb skillbridge  # Delete local DB
createdb skillbridge
npm run migrate
```

## Running on Different Ports

**Backend on port 3002:**
```bash
PORT=3002 npm run dev
```

**Frontend on port 3001:**
```bash
npm run dev -- -p 3001
```

Update `NEXT_PUBLIC_BACKEND_URL` accordingly.

## Production Build Locally

```bash
# Backend
cd skillbridge-backend
npm run build  # (if added to package.json)
NODE_ENV=production npm start

# Frontend
cd skillbridge-frontend
npm run build
npm run start
```

## Useful Commands Reference

| Task | Command |
|------|---------|
| Start backend dev | `cd skillbridge-backend && npm run dev` |
| Start frontend dev | `cd skillbridge-frontend && npm run dev` |
| Initialize DB | `cd skillbridge-backend && npm run migrate` |
| Open DB console | `psql skillbridge` |
| View backend logs | `npm run dev` (check terminal) |
| View API requests | DevTools → Network tab |
| Check dependencies | `npm list` |
| Update dependencies | `npm update` |
| Check Node version | `node --version` |

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port
lsof -ti:3001 | xargs kill -9
```

### Clerk Webhook Not Working

1. In Clerk Dashboard → Webhooks
2. Check endpoint URL (must be public, not localhost)
3. For testing locally, use ngrok:
   ```bash
   ngrok http 3001
   # Use ngrok URL in Clerk webhook settings
   ```

### Database Connection Refused

- Check if PostgreSQL/Neon is running
- Verify CONNECTION_STRING is correct
- Check firewall rules
- Try: `psql $DATABASE_URL` to test

### Environment Variables Not Loading

- Ensure file is named `.env.local` (not `.env`)
- Restart server after editing .env
- Check for spaces: `KEY=value` (no spaces around `=`)

### Clerk Token Invalid

- Check expiration time (tokens expire)
- Verify CLERK_API_KEY is correct
- Check network requests in DevTools

## Next Steps

After getting the system running:

1. **Create test users** - Sign up as each role
2. **Run complete workflow** - Create batch → invite student → create session → mark attendance
3. **Check API responses** - DevTools Network tab
4. **Review database** - `psql skillbridge` and inspect data
5. **Explore code** - Read through controllers and routes
6. **Make modifications** - Try adding a feature

## Need Help?

1. Check this guide again
2. Review main README.md
3. Check backend/frontend .env.example files
4. Look at console/terminal output for error messages
5. Verify all prerequisites are installed
6. Try restarting both servers

---

**Happy developing!**
