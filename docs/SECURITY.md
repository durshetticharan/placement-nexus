# Placement Nexus — Security Documentation

## Authentication

- **Registration** requires email + password (min 8 chars, at least one digit). Role-specific required fields are validated by Zod.
- **OTP email verification** is required before login. STUDENT and PLACEMENT_OFFICER accounts become ACTIVE on OTP verification. RECRUITER and ALUMNI accounts additionally require Placement Officer approval.
- **Login** uses bcrypt password comparison (10 salt rounds). Returns a short-lived JWT access token (15 min) and a longer-lived refresh token (7 days).
- **Forgot password** returns the same response regardless of whether the email is registered — preventing user enumeration.

## Authorization (RBAC)

All protected routes require a valid `Authorization: Bearer <accessToken>` header.

| Role               | Scope                                                        |
|--------------------|--------------------------------------------------------------|
| `STUDENT`          | Own profile, resume, assessments, career, applications, AI   |
| `RECRUITER`        | Own company's drives, applications, analytics (company-scoped)|
| `ALUMNI`           | Own profile, referrals, mentorship, resources                |
| `PLACEMENT_OFFICER`| Platform-wide administration, approvals, analytics           |

Route-level guards: `requireAuth` → `requireRole(...)` → optional `requireVerifiedRecruiter` or `requireVerifiedAlumni`.

## IDOR Prevention

Every object-level operation performs server-side ownership checks:

- Students can only access their own profile, resume, applications, notifications, AI sessions, etc.
- Recruiters are scoped to their own company — cannot access another company's drives, applications, or candidate data.
- Alumni can only modify their own profile, referral opportunities, and mentorship requests.
- Notifications: `markAsRead` uses `userId` from JWT — not from request body — preventing cross-user marking.
- Analytics: role-scoped endpoints reject cross-role access with 403.

## Company Isolation

Recruiter analytics, drive management, and application access are always filtered by `companyId` derived from the authenticated recruiter's profile — never from a request parameter.

## Secret Management

| Secret              | Location           | Notes                                        |
|---------------------|--------------------|----------------------------------------------|
| `JWT_ACCESS_SECRET` | Backend `.env`     | 64-hex chars, never committed                |
| `JWT_REFRESH_SECRET`| Backend `.env`     | Must differ from access secret               |
| `DATABASE_URL`      | Backend `.env`     | Never logged or returned in API responses    |
| `AI_INTERNAL_KEY`   | Both `.env` files  | Service-to-service auth; never in frontend   |
| `AI_GEMINI_API_KEY` | AI service `.env`  | Server-side only; never exposed to frontend  |
| `POSTGRES_PASSWORD` | Compose `.env`     | Never hardcoded in docker-compose.yml        |

See `.env.example` files for the full variable list.

## File Upload Safety

- Only PDF files are accepted for resume upload (MIME type + extension check).
- File size limit: 5 MB (enforced by Multer in the backend and by the AI service).
- Filenames are sanitized against path traversal: `path.basename()` + non-alphanumeric character replacement.
- Uploaded files are stored in `uploads/resumes/` — outside the web root; not executable.
- Static file serving uses `express.static` with directory listing disabled (`index: false`).

## URL Safety

Resource submissions validate external URLs:
- Must start with `http://` or `https://`
- Reject `javascript:`, `data:`, `vbscript:`, `file:` schemes
- The backend does not perform server-side fetches of user-submitted URLs (no SSRF surface)

## AI Security

- The FastAPI AI service is internal — not exposed to the frontend.
- All AI endpoints require `X-Internal-Key` header (set from `AI_INTERNAL_KEY` env var).
- AI API keys (e.g., Gemini) are server-side only — never in frontend bundles.
- Input text is truncated to 20,000 characters before passing to providers.
- AI output is advisory — it never mutates eligibility, readiness, job match, or application state.
- In mock mode (`AI_PROVIDER=mock`), no external calls are made.

## Logging

Production logs (pino-http) contain:
- Request ID, method, URL, remote address, status code
- No request body, no authorization headers, no passwords

`emailService.ts` logs OTP/reset tokens to stdout in development mode. In production, these should be replaced with a real email provider (Nodemailer/SES/SendGrid).

## Rate Limiting

| Scope          | Window  | Limit | Notes                        |
|----------------|---------|-------|------------------------------|
| Global         | 15 min  | 500   | All routes                   |
| Auth endpoints | 15 min  | 20    | Login, register, OTP, reset  |
| AI endpoints   | 1 min   | 10    | Per IP — expensive operations|

Rate limits are disabled in `NODE_ENV=test`.

## CORS

Allowed origins are configured via `CORS_ORIGIN` environment variable (comma-separated). Wildcard CORS (`*`) is never used with `credentials: true`. In production, set `CORS_ORIGIN` to the exact deployed frontend URL.

## Security Headers (Helmet)

In production (`NODE_ENV=production`):
- Content-Security-Policy: restricts script/style/connect sources to `'self'`
- HSTS: `max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (nginx layer)
- Referrer-Policy: `strict-origin-when-cross-origin`

## Error Handling

In production, internal 500 errors return only:
```json
{ "success": false, "error": { "code": "INTERNAL_ERROR", "message": "An unexpected internal error occurred." } }
```
Stack traces, DB internals, and filesystem paths are logged server-side only and never returned to clients.

## Incident Response (Basic)

1. **Suspected credential leak**: Rotate all JWT secrets and the AI internal key immediately. This invalidates all active sessions.
2. **Suspected DB compromise**: Rotate `DATABASE_URL` password, review Prisma audit logs.
3. **Suspicious account activity**: Use officer admin to SUSPEND the account. Revoke refresh token via `updateUser({ refreshTokenHash: null })`.
4. **Dependency vulnerability**: Run `npm audit` in `backend/`, assess severity, update specific package, re-run tests.

## Dependency Security

Known findings from Phase 19 audit:
- `deepmerge-ts < 8.0.0` (via prisma): **high** (stack exhaustion on recursive object graphs) — affects dev tooling only (Prisma CLI), not runtime request handling. Monitor for Prisma updates.
- `qs` moderate vulnerabilities: present in a transitive dependency. Not directly exploitable via the current API surface (all input validated by Zod before reaching qs). Monitor npm advisory.

Run `cd backend && npm audit` periodically to check for updates.
