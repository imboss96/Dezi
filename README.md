# Dezhub

Dezhub is a professional service-provider lifecycle platform for domestic and household staffing. It connects verified providers with clients while bringing assessment, training, certification, matching, placement, and follow-up into one operational workflow.

> **Register → Verify → Assess → Train → Certify → Match → Interview → Contract → Place → Monitor**

Dezhub is not only a job board. Its purpose is to help Dezhub staff capture provider information, verify documents, build professional capability through Dezhub Academy, and make safer, better-informed placements.

## MVP purpose

The MVP demonstrates the foundation for four user groups:

| Role | Purpose |
| --- | --- |
| Service provider | Create a professional profile, submit documents, train, certify, and receive opportunities |
| Client | Find trusted providers and manage household staffing needs |
| Assessor / Academy staff | Assess candidates and manage training work |
| Administrator | Operate users, roles, verification, recruitment, academy, finance, and settings |

Clients and service providers may register publicly. Assessors and administrators are invite-only and must be assigned by an administrator through the protected backend workflow.

## Current MVP implementation

Implemented in this repository:

- Mobile-first React, TypeScript, and Vite marketplace interface
- Fiverr-style provider discovery with search, categories, ratings, pricing, favorites, and responsive cards
- Email/password registration, sign-in, sign-out, and password reset
- Phone authentication with OTP
- Google OAuth integration point
- Client/provider role selection during public registration
- Authenticated account menu and profile workspace
- Provider profile fields for personal, next-of-kin, professional, availability, salary, skills, languages, and references
- Private provider document upload flow for identity, CV, Good Conduct, and supporting documents
- Supabase Storage document repository with `PENDING` status records
- Server-side roles for `provider`, `client`, `assessor`, and `administrator`
- Administrator-only staff invitation and role assignment APIs
- Safe resend behavior for unaccepted staff invitations
- Audit records for staff invitations and role assignments
- Fastify backend health, profile, role, and staff invitation endpoints

The remaining lifecycle modules, including assessments, academy courses, matching, interviews, contracts, placements, notifications, and payment tracking, are planned in [TODO.md](TODO.md).

## Architecture

```text
React + Vite frontend
        ↓
Fastify + TypeScript API
        ↓
Supabase Auth + PostgreSQL + Storage + Realtime
```

The frontend owns presentation and user interactions. The backend owns protected business operations and role authorization. Supabase provides authentication, relational data, private file storage, and realtime capabilities.

Sensitive operations must never rely on client-side visibility alone. Verification approval, role assignment, document review, certificate issuance, matching overrides, payments, and placement changes belong behind backend authorization and database policies.

## Repository structure

```text
src/                       React marketplace and account UI
backend/                   Fastify TypeScript API
supabase/migrations/       Database schema and security migrations
TODO.md                    MVP delivery checklist
```

## Requirements

- Node.js 20 or newer
- A Supabase project
- Supabase email and, if needed, phone/Google providers enabled

## Run the frontend

From the repository root:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

The frontend runs at `http://localhost:5173`.

Set these values in `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_API_URL=http://localhost:3000
```

## Deploy frontend and backend to Vercel

This repository is configured as one Vercel project. Vercel serves the Vite frontend at `/` and the Fastify API as a serverless function under `/api`:

```text
Frontend: https://your-app.vercel.app/
Backend:  https://your-app.vercel.app/api/
Health:   https://your-app.vercel.app/api/health
```

Import the GitHub repository into Vercel with the repository root as the project root. Add these production environment variables in **Vercel → Settings → Environment Variables**:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_API_URL=/api
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-server-only-secret-key
FRONTEND_ORIGIN=https://your-app.vercel.app
```

Set the Supabase redirect URLs to the Vercel frontend URL, including `https://your-app.vercel.app/reset-password`. Do not add `SUPABASE_SECRET_KEY` to any `VITE_` variable.

## Run the backend

In a second terminal:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

The backend runs at `http://localhost:3000`.

Set these values in `backend/.env`:

```env
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-server-only-secret-key
```

Never put `SUPABASE_SECRET_KEY` in frontend files, commit it to Git, or expose it in browser requests.

Useful checks:

```text
GET http://localhost:3000/
GET http://localhost:3000/health
```

## Supabase database setup

Open **Supabase Dashboard → SQL Editor → New query**. Run these files in order, one at a time:

```text
001_initial_schema.sql
002_provider_profile_fields.sql
003_create_profile_on_signup.sql
004_provider_documents.sql
005_provider_registration_fields.sql
006_user_roles_and_staff.sql
007_staff_invitations_and_audit.sql
```

The migrations create the profile, provider fields, private document storage, server-side roles, signup trigger, audit logs, and security policies.

## Staff workflow

1. Create the first administrator as a normal account.
2. Find the user ID under **Authentication → Users**.
3. Assign the first administrator in SQL Editor:

```sql
insert into public.user_roles (user_id, role)
values ('YOUR_AUTH_USER_ID', 'administrator')
on conflict (user_id) do update set role = 'administrator';
```

4. Sign out and sign back in.
5. Open **Account → Invite staff**.
6. Invite an assessor or administrator by email.

Accepted users cannot be invited again. Use role assignment for an existing account; pending invitations can be resent from the staff UI.

## Backend API

All protected endpoints require:

```http
Authorization: Bearer <supabase-access-token>
```

Available endpoints:

```text
GET  /health
GET  /v1/me
GET  /v1/roles/me
POST /v1/profiles
POST /v1/roles                 administrator only
POST /v1/staff/invitations     administrator only
```

## Development status

The repository currently provides the foundation, authentication, role model, provider profile capture, document submission, and staff invitation workflow. It is an MVP prototype and is not production-ready until the remaining lifecycle modules, complete RLS policies, document scanning, rate limiting, legal review, backups, monitoring, and end-to-end testing are complete.

See [TODO.md](TODO.md) for the detailed delivery plan.

## License

No license has been selected for this private prototype.
