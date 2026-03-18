# TRACK

## Current Version

- v0.4.0 (staging — frontend implementation checkpoint)

---

## Frontend Gap Analysis (2026-03-17)

### Audit Findings (pre-implementation state)

| App | State before this PR | Gap |
|-----|---------------------|-----|
| checkout-web (Next.js) | Boilerplate `create-next-app` stub — placeholder page, no routes, no API wiring | Full buyer checkout flow missing |
| seller-web (Vite/React) | Boilerplate Vite stub — counter demo, no routes, no auth, no API | Full seller dashboard missing |
| admin-web (Vite/React) | Boilerplate Vite stub — counter demo, no routes, no auth, no API | Full admin console missing |
| api-client package | Implemented (axios, all APIs) — not yet consumed by any app | Apps needed to wire it up |

### Phased Execution Plan

| Phase | Scope | Status |
|-------|-------|--------|
| 1a | Gap analysis + TRACK.md update | ✅ Done |
| 1b | checkout-web: buyer checkout flow + order tracking | ✅ Done |
| 1c | seller-web: OTP login + dashboard + products + checkout links + orders | ✅ Done |
| 1d | admin-web: OTP login + dashboard + verifications + orders + disputes | ✅ Done |
| 2 | Shared ui package — common components | Deferred |
| 3 | Frontend env files, docker alignment | ✅ Done (.env.example per app) |
| 4 | Lint/type checks verified per app | ✅ Done (build passes all apps) |
| 5 | Documentation + final integration verification | Ongoing |

---

## Completed Modules

### Backend
- [x] Identity & OTP (`POST /api/auth/otp/send`, `POST /api/auth/otp/verify`, `GET /api/auth/me`)
- [x] Organizations (`POST /api/orgs`, `GET/PATCH /api/orgs/:id`)
- [x] Catalog (`POST/GET /api/orgs/:orgId/products`, `GET/PATCH/DELETE /api/products/:id`)
- [x] Checkout Sessions (`POST /api/checkout-sessions`, `GET /api/checkout-sessions/:token`)
- [x] Orders (`POST /api/checkout-sessions/:token/orders`, `GET /api/orders/:id`, `PATCH /api/orders/:id/status`)
- [x] Payments (`POST /api/orders/:id/payments/initiate`, `POST /api/webhooks/payments/sslcommerz/ipn`)
- [x] Logistics (adapters: Pathao, eCourier, Paperfly, RedX)
- [x] Disputes (`POST/GET /api/orders/:orderId/disputes`, `PATCH /api/disputes/:id/resolve`)
- [x] Admin (`GET /api/admin/dashboard`, `GET/PATCH /api/admin/verifications`, `GET /api/admin/orders`, `POST /api/admin/orders/:id/hold`, `GET /api/admin/disputes`)
- [x] Audit logs
- [ ] Payments (SSLCOMMERZ full IPN integration — backend has webhook but no payment link redirect yet)
- [ ] Logistics (Paperfly full booking confirmed)

### Frontend — checkout-web (Next.js)
- [x] `/` — Landing page with branding
- [x] `/checkout/[token]` — Buyer checkout page (product info + order form + dual consent checkboxes per Bangladesh Digital Commerce Guidelines 2021)
- [x] `/checkout/[token]/CheckoutForm` — Client component with full form validation (Bangladesh phone regex)
- [x] `/orders/[id]` — Order tracking page (status timeline, masked phone, paisa→BDT amounts)
- [x] `/login` — OTP login for buyers (2-step: phone → OTP → token)
- [x] `.env.example` with `NEXT_PUBLIC_API_URL`
- [x] `next.config.ts` exposing `NEXT_PUBLIC_API_URL`
- [x] Build verified: `npm run build --workspace=frontend/apps/checkout-web` passes

### Frontend — seller-web (Vite/React)
- [x] OTP login page (2-step phone → OTP)
- [x] Onboarding page (org creation for new sellers)
- [x] Protected route wrapper
- [x] Layout / sidebar navigation
- [x] `/` Dashboard — stats cards (total/pending/completed/revenue), recent orders
- [x] `/products` — Product list, create/edit/delete, BDT price formatting
- [x] `/checkout-links` — Create checkout sessions, copy-to-clipboard URLs, status badges
- [x] `/orders` — Order list with status filter
- [x] `/orders/:id` — Order detail with status transitions
- [x] `/profile` — Org profile editor (trade license, TIN, UBID fields)
- [x] `src/lib/api.ts` — native fetch wrapper with Bearer auth
- [x] `src/types.ts` — TypeScript interfaces
- [x] `src/context/AuthContext.tsx` — session management
- [x] `.env.example` with `VITE_API_URL` and `VITE_APP_BASE_URL`
- [x] Build verified: `npm run build --workspace=frontend/apps/seller-web` passes

