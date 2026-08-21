# Placement Nexus — Folder Structure (target for Phase 1 scaffolding)

This is the structure Phase 1 will actually create. Documented now so the schema/conventions above map cleanly onto real folders.

```
placement-nexus/
├── frontend/
│   ├── src/
│   │   ├── components/          # shared, reusable UI (Button, Card, Modal...)
│   │   ├── pages/                # route-level pages
│   │   │   ├── student/
│   │   │   ├── recruiter/
│   │   │   ├── officer/
│   │   │   └── alumni/
│   │   ├── layouts/              # role-specific shells (StudentLayout, RecruiterLayout...)
│   │   ├── routes/                # React Router config
│   │   ├── services/               # Axios API call wrappers, one file per domain
│   │   │   ├── authService.ts
│   │   │   ├── studentService.ts
│   │   │   ├── driveService.ts
│   │   │   └── ...
│   │   ├── hooks/                  # custom hooks (useAuth, useReadiness...)
│   │   ├── context/                 # Context API / Zustand stores
│   │   ├── utils/
│   │   ├── constants/
│   │   └── assets/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/                  # one file per resource
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rbac.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   └── errorHandler.middleware.ts
│   │   ├── validation/                 # Zod schemas
│   │   ├── utils/
│   │   ├── config/                       # env loading, constants
│   │   └── app.ts / server.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── tests/
│   └── package.json
│
├── ai-service/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   ├── services/                    # resume parsing, ATS scoring, chatbot logic
│   │   ├── models/                       # Pydantic schemas
│   │   └── utils/
│   ├── tests/
│   └── requirements.txt
│
├── docker-compose.yml
├── .github/
│   └── workflows/                       # GitHub Actions (added Phase 19)
├── .gitignore
└── README.md
```

## Notes

- Each of `frontend/`, `backend/`, `ai-service/` gets its **own** `package.json` / `requirements.txt` — they are independently runnable during development, only combined via Docker Compose later.
- `backend/prisma/schema.prisma` is where the Phase 0 schema (delivered separately) will actually live once Phase 1 scaffolds the repo.
- Role-specific frontend folders (`pages/student`, `pages/recruiter`, etc.) prevent one giant shared page tree from becoming unmanageable, while `components/` stays flat and shared to avoid duplicating buttons/cards/inputs per role.
