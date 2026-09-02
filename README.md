# Dezhub

Mobile-first React + TypeScript prototype for the Dezhub staffing and academy platform.

## Development

Node.js 20+ is required.

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## Supabase authentication

Copy `.env.example` to `.env.local` and add the project URL and publishable key from Supabase. The app then supports email/password registration and sign-in. New accounts can be created as either clients or service providers; the selected account type is stored in Supabase user metadata.

The backend lives in `backend/` as a separate Fastify TypeScript API. See `backend/README.md` for local setup and apply the SQL in `supabase/migrations/` to the Supabase project. Provider registration uses migrations `004_provider_documents.sql` and `005_provider_registration_fields.sql` for private document storage and the complete profile fields.

Roles are defined in `006_user_roles_and_staff.sql`: providers and clients can register publicly; assessor/academy staff and administrator accounts are assigned server-side.

### Google sign-in setup

The sign-in dialog supports Google OAuth once it is enabled in Supabase.

1. In the Google Cloud Console, create OAuth 2.0 web credentials and add Supabase's Google callback URL shown in the Supabase Google provider settings.
2. In Supabase Dashboard, open **Authentication → Providers → Google**, enable it, and enter the Google client ID and secret.
3. In **Authentication → URL Configuration**, add your local URL (for example, `http://localhost:5173/`) and production URL to the redirect allow list.

The app sends Google users back to the site root after authentication and preserves the client/provider role selected before the redirect.

## Prototype scope

The first screen is an operations dashboard representing the documented lifecycle: capture, verify, assess, train, certify, match, and place. Navigation and responsive behavior are wired for the next prototype screens.
