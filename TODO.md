# Dezhub MVP Implementation Checklist

This checklist converts the product requirements into buildable work. Complete the phases in order; items marked **Launch blocker** are required before production release.

## 0. Product decisions and handover

- [x] Confirm the MVP roles: service provider, client, assessor/academy staff, administrator.
- [ ] Define a permissions matrix for every role and sensitive action.
- [ ] Approve Dezhub logo, colour palette, typography, and certificate design.
- [ ] Approve the required provider document types, expiry rules, and verification criteria.
- [ ] Define assessment scoring, pass marks, course recommendations, and assessor guidance.
- [ ] Define course catalogue, modules, lessons, attendance rules, and completion rules.
- [ ] Approve client service-request fields and service categories.
- [ ] Approve matching weights and the admin override process.
- [ ] Obtain legal review of contract templates, fees, consent wording, and retention/deletion policies.
- [ ] Define notification templates and the initial delivery channels (in-app, email, SMS).

## 1. Foundation

- [x] Create React + TypeScript frontend.
- [x] Create Fastify backend.
- [x] Connect frontend and backend to Supabase configuration.
- [x] Create initial profile schema and authenticated profile endpoints.
- [x] Add environment-variable examples and ensure secret keys never reach the frontend.
- [x] Add linting, formatting, unit-test, and backend test commands.
- [ ] Add CI to run type checks, tests, and production builds.
- [ ] Add centralized API error format, request validation, pagination, and filtering conventions.
- [ ] Add application logging, error monitoring, and health checks.
- [ ] Add development, staging, and production deployment configuration.

## 2. Authentication and roles

- [x] Support email/password sign-up, sign-in, sign-out, and password reset.
- [x] Add phone/OTP authentication if required for the initial market.
- [x] Create the user profile after successful registration.
- [x] Collect full name and selected role during onboarding.
- [x] Add assessor and administrator roles.
- [x] Enforce role-based authorization in backend routes and Supabase policies.
- [ ] Add account/session management and account suspension.
- [ ] Build post-login routing to provider, client, assessor, or admin dashboards.

## 3. Database and security

- [ ] Extend the schema for staff, documents, skills, assessments, courses, enrolments, certificates, service requests, matches, shortlists, interviews, contracts, placements, invoices, payments, notifications, and audit logs.
- [ ] Define all status enums and allowed status transitions.
- [ ] Add foreign keys, indexes, timestamps, ownership fields, and soft-delete/archive rules where needed.
- [ ] Create row-level security policies for every table and storage bucket. **Launch blocker**
- [ ] Create secure document-storage buckets with private access only. **Launch blocker**
- [ ] Validate file type and size; add malware scanning before documents are approved. **Launch blocker**
- [ ] Record document review, status changes, and other sensitive actions in audit logs. **Launch blocker**
- [ ] Set data retention, deletion, backup, and restore procedures. **Launch blocker**
- [ ] Add rate limiting, input validation, HTTPS-only deployment, and security testing. **Launch blocker**

## 4. Service provider journey

- [x] Build progressive provider registration and profile-completion screens.
- [x] Capture personal, emergency-contact, professional, availability, location, salary, language, experience, and reference details.
- [x] Allow profile photo and required-document uploads.
- [ ] Show document verification state: pending, under review, approved, rejected, expired.
- [ ] Show provider lifecycle state: registered through placed/inactive.
- [ ] Build a provider dashboard with next steps, notifications, academy progress, certificates, and opportunities.
- [ ] Allow providers to update only appropriate profile fields after verification.
- [ ] Build the provider-facing profile view used for matching.

## 5. Admin verification and assessment

- [ ] Build a verification queue with search, filters, reviewer notes, and approve/reject actions.
- [ ] Add document-expiry reminders and re-upload flows.
- [ ] Build configurable written, practical, and interview assessment forms.
- [ ] Record per-skill scores, assessor comments, final score, pass/fail, recommended course, and job category.
- [ ] Give assessors access only to assigned assessment work.
- [ ] Add admin candidate search/filtering by status, role, skills, location, documents, and availability.

## 6. Dezhub Academy

