# SkillBridge API - Quick Reference

## Base URL
- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-backend-url/api`

## Authentication
All endpoints require Bearer token:
```
Authorization: Bearer <clerk_jwt_token>
```

## Response Format
Success (2xx):
```json
{
  "message": "Success",
  "data": { ... }
}
```

Error (4xx/5xx):
```json
{
  "error": "Error type",
  "message": "Error description",
  "details": "Additional info"
}
```

## User Endpoints

### POST /users/sync
Create or update user (Clerk webhook)
```
Body: {
  "clerkUserId": "string",
  "name": "string",
  "email": "string",
  "role": "student|trainer|institution|programme_manager|monitoring_officer",
  "institutionId": 1  // optional
}
```

### GET /users/me
Get current user profile
```
Response: { user: { id, name, email, role, institution_id } }
```

## Batch Endpoints

### POST /batches
Create batch (Trainer/Institution)
```
Body: { "name": "string" }
```

### GET /batches
List batches for user
```
Response: { batches: [...] }
```

### GET /batches/:batchId
Get batch details with trainers/students
```
Response: { batch: { id, name, trainers[], students[], studentCount } }
```

### POST /batches/:batchId/invite
Generate batch invite link (Trainer)
```
Body: { "maxUses": 10 } // optional
Response: { inviteLink: "url", token: {...} }
```

### POST /batches/join
Join batch with invite token (Student)
```
Body: { "token": "uuid" }
Response: { batch: { id, name } }
```

## Session Endpoints

### POST /sessions
Create session (Trainer)
```
Body: {
  "batchId": 1,
  "title": "string",
  "description": "string", // optional
  "date": "YYYY-MM-DD",
  "startTime": "HH:MM",
  "endTime": "HH:MM"
}
```

### GET /sessions/student
Get student's sessions
```
Response: { sessions: [...] }
```

### GET /sessions/trainer
Get trainer's sessions
```
Response: { sessions: [...] }
```

### GET /sessions/:sessionId
Get session details with attendance
```
Response: {
  session: {...},
  attendance: [{ student_id, status, marked_at, name }],
  enrolledStudents: [...]
}
```

## Attendance Endpoints

### POST /attendance/mark
Mark attendance for session
```
Body: {
  "sessionId": 1,
  "studentId": 1,  // optional if student marking own
  "status": "present|absent|late"
}
Response: { attendance: { id, status, marked_at } }
```

### GET /sessions/:sessionId/attendance
Get attendance for session (Trainer)
```
Response: { attendance: [...] }
```

## Reporting Endpoints

### GET /batches/:batchId/summary
Batch attendance summary
```
Response: {
  batch: { id, name },
  summary: {
    total_students,
    total_sessions,
    total_present,
    total_absent,
    total_late,
    attendance_rate
  },
  sessionBreakdown: [...]
}
```

### GET /institutions/:institutionId/summary
Institution summary (Institution/Manager/Officer)
```
Response: {
  institution: { id, name },
  summary: {...},
  batchSummary: [...]
}
```

### GET /programme/summary
Programme-wide summary (Manager/Officer)
```
Response: {
  summary: {
    total_institutions,
    total_trainers,
    total_students,
    total_batches,
    total_sessions,
    total_present,
    total_absent,
    total_late,
    attendance_rate
  },
  institutionWise: [...]
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden (role not permitted) |
| 404 | Not Found |
| 500 | Server Error |

## Common Errors

| Error | Fix |
|-------|-----|
| "Missing or invalid authorization header" | Add `Authorization: Bearer token` |
| "Unauthorized" | Token invalid or expired |
| "Forbidden" | Role not permitted for this action |
| "User not found" | User hasn't synced - call `/users/sync` |
| "Invalid role" | Use valid role value |

## Sample Requests

### Create Batch (as Trainer)
```bash
curl -X POST http://localhost:3001/api/batches \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Batch A"}'
```

### Mark Attendance (as Student)
```bash
curl -X POST http://localhost:3001/api/attendance/mark \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": 1,
    "status": "present"
  }'
```

### Get Programme Summary (as Manager)
```bash
curl -X GET http://localhost:3001/api/programme/summary \
  -H "Authorization: Bearer TOKEN"
```

---

For detailed information, see [README.md](README.md)
