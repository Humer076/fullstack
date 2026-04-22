# SkillBridge - Attendance Management System

A production-ready, full-stack attendance management system for the SkillBridge state-level skilling programme. Built with Next.js, Express.js, PostgreSQL, and Clerk authentication.

## System Overview

SkillBridge is a role-based attendance management platform serving 5 distinct user types:

| Role | Responsibilities |
|------|------------------|
| **Student** | Mark own attendance, view assigned sessions |
| **Trainer** | Create sessions, manage batches, generate batch invites, view attendance |
| **Institution** | Manage trainers and batches, view batch attendance summaries |
| **Programme Manager** | Oversee all institutions, view programme-wide metrics |
| **Monitoring Officer** | Read-only access across entire programme |

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Clerk** - Authentication & authorization
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications
- **Custom CSS** - Clean, responsive styling (no external CSS framework)

### Backend
- **Express.js** - Node.js web framework
- **PostgreSQL** - Primary database
- **Clerk Backend SDK** - Token verification
- **UUID** - Token generation
- **CORS** - Cross-origin resource sharing

### Deployment
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Neon (PostgreSQL)
- **Auth**: Clerk

## Project Structure

```
skillbridge/
├── skillbridge-backend/          # Express.js API server
│   ├── src/
│   │   ├── db/                   # Database config and initialization
│   │   ├── middleware/           # Auth, RBAC, error handling
│   │   ├── controllers/          # Business logic for each entity
│   │   ├── routes/               # API route definitions
│   │   └── server.js             # Express app setup
│   ├── package.json
│   └── .env.example
│
└── skillbridge-frontend/         # Next.js frontend application
    ├── app/
    │   ├── (auth)/               # Sign in/up pages
    │   ├── dashboard/            # Role-specific dashboards
    │   ├── layout.js             # Root layout with Clerk provider
    │   ├── page.js               # Landing page
    │   ├── onboard.js            # Role selection onboarding
    │   └── globals.css           # Global styles
    ├── lib/
    │   ├── api.js                # API client with auth
    │   └── auth.js               # Auth utilities
    ├── components/               # Reusable UI components
    ├── package.json
    └── .env.example
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database (we'll use Neon for free)
- Clerk account (free tier available)

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd skillbridge
```

### 2. Backend Setup

#### 2a. Install Dependencies
```bash
cd skillbridge-backend
npm install
```

#### 2b. Configure Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
DATABASE_URL=postgresql://user:password@host:5432/skillbridge
PORT=3001
NODE_ENV=development
CLERK_API_KEY=your_clerk_api_key
CLERK_JWT_KEY=your_clerk_jwt_key
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

#### 2c. Initialize Database
```bash
npm run migrate
```

This creates all required tables with proper relationships and indexes.

#### 2d. Start Development Server
```bash
npm run dev
```

Backend will run on `http://localhost:3001`

### 3. Frontend Setup

#### 3a. Install Dependencies
```bash
cd ../skillbridge-frontend
npm install
```

#### 3b. Configure Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001/api
```

#### 3c. Start Development Server
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## API Documentation

### Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <clerk_jwt_token>
```

The backend verifies the token with Clerk and fetches the user's role from the database for RBAC.

### Core Endpoints

#### User Management
- `POST /api/users/sync` - Sync/create user from Clerk (webhook)
- `GET /api/users/me` - Get current user profile

#### Batch Management
- `POST /api/batches` - Create batch (Trainer/Institution)
- `GET /api/batches` - Get user's batches
- `GET /api/batches/:batchId` - Get batch details
- `POST /api/batches/:batchId/invite` - Generate invite link (Trainer)
- `POST /api/batches/join` - Join batch with token (Student)

#### Session Management
- `POST /api/sessions` - Create session (Trainer)
- `GET /api/sessions/student` - Get student's sessions
- `GET /api/sessions/trainer` - Get trainer's sessions
- `GET /api/sessions/:sessionId` - Get session details
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/sessions/:sessionId/attendance` - Get session attendance (Trainer)

#### Reporting
- `GET /api/batches/:batchId/summary` - Batch attendance summary
- `GET /api/institutions/:institutionId/summary` - Institution summary
- `GET /api/programme/summary` - Programme-wide summary

All endpoints validate role authorization server-side and return 403 if unauthorized.

## Database Schema

### Core Tables

**users**
- `id` - Primary key
- `clerk_user_id` - Clerk unique ID
- `name`, `email` - User info
- `role` - One of: student, trainer, institution, programme_manager, monitoring_officer
- `institution_id` - FK to institution (for trainer, student)

**batches**
- `id` - Primary key
- `name` - Batch name
- `institution_id` - FK to users (institution)

**batch_trainers** (many-to-many)
- Links trainers to batches they manage

**batch_students** (many-to-many)
- Links students to batches they're enrolled in

**sessions**
- `id` - Primary key
- `batch_id`, `trainer_id` - FKs
- `title`, `date`, `start_time`, `end_time` - Session details

**attendance**
- `id` - Primary key
- `session_id`, `student_id` - FKs
- `status` - present, absent, or late

**invite_tokens**
- Reusable batch invite links with expiry

All tables include proper indexes for query performance.

## Deployment Guide

### 1. Prepare GitHub Repository

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: SkillBridge attendance system"
git branch -M main
git remote add origin https://github.com/yourusername/skillbridge.git
git push -u origin main
```

