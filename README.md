# SkillBridge - Full-Stack Attendance Management System

## Live URLs
- **Frontend (Vercel)**: https://humer076-fullstack.vercel.app
- **Backend (Render)**: https://skillbridge-backend-5v6a.onrender.com
- **API Health Check**: https://skillbridge-backend-5v6a.onrender.com/health

## Test Accounts
*Note: Since Clerk handles authentication securely, these accounts must be registered via the Sign-Up page if they do not already exist in your Clerk dashboard. The dummy data is already populated in the PostgreSQL database.*

1. **Student** 
   - Email: `student@example.com`
   - Password: `Password123!` (Example - please register this on the live site)
2. **Trainer**
   - Email: `trainer@example.com`
   - Password: `Password123!`
3. **Institution**
   - Email: `inst@example.com`
   - Password: `Password123!`
4. **Programme Manager**
   - Email: `manager@example.com`
   - Password: `Password123!`
5. **Monitoring Officer**
   - Email: `officer@example.com`
   - Password: `Password123!`

## Deployment Documentation
- **Frontend**: Deployed successfully to Vercel via native GitHub integration.
- **Backend**: Deployed successfully to Render as a Web Service using `render.yaml`.
- **Database**: Hosted securely on Neon (Serverless PostgreSQL).
- **Authentication**: Managed via Clerk.

## Setup Instructions for Reviewers
The system is fully deployed and operational. The backend is configured with dynamic CORS to accept requests exclusively from the Vercel domain. To view the populated dashboards, log in with the respective role accounts. If an account is missing from Clerk, simply sign up with the emails listed above, select your role, and the system will automatically sync your user data to the database and link it to the seeded batches and sessions!