- [ ] Build course, module, lesson, material, and assessment management for academy staff.
- [ ] Build course catalogue and provider enrolment.
- [ ] Track attendance, module completion, assessment results, and final results.
- [ ] Support enrolment statuses: enrolled, in progress, completed, failed, withdrawn.
- [ ] Build the learner academy dashboard and training-progress view.
- [ ] Generate certificates with unique number, issue/expiry dates, score, and authorized signatory.
- [ ] Generate QR codes and a public certificate-verification page with privacy-safe results.
- [ ] Add certificate revocation/expiry handling.

## 7. Client and recruitment journey

- [ ] Build client onboarding and household/client profile.
- [ ] Add client verification status and suspension handling.
- [ ] Build service-request creation with position, worker count, location, start date, budget, schedule, accommodation, days off, contract duration, skills, and additional requirements.
- [ ] Generate unique service-request IDs and show request status.
- [ ] Build admin request-review and matching workspace.
- [ ] Implement configurable matching using category, skills, experience, certification, availability, and location.
- [ ] Show human-readable reasons for each match and allow documented admin overrides.
- [ ] Build privacy-safe candidate cards and detail views for clients.
- [ ] Implement shortlist, reject, request-interview, and request-more-candidates actions.

## 8. Interviews, contracts, and placement

- [ ] Build interview scheduling with date/time, location or meeting link, status, notes, and result.
- [ ] Notify all relevant parties about scheduling and changes.
- [ ] Record interview outcomes and update request/candidate status.
- [ ] Store approved contract templates and create contract records from selected candidates.
- [ ] Track contract states: draft, sent, viewed, accepted, signed, active, completed, terminated.
- [ ] Create placement records with start date, salary, fees, status, follow-ups, and notes.
- [ ] Build follow-up reminders and placement monitoring.
- [ ] Add client/provider placement views with appropriate access restrictions.

## 9. Payments and notifications

- [ ] Create invoices and payment-tracking records for provider and client fee types.
- [ ] Support pending, invoiced, processing, paid, failed, refunded, and cancelled states.
- [ ] Build finance views for administrators and invoice views for clients/providers.
- [ ] Add in-app notifications for every required lifecycle event.
- [ ] Add email notifications; integrate SMS after message templates and provider are approved.
- [ ] Keep WhatsApp and direct payment integrations as a later phase unless explicitly brought into MVP scope.

## 10. Dashboards, reporting, and UX

- [ ] Replace all hard-coded marketplace cards, KPIs, ratings, prices, and notifications with real or clearly labelled demo data.
- [ ] Build role-specific dashboards for provider, client, assessor, and admin.
- [ ] Build admin KPI dashboards for candidates, clients, academy, recruitment, and finance.
- [ ] Add operational reports with date range, status, location, and role filters.
- [ ] Add real search, sort, filters, loading states, empty states, and error states.
- [ ] Complete all currently visual-only navigation, links, buttons, and notification actions.
- [ ] Fix malformed display characters and review all public-facing copy.
- [ ] Test keyboard use, focus states, form labels, colour contrast, and mobile layouts.
- [ ] Optimize images and large file uploads for low-bandwidth connections.

## 11. Testing and launch

- [ ] Test the end-to-end provider flow: register → verify → assess → train → certify → available.
- [ ] Test the end-to-end client flow: register → request → match → shortlist → interview → select → contract → placement.
- [ ] Test every role permission and document-access rule. **Launch blocker**
- [ ] Perform functional, accessibility, security, performance, and user-acceptance testing. **Launch blocker**
- [ ] Confirm ordinary API operations meet the target response time under expected MVP load.
- [ ] Confirm backups and restoration work.
- [ ] Prepare production monitoring, incident contacts, support process, privacy notice, and terms.
- [ ] Run a pilot with internal staff and a small group of providers and clients.
- [ ] Resolve pilot findings and approve production launch.

## Future phase

- [ ] M-Pesa, card, and bank payment integrations.
- [ ] WhatsApp Business integration.
- [ ] Video interviews, e-signatures, online classes, video lessons, and online examinations.
- [ ] Ratings and reviews, payroll, attendance, consented worker check-ins, and GPS features.
- [ ] AI-assisted matching and profile/CV generation, following legal and bias review.
- [ ] Overseas recruitment, visa/document processing, multi-country compliance, multi-language support, and multi-branch operations.
