# Placement Nexus — Phase 0: Architecture & Database Design

## 1. Domain Model Summary

The schema is organized into 10 domains, matching the master spec:

| Domain | Key Tables | Purpose |
|---|---|---|
| Identity & Auth | `users`, `placement_officers` | Single `User` table with a `role` enum; each role has exactly one optional profile table |
| Student | `students`, `student_academics`, `skills`, `student_skills`, `projects`, `internships`, `certifications`, `achievements`, `coding_profiles`, `professional_profiles`, `resumes` | Everything student-owned |
| Assessment Engine | `assessments`, `questions`, `question_options`, `assessment_attempts`, `answers`, `assessment_results` | One reusable engine for Aptitude/Technical/Coding — not three separate systems |
| Career & Readiness | `career_paths`, `career_skill_requirements`, `student_career_goals`, `skill_gaps`, `learning_resources`, `learning_paths`, `learning_progress`, `readiness_scores` | The Skill Gap → Learning → Readiness loop |
| Companies & Recruiters | `companies`, `company_verifications`, `recruiters` | Recruiter-side identity + trust |
| Placement Drives | `placement_drives`, `drive_requirements`, `applications`, `interviews`, `selections` | The recruitment funnel |
| Alumni Core | `alumni_profiles`, `alumni_verifications` | Verified alumni identity |
| Alumni Features | `referral_opportunities`, `referral_requests`, `referrals`, `drive_experiences`, `experience_rounds`, `drive_resources`, `mentorship_requests`, `mentorship_sessions`, `mock_interviews`, `mock_interview_feedback` | Referrals, experiences, resources, mentorship |
| Notifications | `notifications`, `notification_preferences` | In-app + email, extensible to more channels |
| Audit & AI | `audit_logs`, `resume_analyses`, `career_recommendations` | Trust/traceability + explicitly-flagged AI output |

## 2. Key Design Decisions & Reasoning

### 2.1 One `User` table, role-specific profile tables
Rather than separate login systems per role, every account is a `User` row with `role` + one matching profile (`Student`, `Recruiter`, `PlacementOfficer`, or `AlumniProfile`). This keeps auth logic (login, JWT, password reset) written once, while each role's actual data lives in its own table.

### 2.2 Eligibility, Job Match, and Readiness are never merged
Per Section 11 of the master spec, these live as genuinely separate values:
- **Eligibility** — a boolean computed at application time from `DriveRequirement` vs student academic/skill data (no dedicated table — it's a computed check, cached as `Application.eligibleAtApply`)
- **Job Match** — a percentage, cached per-application as `Application.jobMatchPct`
- **Readiness** — its own first-class table, `ReadinessScore`, scoped to overall / career-path / specific-drive via nullable foreign keys, carrying a `breakdown` JSON of strengths/weaknesses/priorities

No table or API response is allowed to collapse these into one number.

### 2.3 Skill Gap carries evidence, not just a label
`SkillGap.contributingFactors` (JSONB) stores the assessment %, coding activity level, and weak topics that justify the `gapLevel` — matching the "DSA = 48%, weak topics: Graphs, Trees, DP" pattern from Section 8. Nothing is a bare "Weak" label without justification.

### 2.4 Generic `CodingProfile`, not one table per platform
`CodingProfile.platform` is a string ("GITHUB", "LEETCODE", etc.) with a JSONB `statistics` field whose shape varies by platform. Adding a new platform (say, Codewars) later requires zero schema changes — just a new `platform` value and sync adapter.

### 2.5 Alumni verification gates real capabilities, enforced at the service layer
The database records `AlumniVerification.status`, but nothing in the schema itself blocks an unverified alumnus from creating a `ReferralOpportunity` — Postgres constraints can't easily express "only if a related row's status = APPROVED." This check belongs in the **service layer** (Phase 14), not the DB. Documenting this now so it isn't forgotten later.

### 2.6 Referral integrity
Students request referrals (`ReferralRequest`); only when an alumnus takes explicit action does a `Referral` audit row get created. A student can never fabricate "I was referred" — that row only exists if the alumnus created it.

### 2.7 Snapshot fields on `Application`
`jobMatchPct` and `eligibleAtApply` are stored at application time, not recomputed live every time a recruiter views an application. Job requirements or student skills can change after applying — recruiters should see what was true when the student applied, with the ability to recompute freshly if needed (a service-layer method, not a schema concern).

### 2.8 File storage abstraction
No file's binary content is ever stored in Postgres. `Resume`, `Certification`, `DriveResource`, etc. store only a `fileUrl` (a reference into whatever storage backend — local disk in dev, S3/R2/Cloudinary in production) plus metadata (`fileName`, `fileSizeBytes`). Swapping storage providers later never touches the schema.

### 2.9 JSONB used sparingly, only where structure is genuinely variable
JSONB appears in exactly these places, all deliberate:
- `CodingProfile.statistics` — shape varies per platform
- `SkillGap.contributingFactors`, `ReadinessScore.breakdown` — explanation payloads, not queried by structure
- `AssessmentResult.topicBreakdown` — dynamic set of topics per assessment
- `AuditLog.metadata`, `Notification.metadata` — free-form context per event type
- `NotificationPreference.typeOverrides` — avoids one column per notification type

Everything else uses proper relational columns and foreign keys — JSONB is not a substitute for schema design here.

### 2.10 Audit logging
`AuditLog` is a single generic table (`action`, `entityType`, `entityId`, `metadata`) rather than a bespoke table per auditable event, so new auditable actions (Section 38's list) never require a migration.

## 3. Backend Layering Convention (applies from Phase 1 onward)

```
Route          → defines the endpoint + HTTP method, wires middleware, calls controller
Middleware     → auth (JWT verify), RBAC (role check), validation (Zod), rate limiting
Controller     → parses request, calls service, shapes HTTP response — NO business logic, NO Prisma calls
Service        → business logic, orchestrates repositories, computes derived values (readiness, job match, etc.)
Repository     → the ONLY layer that calls Prisma directly
Prisma         → schema + generated client
```

Rule of thumb: if you're tempted to `import prisma` in a controller, stop — it belongs in a repository, accessed through a service.

## 4. What Phase 0 deliberately does NOT include

- No actual React/Express/FastAPI project scaffolding (that's Phase 1)
- No seed data beyond what's needed to sanity-check the schema
- No auth logic implementation (Phase 2)
- No API endpoints implemented yet — only conventions defined (see `API_CONVENTIONS.md`)

## 5. What to verify once you run this locally

1. `npx prisma format` — auto-formats the schema file
2. `npx prisma validate` — checks schema correctness (this requires internet access to fetch Prisma's engine binaries — it works fine on your machine, just not in Claude's sandboxed test environment)
3. `npx prisma migrate dev --name init` — creates the actual Postgres tables from this schema
4. `npx prisma studio` — visually browse the newly created (empty) tables to confirm structure looks right
