# Placement Nexus — API Conventions

These conventions apply to every endpoint built from Phase 2 onward. Consistency here matters more than any individual choice.

## 1. Base URL & Versioning

```
/api/v1/...
```
Versioned from day one so a future breaking change (`/api/v2/...`) never disrupts existing clients.

## 2. Resource Naming

- Plural nouns: `/api/v1/students`, `/api/v1/placement-drives`, `/api/v1/assessments`
- Nested resources reflect real ownership: `/api/v1/students/:studentId/projects`
- Actions that aren't pure CRUD use a verb sub-path: `/api/v1/applications/:id/withdraw`, `/api/v1/recruiters/:id/approve`

## 3. HTTP Methods

| Method | Use |
|---|---|
| GET | Read (list or single resource) |
| POST | Create, or a non-idempotent action (e.g. `/approve`) |
| PATCH | Partial update |
| PUT | Not used — PATCH covers all update cases in this project |
| DELETE | Delete (soft-delete preferred for anything audit-relevant) |

## 4. Standard Response Envelope

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "pageSize": 20, "total": 143 }
}
```
`meta` only appears on paginated list endpoints.

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "cgpa must be between 0 and 10",
    "details": [ { "field": "cgpa", "issue": "out of range" } ]
  }
}
```

Never return raw stack traces or Prisma error objects to the client — the centralized error handler middleware (Phase 19, but wired minimally from Phase 2) maps internal errors to safe, generic messages.

## 5. Standard Error Codes

```
VALIDATION_ERROR        400
UNAUTHORIZED             401
FORBIDDEN                403
NOT_FOUND                404
CONFLICT                 409   (e.g. duplicate application)
RATE_LIMITED              429
INTERNAL_ERROR            500
```

## 6. Authentication

- `Authorization: Bearer <accessToken>` header on every protected route
- Access tokens: short-lived JWT (15 min)
- Refresh tokens: longer-lived, stored hashed in `User.refreshTokenHash`, rotated on every use
- Public routes (no auth): `/auth/register`, `/auth/login`, `/auth/verify-otp`, `/auth/forgot-password`, `/auth/reset-password`, `/health`

## 7. Authorization (RBAC)

Every protected route declares which role(s) may access it via middleware, e.g.:
```ts
router.post('/placement-drives', requireAuth, requireRole('RECRUITER'), requireVerified, createDriveController)
```
Ownership checks (e.g. "can this recruiter edit *this* drive") happen inside the service layer, not just role-checking — a valid RECRUITER token alone is never sufficient to touch another recruiter's data.

## 8. Pagination

Query params on all list endpoints:
```
?page=1&pageSize=20&sortBy=createdAt&sortOrder=desc
```
Defaults: `page=1`, `pageSize=20`, max `pageSize=100`.

## 9. Filtering

Query params, resource-specific, e.g.:
```
GET /api/v1/students?branch=CSE&minCgpa=8.0&graduationYear=2026
```

## 10. Validation

Every request body is validated with a Zod schema **before** it reaches the controller logic — validation failures short-circuit at the middleware layer and never reach the service.

## 11. Health Checks (Phase 1 deliverable)

```
GET /api/v1/health          → { status: "ok", uptime, timestamp }
GET /api/v1/health/db       → verifies Postgres connectivity
```

## 12. AI Service Boundary

The Node backend never calls the AI (FastAPI) service directly from a controller — always through a dedicated service (`aiService.ts`) that:
1. Calls FastAPI over HTTP
2. Maps FastAPI's response into the Node domain shape
3. Tags the result `isAiGenerated: true` before it ever reaches the frontend

This keeps the AI service swappable without touching controllers/routes.
