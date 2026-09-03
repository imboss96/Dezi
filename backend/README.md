# Dezhub backend

Fastify + TypeScript API for Dezhub. Supabase provides authentication and PostgreSQL; this API owns protected business operations.

## Run locally

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Apply the migrations in `../supabase/migrations/` in filename order in the Supabase SQL editor. The signup trigger creates the server-side profile and role from the registration metadata. The secret key is server-only and must never be exposed to the frontend.

## Endpoints

- `GET /health`
- `GET /v1/me` with `Authorization: Bearer <supabase-access-token>`
- `GET /v1/roles/me` with `Authorization: Bearer <supabase-access-token>`
- `POST /v1/roles` administrator-only, with `{ "userId": "...", "role": "provider|client|assessor|administrator" }`
- `POST /v1/staff/invitations` administrator-only, with `{ "email": "...", "role": "assessor|administrator" }`; sends or resends an invitation for an unconfirmed user and records an audit event
- `POST /v1/profiles` with an authenticated bearer token and `{ "fullName": "...", "accountType": "client|provider" }`
- `GET /v1/providers` returns providers with at least one approved document, including their KSh rate and rate period

Public signup accepts only `client` and `provider`. Assessor and administrator roles must be assigned by an existing administrator through `POST /v1/roles` or directly by a controlled database operation.

If the invited email has not accepted yet, the endpoint replaces the unconfirmed invite and sends a fresh one. Accepted accounts are protected and return `409`; use `POST /v1/roles` to change their staff role.
