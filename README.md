# Care Company API

TypeScript API starter using Fastify, PostgreSQL, and Prisma.

## Local setup

1. Copy `.env.example` to `.env`. Set your PostgreSQL URL, a unique initial admin username/password, and a randomly generated JWT secret of at least 32 characters.
2. Install dependencies with `npm install`.
3. Create the database and apply the initial schema with `npm run db:migrate`.
4. Create the initial admin account with `npm run db:seed`.
5. Start the API with `npm run dev` and check `http://localhost:3000/health`.

## API routes

The homepage can direct users to separate role-specific login endpoints: `POST /api/auth/staff/login` and `POST /api/auth/guardian/login`. Admins sign in at `POST /api/auth/admin/login`. All accept `username` and `password` and return a bearer token that expires after 15 minutes. Guardians create a profile with `POST /api/auth/register`; registration does not grant access to a child until an administrator links that guardian to the child's record. Staff accounts are created by an administrator. Send the token in the `Authorization` header for protected routes.

- `GET /api/me`
- `GET`, `POST`, `GET /:id`, `PATCH /:id`, `DELETE /:id` on `/api/staff` and `/api/guardians`
- `GET`, `POST`, `GET /:id`, `PATCH /:id`, `DELETE /:id` on `/api/children`
- `GET`, `POST`, `DELETE /:childId/:guardianId` on `/api/child-guardians`
- `GET`, `POST`, `POST /:id/end` on `/api/staff-assignments`
- `GET`, `POST /api/children/:childId/activities`
- `GET /api/children/:childId/activity-plans?period=WEEK|MONTH&periodStart=YYYY-MM-DD`; `POST` creates a plan and `PATCH /api/children/activity-plans/:id` updates it
- `GET`, `POST /api/children/:childId/goals`; `PATCH /api/goals/:id`
- `GET`, `POST /api/children/:childId/ratings`
- `GET`, `POST /api/children/:childId/media`; `GET /api/media/:id/content` and `/download` serve authorized media
- `GET`, `POST /api/children/:childId/reviews`; guardians can read only their own reviews
- `PATCH /api/children/:childId/reviews/:reviewId/response` lets assigned staff reply to a family review
- `GET /api/notifications`; staff can `PATCH /api/notifications/:id/read`
- `GET /api/chat/conversations`; admins can `POST` here to start a conversation with a staff user
- `GET /api/chat/staff` lists coworkers; staff can `POST /api/chat/staff-conversations` to start a direct coworker chat
- `GET`, `POST /api/chat/conversations/:id/messages` for conversation participants
- `GET /api/admin/audit-logs?limit=50&cursor=<id>` for admins only

Guardians can read activities, goals, ratings, and media only for children linked to their account. Staff can read records for currently assigned children and create progress records; admins manage all records. Scores use a 1-5 scale. Admins are represented by the `ADMIN` user role; staff and guardians have separate profiles. `ChildGuardian` links children to guardians, while `StaffAssignment` records staff-to-child assignments. Deleting a staff or guardian account deactivates it; deleting a child archives it. Deactivated users cannot use existing tokens.

After staff sign in, they select a client from their assigned caseload before opening the profile. Staff can respond to family reviews for clients currently assigned to them; the response and responder timestamp appear in the guardian's review view.

Weekly activity plans use a Monday `periodStart`; monthly plans use the first day of the month. Plans are separate from the completed activity log. Guardians can view plans for their linked children, while assigned staff and admins can create and update them.

Pictures and videos (JPEG, PNG, WebP, MP4, or WebM; max 100 MB) are uploaded as multipart form data to `/api/children/:childId/media`. They are stored in the private local `.data/media` directory and streamed only through authenticated, ward-authorized endpoints. This is development storage; use private object storage, backups, malware scanning, and retention controls before production. Do not put real child media into a local development environment.

Guardians can download media for linked children but have no media deletion endpoint. A guardian review creates in-app notifications for that child's active assigned staff; staff retrieve them from `/api/notifications` and mark them read. A notification requires an active staff assignment and is not an email or push notification.

Admins can start one private conversation per staff account, and staff can start one direct conversation per coworker pair. Only conversation participants can read or reply; guardians and other staff cannot access those conversations. Staff notifications include guardian review comments.

The admin audit log records successful sign-ins and authenticated API requests with the actor, route template, HTTP status, and timestamp. It does not store passwords, tokens, request bodies, or query values. Entries are append-only in PostgreSQL; apply schema changes with `npm run db:migrate` before using the log.