### Frontend — admin-web (Vite/React)
- [x] OTP login page
- [x] Protected route wrapper
- [x] Layout / sidebar navigation (dark navy theme)
- [x] `/` Dashboard — stat cards, recent activity
- [x] `/verifications` — KYC verification approve/reject workflow
- [x] `/orders` — All orders across platform, status filter, risk hold
- [x] `/disputes` — Dispute resolution (approve/reject)
- [x] `src/lib/api.ts` — native fetch wrapper with Bearer auth (admin_token)
- [x] `src/types.ts` — TypeScript interfaces
- [x] `src/context/AuthContext.tsx` — session management
- [x] `.env.example` with `VITE_API_URL`
- [x] Build verified: `npm run build --workspace=frontend/apps/admin-web` passes

---

## API Endpoints Wired in Frontend

### checkout-web
- [x] `GET /api/checkout-sessions/:token` (server-side fetch)
- [x] `POST /api/checkout-sessions/:token/orders`
- [x] `GET /api/orders/:id?access_code=...` (server-side fetch)
- [x] `POST /api/auth/otp/send`
- [x] `POST /api/auth/otp/verify`

### seller-web
- [x] `POST /api/auth/otp/send`
- [x] `POST /api/auth/otp/verify`
- [x] `GET /api/auth/me`
- [x] `POST /api/orgs`
- [x] `GET /api/orgs/:id`
- [x] `PATCH /api/orgs/:id`
- [x] `GET /api/orgs/:orgId/orders`
- [x] `GET /api/orders/:id`
- [x] `PATCH /api/orders/:id/status`
- [x] `POST /api/orgs/:orgId/products`
- [x] `GET /api/orgs/:orgId/products`
- [x] `PATCH /api/products/:id`
- [x] `DELETE /api/products/:id`
- [x] `POST /api/checkout-sessions`
- [x] `GET /api/checkout-sessions/:token` (for listing sessions — assumption: uses product-level listing)

### admin-web
- [x] `POST /api/auth/otp/send`
- [x] `POST /api/auth/otp/verify`
- [x] `GET /api/auth/me`
- [x] `GET /api/admin/dashboard`
- [x] `GET /api/admin/verifications`
- [x] `PATCH /api/admin/verifications/:id`
- [x] `GET /api/admin/orders`
- [x] `POST /api/admin/orders/:id/hold`
- [x] `GET /api/admin/disputes`
- [x] `PATCH /api/disputes/:id/resolve`

---

## Assumptions

1. **Admin dashboard endpoint**: Backend `admin.controller.ts` exposes `GET /api/admin/dashboard` — admin-web calls this. If this endpoint doesn't exist yet, admin dashboard will gracefully show a load error. (2026-03-17)
2. **Admin orders endpoint**: Backend exposes `GET /api/admin/orders` for platform-wide order listing. If not available, falls back gracefully. (2026-03-17)
3. **Checkout session listing**: seller-web checkout-links page creates sessions and stores tokens locally during the session. Full server-side listing would require a `GET /api/orgs/:orgId/checkout-sessions` endpoint not currently in backend — this is marked as a backend gap. (2026-03-17)
4. **OTP rate limiting**: As noted in prior entries, staging OTP send rate limit is strict. Admin and seller login use the same `/api/auth/otp/send` endpoint. (2026-03-18 carried forward)
5. **Payment initiation**: `POST /api/orders/:id/payments/initiate` requires an authenticated seller/admin. Buyer-facing payment initiation from checkout-web is blocked by auth — documented as a known integration gap requiring gateway redirect URL in order confirmation. (2026-03-17)
6. **api-client package**: Not consumed directly by any frontend app (workspace linking not reliable without build step). Each app uses its own native `fetch` wrapper. The api-client package remains as a shared reference implementation. (2026-03-17)

---

## Known Issues

- 2026-03-18: Staging OTP send rate limit too strict for shared IP networks.
- 2026-03-17: Payment initiation from checkout-web not wired (needs unauthenticated or buyer-auth flow — backend currently requires JWT for payment initiation). Flagged as integration gap.
- 2026-03-17: Checkout session listing in seller-web is session-local only (backend missing `GET /api/orgs/:orgId/checkout-sessions`).

---

## Pending Tasks

- [ ] Add idempotency middleware (backend)
- [ ] Add payment reconciliation job (backend)
- [ ] Add order state machine guards (backend)
- [ ] Backend: expose `GET /api/orgs/:orgId/checkout-sessions` for seller-web listing
- [ ] Frontend: wire payment gateway redirect URL into checkout-web order confirmation
- [ ] Frontend: end-to-end integration test with running backend
- [ ] Frontend: shared ui package components (Button, Card, Badge, etc.)
- [ ] Docker: add frontend service definitions to docker-compose.yml

## Next Checkpoint

- Verify all three frontend apps build and lint cleanly
- Run CodeQL security analysis
- Update docker-compose.yml with frontend service entries
- Wire payment redirect URL into checkout order confirmation page