### 2. Deploy Database (Neon)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new PostgreSQL project
3. Copy the connection string
4. Initialize schema by running `npm run migrate` locally with the Neon connection string
5. Save the `DATABASE_URL` for later

### 3. Setup Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create account
2. Create a new application
3. Copy your:
   - **Publishable Key** (frontend)
   - **API Key** (backend)
   - **JWT Key** (backend verification)
4. Configure sign-up flow to collect user role:
   - In Clerk Dashboard → User & Authentication → Sign up options
   - Add custom field for role selection during sign-up
5. Create API webhook:
   - Endpoint: `https://your-backend-url/api/users/sync`
   - Subscribe to: `user.created`, `user.updated`

### 4. Deploy Backend (Railway)

1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Select your GitHub repository
4. Configure environment variables:
   - `DATABASE_URL` (from Neon)
   - `CLERK_API_KEY`
   - `CLERK_JWT_KEY`
   - `FRONTEND_URL` (your Vercel domain)
   - `CORS_ORIGIN` (your Vercel domain)
   - `NODE_ENV=production`
5. Railway automatically deploys from main branch
6. Copy the public domain URL for the next step

### 5. Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com)
2. Import Git repository → Select your GitHub repo
3. Configure environment variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_BACKEND_URL` (your Railway backend URL + `/api`)
4. Deploy!
5. Configure Clerk to allow your Vercel domain as redirect URL

### 6. Verify Deployment

1. Visit your Vercel frontend URL
2. Click "Sign Up"
3. Complete sign-up and select role
4. Verify you're redirected to appropriate dashboard
5. Check that API calls work (open browser DevTools → Network)

## Testing the System

### Test Users to Create

1. **Student**
   - Sign up with role "Student"
   - Join a batch using invite link
   - Mark attendance for sessions

2. **Trainer**
   - Sign up with role "Trainer"
   - Create batch
   - Generate invite link
   - Create session
   - Mark attendance for students

3. **Institution**
   - Sign up with role "Institution"
   - View batches and summaries

4. **Programme Manager**
   - Sign up with role "Programme Manager"
   - View programme-wide summaries

5. **Monitoring Officer**
   - Sign up with role "Monitoring Officer"
   - View read-only reports

### Sample Workflow

```
1. Institution signs up and creates "Batch A"
2. Institution assigns Trainer to Batch A
3. Trainer generates invite link
4. Student signs up, receives link, joins Batch A
5. Trainer creates a "Session 1" for Batch A
6. Student marks attendance for Session 1
7. Trainer views attendance report for Session 1
8. Institution views Batch A summary
9. Programme Manager views all institutions
10. Monitoring Officer views programme metrics (read-only)
```

## Security Features

✅ **Server-Side RBAC** - Every endpoint validates user role on backend
✅ **Clerk JWT Verification** - Token verified with Clerk before any action
✅ **Database-Level Access Control** - Users can only access data they own
✅ **CORS Protection** - Frontend domain whitelist
✅ **Prepared Statements** - SQL injection prevention
✅ **Environment Secrets** - No hardcoded credentials

## Performance Optimizations

- Database indexes on frequently queried columns
- Connection pooling for PostgreSQL
- Lazy-loaded components on frontend
- API response caching with React Query (can be added)
- CDN delivery via Vercel

## Known Limitations & Future Improvements

### Current Version
- File uploads not implemented (profile pictures, documents)
- No email notifications
- Limited to 100 students per batch demo (can scale to millions)
- No data export/reporting export
- No bulk user import

### Suggested Next Steps
1. Add email notifications for attendance
2. Implement attendance history and analytics
3. Add bulk student import via CSV
4. Attendance-based certificates
5. Mobile app (React Native)
6. SMS notifications
7. Integration with NATS/MOSIP for identity verification

## Troubleshooting

### "Unauthorized" Error on API Calls
- Ensure Clerk token is valid and not expired
- Check NEXT_PUBLIC_BACKEND_URL matches actual backend
- Verify CORS_ORIGIN on backend matches frontend domain

### Database Connection Fails
- Verify DATABASE_URL is correct
- Check Neon project is running
- Ensure IP whitelist allows your server

### Clerk Sign-Up Redirect Issues
- Add Vercel domain to Clerk redirect URLs
- Verify NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is correct
- Check browser console for Clerk SDK errors

### Role Not Updating After Sign-Up
- Webhook may not have fired - manually call `/api/users/sync` endpoint
- Check that role is being set in Clerk metadata correctly
- Verify database user record exists with correct role

## Support & Contact

For issues or questions:
1. Check the GitHub issues
2. Review this README thoroughly
3. Verify environment variables
4. Check browser DevTools console and Network tab
5. Review backend logs: `npm run dev` shows request logs

## License

This project is created as a take-home assignment for evaluation purposes.

---

**Built with ❤️ using modern web technologies**
