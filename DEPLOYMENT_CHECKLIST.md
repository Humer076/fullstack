# Deployment Checklist & Verification Guide

## Pre-Deployment Setup (Do These First)

### Clerk Setup
- [ ] Create account at [clerk.com](https://clerk.com)
- [ ] Create new application
- [ ] Copy **Publishable Key** to frontend `.env.local`
- [ ] Copy **API Key** to backend `.env.local`
- [ ] Copy **JWT Key** to backend `.env.local`
- [ ] Add Vercel domain to Clerk Redirect URLs
- [ ] Setup webhook to your backend's `/api/users/sync`

### Database Setup
- [ ] Create account at [neon.tech](https://neon.tech)
- [ ] Create new PostgreSQL project
- [ ] Copy connection string to backend `.env.local`
- [ ] Run `npm run migrate` in backend to initialize schema

### GitHub Setup
- [ ] Initialize git: `git init`
- [ ] Add all files: `git add .`
- [ ] First commit: `git commit -m "Initial: SkillBridge attendance system"`
- [ ] Push to GitHub: `git push origin main`

## Local Testing (Before Deploying)

### Backend Verification
```bash
cd skillbridge-backend
npm install
npm run migrate  # Should succeed with schema created
npm run dev      # Should show server running on port 3001
```

Check:
- [ ] No errors in terminal
- [ ] Server listens on 3001
- [ ] Database tables created (check Neon console)

### Frontend Verification
```bash
cd skillbridge-frontend
npm install
npm run dev      # Should show app running on port 3000
```

Check:
- [ ] No build errors
- [ ] Landing page loads
- [ ] "Sign In" and "Sign Up" buttons visible
- [ ] Browser DevTools show no console errors

### Manual Testing Flow
1. [ ] Sign up as Student
2. [ ] Complete onboarding, select role "Student"
3. [ ] Get redirected to Student Dashboard
4. [ ] Sign up another account as Trainer
5. [ ] Create a Batch
6. [ ] Generate Invite Link (copy it)
7. [ ] Sign out
8. [ ] Sign in as Student
9. [ ] Try to join batch with invite link
10. [ ] Sign in as Trainer
11. [ ] Create a Session for that batch
12. [ ] Sign in as Student
13. [ ] Mark attendance for the session
14. [ ] Sign in as Trainer
15. [ ] Verify attendance was recorded
16. [ ] Check batch summary

## Deployment Process

### Step 1: Deploy Backend to Railway

- [ ] Go to [railway.app](https://railway.app)
- [ ] Create account and new project
- [ ] Select "Deploy from GitHub repo"
- [ ] Select your GitHub repository
- [ ] Configure environment variables in Railway:
  - `DATABASE_URL` = your Neon connection string
  - `CLERK_API_KEY` = from Clerk
  - `CLERK_JWT_KEY` = from Clerk
  - `FRONTEND_URL` = your future Vercel URL (e.g., https://skillbridge-frontend.vercel.app)
  - `CORS_ORIGIN` = your future Vercel URL
  - `NODE_ENV` = production
  - `PORT` = 3001
- [ ] Deploy button
- [ ] Wait for deployment (2-3 minutes)
- [ ] Copy the public Railway URL (should be like https://skillbridge-backend-production.up.railway.app)

### Step 2: Update Clerk Webhook

- [ ] In Clerk Dashboard → Webhooks
- [ ] Set webhook URL to: `https://your-railway-url/api/users/sync`
- [ ] Test webhook sends correctly

### Step 3: Deploy Frontend to Vercel

- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Import your GitHub repository
- [ ] Configure environment variables:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = from Clerk
  - `NEXT_PUBLIC_BACKEND_URL` = your Railway URL + `/api` (e.g., https://skillbridge-backend-production.up.railway.app/api)
- [ ] Deploy
- [ ] Wait for deployment (2-3 minutes)
- [ ] Copy the Vercel URL

### Step 4: Configure Clerk Redirect URLs

- [ ] In Clerk Dashboard → API Keys → Settings
- [ ] Add your Vercel domain as Allowed Redirect URL
- [ ] Format: `https://your-vercel-url.vercel.app`

## Post-Deployment Verification

### Live URL Testing

Visit your Vercel frontend URL:
- [ ] Landing page loads
- [ ] "Sign Up" button works
- [ ] Can complete signup process
- [ ] Get redirected to dashboard
- [ ] Dashboard shows actual data (not errors)
- [ ] Open DevTools → Network tab
- [ ] Perform an action (e.g., mark attendance)
- [ ] Verify API call to Railway backend succeeds (200-201 status)

### Create Live Test Account

1. [ ] Sign up new account as "Institution"
2. [ ] Verify user created in system
3. [ ] Sign out and sign back in
4. [ ] Verify role is correct
5. [ ] Create a batch
6. [ ] Verify batch appears in database (check Neon console)
7. [ ] Generate invite link
8. [ ] Copy link, share in browser
9. [ ] Open in incognito window
10. [ ] Sign up as "Student"
11. [ ] Paste invite link
12. [ ] Join batch
13. [ ] Verify student appears in batch (back as Institution)

### Data Verification

In Neon console:
```sql
-- Should have users
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Should have batches
SELECT COUNT(*) FROM batches;

-- Should have attendance records
SELECT status, COUNT(*) FROM attendance GROUP BY status;
```

## Common Deployment Issues & Fixes

### Issue: "Connection refused" on API calls
**Fix**: 
- [ ] Verify NEXT_PUBLIC_BACKEND_URL in Vercel env matches Railway URL
- [ ] Verify CORS_ORIGIN in Railway matches Vercel domain
- [ ] Restart both deployments

### Issue: Clerk auth not working
**Fix**:
- [ ] Verify NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY matches Clerk
- [ ] Verify Vercel domain added to Clerk Redirect URLs
- [ ] Clear browser cache and cookies
- [ ] Restart frontend

### Issue: "Database connection error"
**Fix**:
- [ ] Verify DATABASE_URL in Railway is correct
- [ ] Check Neon project is active
- [ ] Run schema init if not already done
- [ ] Test connection: `psql $DATABASE_URL` locally

### Issue: "User not found" after signup
**Fix**:
- [ ] Check Clerk webhook is configured correctly
- [ ] Verify webhook endpoint is `/api/users/sync`
- [ ] Check webhook is receiving requests (Clerk Dashboard → Webhooks → Logs)
- [ ] May need to manually call sync endpoint

## Submission Prep

### Create Submission Folder

1. [ ] Create Google Drive folder: "SkillBridge-YourName"
2. [ ] Share with maria@sustainablelivinglab.org
3. [ ] Add file with:
   - Frontend URL: https://...
   - Backend URL: https://...
   - Test credentials (if any)
   - Notes on what's working/partial
   - Time spent
   - Any known issues

### README Quality Check

Before submitting, verify README has:
- [ ] Clear setup instructions
- [ ] API documentation
- [ ] Deployment guide
- [ ] Troubleshooting section
- [ ] Architecture explanation
- [ ] All live URLs

### Code Quality Check

Before submitting:
- [ ] No console errors in frontend
- [ ] No unhandled errors in backend logs
- [ ] All 5 roles can access their dashboards
- [ ] API endpoints return proper status codes
- [ ] Database schema is correct
- [ ] Code is readable with comments

## Live URL Template for Submission

```
SkillBridge Attendance Management System

Frontend: https://skillbridge-frontend-yourname.vercel.app
Backend: https://skillbridge-backend-production.up.railway.app
Database: PostgreSQL on Neon (connection details: see Railway dashboard)

Deployed: [DATE]
Status: Working / Partial / Known Issues

Features Completed:
✓ All 5 roles (Student, Trainer, Institution, Manager, Officer)
✓ Batch management with invite links
✓ Session creation and attendance marking
✓ Role-based dashboards
✓ Attendance reporting and summaries
✓ Server-side RBAC on all endpoints

Test Credentials:
[Create a test user account for them to try]

Known Limitations:
[List any incomplete features]

Time Spent: [hours]

Notes: [Any additional info]
```

## Timeline

| Task | Time | Status |
|------|------|--------|
| Clone repo & setup | 5 min | [ ] |
| Local testing | 15 min | [ ] |
| Backend deployment | 10 min | [ ] |
| Frontend deployment | 10 min | [ ] |
| Live testing | 10 min | [ ] |
| Documentation review | 5 min | [ ] |
| **Total** | **~45 min** | [ ] |

---

**You're ready to deploy!** Following this checklist should take ~1 hour from start to live URLs.
