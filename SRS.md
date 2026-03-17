# SafeCart SRS and Production Implementation Plan

## Product definition and requirements

**0. What this document is**

This is a production-grade **Software Requirements Specification (SRS)** plus a build-ready **implementation plan** for “SafeCart”: a checkout + escrow-orchestrated payment link + courier-booking system designed for Bangladesh Facebook-based commerce (“F-commerce”). It is written so an engineer can implement the system end-to-end without needing more clarification.

**Important compliance note (Bangladesh context)**  
Bangladesh’s payment ecosystem is regulated; if your company **directly provides payment services or operates a payment system**, licensing and safeguarding requirements can apply. A practical, low-license-risk approach is: **SafeCart never takes custody of funds**; it orchestrates escrow and settlement via a licensed PSP/PSO/payment gateway partner. The regulatory landscape is described as requiring licensing for entities providing payment services/operating payment systems. citeturn10view0turn10view1turn10view2turn12view0turn11view0

### **1. System Overview**

**1.1 Product definition (what you are building)**  
SafeCart is a **transaction layer for social commerce** that lets a seller generate a **shareable checkout link** (ready to paste into Messenger/Facebook chat) that supports:

- verified seller identity and shop profile
- a hosted checkout page for a specific order/cart
- payment initiation through integrated gateways (cards + MFS)
- **escrow-style hold/release logic** (implemented via your gateway/partner + your internal ledger/state machine)
- courier booking and tracking through integrated courier APIs/panels
- disputes/returns and evidence capture
- automated notifications (SMS/email/push/WhatsApp via provider abstraction)

**1.2 Core problem it solves**  
Bangladesh social commerce is efficient in reach but weak in **trust, record-keeping, and standard workflows**. The Digital Commerce Guidelines emphasize transparency, disclosure of terms, consent for personal data collection, and record retention. citeturn5view1turn5view2turn16view0turn17view1  
Bangladesh also pushed escrow-related controls for e-commerce to combat fraud and increase trust. citeturn12view0turn11view0  
SafeCart solves this by offering a standardized, logged, escrow-aware order workflow with courier integration.

**1.3 Target users**

- **Buyers**: people purchasing from Facebook sellers who want safer payment and reliable delivery tracking.
- **Sellers (SMEs / Facebook shops)**: want fewer fake orders, faster operations, easier courier handling, and credibility.
- **Customer support agents (your internal team)**: handle disputes, verification, and escalations.
- **Admin / risk team**: monitoring, fraud rules, compliance reporting.
- **Partners**: payment gateway partner, courier partner(s), SMS provider.

**1.4 Key features (brief list before deep dive)**

- Seller onboarding + KYC/verification workflow
- Product catalog + “Create order link” (single product or cart)
- Hosted checkout (mobile-first) with shipping calculation
- Payment integration (links + IPN/webhooks + reconciliation)
- Escrow state machine (hold → ship → deliver → release; or dispute paths)
- Courier booking + tracking + delivery OTP support where available
- Dispute/return workflow with evidence + SLAs
- Notifications + audit logs + exportable records (6-year retention target)
- Admin console for KYC approval, refunds, disputes, risk holds

**1.5 Non-functional requirements (NFRs)**

- **Availability**: 99.9% monthly for API + checkout pages (excluding provider outages).
- **Latency**: P95 API < 300ms for read endpoints; P95 checkout < 2s LCP on 4G.
- **Consistency model**: strong consistency for payments/orders; event-driven eventual consistency for analytics/search.
- **Security baseline**: ASVS L2-aligned controls (authn/authz, session mgmt, input validation, crypto). citeturn8search4turn8search0
- **Compliance**: store transaction records at least 6 years (policy-driven retention). citeturn5view2turn17view1turn16view0
- **Privacy**: explicit consent for personal info collection and cookie disclosure, aligned with commerce guideline expectations. citeturn5view1turn17view1turn16view0

## Architecture and technical stack

### **2. Architecture Design**

### 2.1 High-level architecture diagram (textual)

```text
                           +----------------------+
                           |   Admin Web (React)  |
                           +----------+-----------+
                                      |
                                      v
+--------------------+     +----------------------+     +-----------------------+
| Buyer Web Checkout | --> |  API Gateway / BFF   | --> | Modular Monolith App  |
| (Next.js)          |     | (rate-limit, auth)   |     | (Domain Modules)      |
+--------------------+     +----------+-----------+     +--+----------+---------+
                                      |                    |          |
                                      |                    |          |
                                      v                    v          v
                         +--------------------+    +-------------+  +-------------------+
                         | PostgreSQL         |    | Redis       |  | Object Storage     |
                         | (system of record) |    | (cache/queue)|  | (S3-compatible)    |
                         +--------------------+    +-------------+  +-------------------+
                                      |
                                      v
                           +----------------------+
                           | Observability stack |
                           | logs/metrics/traces |
                           +----------------------+

External integrations (async via webhooks/jobs):
- Payment gateways (SSLCOMMERZ, bKash, etc.)
- Courier partners (Pathao/Paperfly/RedX/etc.)
- SMS/Email/Push providers
```

### 2.2 Frontend, backend, database, infrastructure separation

- **Frontend**
  - Buyer Checkout Web (public): Next.js (SSR + edge caching)
  - Seller Dashboard Web: React SPA or Next.js app
  - Admin Console Web: React SPA (separate build + stricter access)
- **Backend**
  - One deployable modular monolith (domain modules) behind an API gateway/BFF
- **Database**
  - PostgreSQL as system of record
  - Redis for caching + queues + idempotency locks
  - Object storage for KYC docs, product images, dispute evidence
- **Infrastructure**
  - Containers + IaC + CI/CD
  - Observability + alerting

### 2.3 Monolith vs microservices (justify choice)

**Choice: Modular monolith first (production-grade)**  
Use a **modular monolith** with strict module boundaries and internal event bus. This reduces failure modes and operational overhead while you are still validating flows with providers (payment/courier). It also simplifies transactional integrity across orders+payments, which is critical.

**Future**: split services later using module boundaries as seams (see Section 17).

### 2.4 Tech stack recommendations (with reasoning)

**Backend**
- TypeScript + NestJS (or Fastify-based framework) for strong structure, DI, and testability.
- PostgreSQL for relational integrity across orders/payments/shipments.
- Redis + BullMQ for reliable background job processing.

**Frontend**
- Next.js for public checkout pages (SEO not required, but SSR/streaming improves performance on low-end mobile).
- React + TypeScript + TanStack Query for dashboard and admin.

**Payments**
- Start with **payment link / invoice link generation** (lowest friction for social commerce). SSLCOMMERZ explicitly supports generating invoice payment links and sharing via **SMS/Email/Facebook Messenger**. citeturn15view0turn14view0
- Add bKash tokenized checkout as a second integration; tokenized checkout binds payer account for faster repeat payments. citeturn19view0turn13view0

**Why SSLCOMMERZ early**  
SSLCOMMERZ provides a simple session-based integration with IPN listener + validation and mentions TLS 1.2+ requirement. citeturn14view0turn15view0  
This maps well to “link-based checkout” needed for Facebook chat selling.

### 2.5 Scalability considerations

- Use **read-optimized queries** and proper indexes on order lookups, merchant dashboards, and webhooks.
- Isolate “hot paths”:
  - Checkout read model (product display, shipping fee calc)
  - Payment webhook ingestion
  - Courier status updates
- Move analytics/search to separate stores later (ClickHouse/Elastic) without impacting transactional Postgres.

### 2.6 Security considerations

Baseline your program on:
- OWASP Top 10 guidance for common web risks (injection, broken access control, etc.). citeturn8search1turn8search13turn8search17
- OWASP ASVS requirements for authentication/session/access control depth. citeturn8search4turn8search0
- NIST password guidance if you allow passwords (minimum lengths, ban compromised passwords, avoid arbitrary complexity rules). citeturn8search2

Payment scope control:
- Do **not** store PAN/card data; rely on gateways. (SSLCOMMERZ and similar gateways are designed for this.) citeturn14view0turn15view0
- If handling payment tokens, treat them as sensitive secrets and encrypt at rest.

Bangladesh compliance pressures:
- Digital Commerce Guidelines emphasize disclosure, consent, and record retention. citeturn5view1turn5view2turn16view0turn17view1
- Payment services are regulated; licensing may apply if you become a PSP/PSO. citeturn10view0turn10view1turn10view2

## Module breakdown and core workflows

### **3. Module Breakdown (VERY IMPORTANT)**

This system is divided into **modules that can scale independently**. Each module is implemented as a bounded package with:
- its own controllers/routes
- domain services
- data access layer (repositories)
- background job handlers
- events published to an internal event bus

**Module boundary rule**: modules communicate via **interfaces + domain events**, not direct DB writes into each other’s tables.

#### Module A: Identity & Access

**Purpose**  
Authenticate users and enforce authorization.

**Responsibilities**
- OTP login (phone), optional email login
- refresh tokens / session management
- RBAC roles: buyer, seller, staff, admin
- device/session tracking
- account recovery
- secure logout

**Inputs & Outputs**
- Input: phone/email, OTP, refresh token
- Output: access token JWT, refresh token, user profile

**Internal logic**
- OTP: generate → store hashed OTP with TTL → validate → create session
- Sessions: rotate refresh token on use; revoke on logout
- Authorization: policy checks by role + organization membership

**Dependencies**
- Redis (OTP + session cache)
- Postgres (users, sessions)
- SMS provider adapter

**Future scalability notes**
- Move auth to dedicated service only if needed (SSO, multiple apps).

#### Module B: Organization & Seller Profile

**Purpose**  
Represent a seller “shop” and its operational settings.

**Responsibilities**
- Create organization/shop
- Manage staff members and roles per shop
- Configure payout settings (bank/MFS via partner)
- Configure return policy text, shipping rules
- Store legal identifiers (trade license, VAT, TIN, UBID/PRA fields)

**Compliance tie-in**  
Guidelines reference requirements to show business identifiers like trade license, VAT registration, TIN, UBID/PRA on marketplace/social pages. citeturn5view1turn5view0turn16view0turn17view1

**Dependencies**
- Identity module (user membership)
- Object storage (brand assets)

#### Module C: Seller Verification (KYC) & Compliance

**Purpose**  
Reduce fraud and meet marketplace compliance expectations.

**Responsibilities**
- KYC record submission: NID images, trade license, VAT/TIN, UBID/PRA
- Verification workflow: pending → approved → rejected → resubmission
- Audit trail of verification decisions
- Risk flags (suspicious activity)

**Inputs & Outputs**
- Input: documents, metadata
- Output: verification status, verified badge entitlement

**Internal logic**
- Store docs in object storage
- Create verification case record
- Admin review queue; decision reasons required
- Automatic re-verification triggers (high disputes, chargebacks)

**Dependencies**
- Object storage, virus scan job, admin module

#### Module D: Catalog & Pricing

**Purpose**  
Enable sellers to list products and generate cart/order links quickly.

**Responsibilities**
- Products, variants (size/color), SKU, pricing, photos
- Inventory (optional: “unlimited” for made-to-order)
- Public product pages (optional)
- Compliance fields: description, ingredients/material, origin, warranty notes
  - Guidelines emphasize clear product information and disclosure. citeturn5view2turn16view0turn17view0

**Internal logic**
- Slug creation for shareable product URLs
- Image pipeline → thumbnails → CDN
- Price rules: discounts, bundles, shipping

**Dependencies**
- Object storage
- Cache (Redis) for product reads

#### Module E: Checkout & Orders

**Purpose**  
Create an order object from chat/social context, track its lifecycle, and enforce transitions.

**Responsibilities**
- Host checkout session pages for a specific order/cart
- Buyer enters shipping address + phone + optional email
- Calculate shipping fee (zone/weight)
- Create order + order items
- Manage order state machine
- Expose order tracking view (buyer-friendly)

**Order state machine (core)**
- DRAFT (seller created order link)
- CHECKOUT_STARTED
- PAYMENT_PENDING
- PAID (or COD_CONFIRMED)
- SHIPMENT_BOOKED
- IN_TRANSIT
- DELIVERED
- COMPLETED (funds released)
- CANCELLED
- DISPUTE_OPEN
- RETURN_IN_TRANSIT
- REFUNDED / PARTIALLY_REFUNDED

**Dependencies**
- Payment module
- Logistics module
- Notifications module
- Compliance: record retention (Section 4 + 15) citeturn5view2turn17view1turn16view0

#### Module F: Payments & Escrow Orchestration

**Purpose**  
Integrate gateways, process webhooks/IPNs, manage internal ledger, and control “release” conditions.

**Key concept**  
“Escrow” here means:
- The **payment is collected via a licensed gateway**
- SafeCart keeps an internal ledger and state machine
- Funds release timing depends on delivery confirmation/dispute conditions
- If your gateway/PSO supports escrow hold or delayed settlement, SafeCart uses it; otherwise SafeCart implements operational holds (ship before payout instructions)

Bangladesh Bank and stakeholders introduced escrow policy mechanisms to increase consumer confidence and combat fraud. citeturn12view0turn11view0  
Licensing/safeguarding expectations for payment services are a key constraint if you try to custody funds yourself. citeturn10view0turn10view1turn10view3

**Responsibilities**
- Payment adapters:
  - SSLCOMMERZ session + IPN + validation citeturn14view0turn15view0
  - bKash tokenized checkout (create/execute/refund/capture) citeturn13view0turn19view0
- Idempotent webhook handling
- Payment reconciliation jobs
- Refunds/partial refunds
- Payout calculation (seller payable minus fees minus refunds)

**Inputs & Outputs**
- Input: payment initiation request, gateway IPN/webhook
- Output: payment status updates, ledger entries, refund confirmations

**Internal logic**
- Create PaymentIntent with idempotency key
- Generate gateway payment URL (invoice link or session URL)
- On webhook/IPN:
  - validate signature + source
  - map external status → internal status
  - write immutable PaymentTransaction record
  - advance order state if allowed
  - post ledger entries

**Dependencies**
- Gateway adapters
- Redis (idempotency + webhook locks)
- Postgres (ledger + immutable logs)

#### Module G: Logistics & Shipment Tracking

**Purpose**  
Make delivery operationally easy: quote → book → track → confirm delivery → handle returns.

**Responsibilities**
- Courier account credentials per seller (optional) or platform master account
- Shipment quotes (fee, ETA)
- Shipment booking
- Tracking updates (webhooks if available; polling if not)
- Delivery confirmation and proof (OTP, signature, photo)
- Returns booking

**Bangladesh courier realities (design drivers)**
- Couriers advertise COD, reverse logistics/returns, and delivery tracking features; Paperfly describes return OTP and nationwide delivery/COD workflows. citeturn23view0  
- Pathao describes COD offerings and tracking; it’s widely used and seller onboarding requires store/payment details. citeturn21view0  
- RedX provides APIs to create/manage parcels according to its developer API page. citeturn6search2

**Dependencies**
- Courier adapters
- Notification module
- Orders module

#### Module H: Disputes, Returns, Refunds

**Purpose**  
Provide buyer trust: structured complaint → evidence → resolution → refunds.

**Responsibilities**
- Buyer raises dispute within defined window
- Collect evidence: photos, chat screenshots (optional), delivery proof
- Triage: not delivered, wrong product, damaged, counterfeit, etc.
- Return flow: schedule pickup, receive, inspect
- Refund flow: gateway refund where possible

**SLA alignment**
- The commerce guidelines discuss complaint recording and resolution timeline (e.g., 72 hours in the summarized briefing). citeturn16view0turn17view2

**Dependencies**
- Payments module (refund)
- Logistics module (return shipment)
- Admin module

#### Module I: Notifications & Messaging

**Purpose**  
Timely updates reduce disputes and increase conversion.

**Responsibilities**
- SMS/email templates
- Event-driven sends: payment link, payment confirmed, shipped, delivered, dispute updates
- Provider failover (multiple SMS gateways)
- Notification logs + retries

**Dependencies**
- Queue (BullMQ)
- Provider adapters

#### Module J: Admin, Risk & Moderation

**Purpose**  
Operate the marketplace safely at scale.

**Responsibilities**
- KYC review queue (approve/reject)
- Dispute resolution tooling
- Risk flags and automatic holds
- Refund approval workflows
- Feature flags & configuration
- Audit log explorer

**Security driver**
Broken access control is a top web-app risk; admin tooling must be strongly segregated and audited. citeturn8search13turn8search1

#### Module K: Audit & Reporting

**Purpose**  
Support compliance checks and debugging.

**Responsibilities**
- Immutable event log of order/payment/shipment state changes
- Export reports (CSV) for sellers
- Retention policies (6 years default)
- Data minimization & redaction for exports

**Record retention driver**
Guideline summaries and the gazette emphasize preserving transaction details; the briefing note portion explicitly calls out preserving transaction details for at least six years. citeturn5view2turn16view0turn17view1

### **6. Detailed Logic Flows**

Below are build-ready flows with decision branches and failure handling.

#### User signup/login (OTP-first)

1. User enters phone number.
2. System validates format and rate limits (per IP + per phone).
3. Generate OTP (6 digits), store `otp_hash` + `expires_at` in Redis (TTL 5 min).
4. Send SMS via provider adapter; log send attempt.
5. User submits OTP:
   - If wrong/expired → increment attempt counter → lock after N attempts.
   - If valid → create user (if first time) + session record.
6. Issue:
   - `access_token` (JWT, 15 min)
   - `refresh_token` (random 256-bit, stored hashed, 30 days)
7. Client stores `access_token` (memory) and `refresh_token` (httpOnly cookie).

Edge cases:
- SMS provider outage → fallback provider; if all fail, allow “voice OTP” if available.
- OTP replay → one-time use; delete OTP entry after success.

#### Core seller workflow: create order link and share on Messenger

1. Seller selects product(s) or creates custom order.
2. Seller clicks “Generate Link”.
3. System creates `checkout_session` with:
   - seller_org_id
   - cart snapshot (items, prices)
   - expiry (default 48 hours)
4. System returns URL: `https://safecart.bd/c/{session_token}`
5. Seller copies and shares in chat.

Failure handling:
- If product out of stock (if tracked) → block link generation.
- If seller not verified → allow link but force “risk banner” or limit payment methods.

#### Buyer checkout + payment link flow (SSLCOMMERZ invoice style)

Design is aligned to SSLCOMMERZ “invoice/payment link” capability. citeturn15view0turn14view0

1. Buyer opens checkout link.
2. System loads checkout session + product snapshot.
3. Buyer enters address/phone and selects payment method.
4. System creates `order` and `payment_intent`.
5. System calls gateway adapter → `create_invoice_link()` (or session create) and stores:
   - gateway invoice_id/tran_id
   - pay_url
6. Buyer is redirected to `pay_url`.
7. Gateway sends IPN to `/webhooks/payments/sslcommerz/ipn`.
8. Webhook handler:
   - validates source
   - calls gateway validation API as SSLCOMMERZ recommends citeturn14view0
   - writes `payment_transaction`
   - moves order to PAID (only if VALID)
9. System notifies seller: “Paid. Book courier now.”

Failure handling:
- If IPN missed, scheduled reconciliation job queries invoice status. citeturn15view0turn14view0
- Duplicate IPN → idempotency key on `(gateway, invoice_id, status)`.

#### Courier booking flow

1. Seller selects courier preference (auto cheapest / fastest / fixed).
2. System calls courier adapter to quote.
3. Seller confirms booking.
4. System creates `shipment` record and calls courier booking API (or logs manual booking).
5. Courier returns tracking ID (consignment).
6. System updates order state to SHIPMENT_BOOKED and sends buyer tracking link.

Failure handling:
- Courier API timeout → retry job with exponential backoff.
- Booking succeeded but response lost → idempotency key with courier request id.

#### Delivery confirmation and escrow release

1. Courier reports delivered (webhook or polling).
2. System marks shipment DELIVERED and order DELIVERED.
3. Start “release window” timer (configurable, default 24–72h).
4. If no dispute opened within window:
   - mark order COMPLETED
   - finalize ledger: seller payable becomes eligible for payout batch
5. If dispute opened:
   - freeze payout for that order until resolved.

#### Dispute/return/refund flow

1. Buyer selects order → “Report a problem”.
2. Buyer chooses reason + uploads evidence.
3. System opens dispute ticket and sets order DISPUTE_OPEN.
4. Admin triage:
   - request more evidence
   - approve return pickup
   - approve refund/partial refund
5. If refund:
   - payment module calls gateway refund path (if supported) and logs `refund_transaction`.
6. Close ticket with resolution summary.

Failure handling:
- Refund API fails → retry; if still fails, mark “manual refund required” for finance ops.

### **9. Background Processes & Jobs**

**Queue tech**: Redis + BullMQ or equivalent (at-least-once delivery).  
**Retry policy**:
- exponential backoff with jitter
- max retries per job type
- dead-letter queue (DLQ) for manual review

Jobs:
- Payment reconciliation (minute-level) for “pending → paid/failed”
- Courier tracking polling (5–15 min; adaptive)
- Notification send retries (SMS/email)
- Image processing (thumbnails)
- Document virus scan
- Payout batching + payout confirmation import (if provider supports payout APIs)
- Data retention enforcement (archive/soft-delete per policy)

## Data model and database schema

### **4. Database Design**

**Storage approach**
- PostgreSQL: authoritative transactional store
- Redis: cache + queues + idempotency + short-lived tokens
- Object storage: large blobs (images/docs)

**Key design rules**
- Use UUID primary keys
- Use `timestamptz` for all time
- Store money as integer minor units: `amount_minor BIGINT` + `currency CHAR(3)`
- Immutable event tables for payments and order events

#### 4.1 Tables / fields / relationships

Below is a complete schema baseline (you can implement with Prisma/TypeORM + SQL migrations).

**users**
- `id UUID PK`
- `phone_e164 TEXT UNIQUE NULL`
- `email TEXT UNIQUE NULL`
- `full_name TEXT NULL`
- `status TEXT NOT NULL` (active, blocked, deleted)
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

**sessions**
- `id UUID PK`
- `user_id UUID FK(users.id)`
- `refresh_token_hash TEXT NOT NULL`
- `expires_at TIMESTAMPTZ NOT NULL`
- `revoked_at TIMESTAMPTZ NULL`
- `device_info JSONB NULL`
- Index: `(user_id)`, `(expires_at)`

**roles**
- `id UUID PK`
- `name TEXT UNIQUE` (buyer, seller_owner, seller_staff, support_agent, admin)

**user_roles**
- `user_id UUID FK`
- `role_id UUID FK`
- PK: `(user_id, role_id)`

**organizations**
- `id UUID PK`
- `name TEXT NOT NULL`
- `slug TEXT UNIQUE NOT NULL`
- `status TEXT NOT NULL` (active, suspended)
- `verified_status TEXT NOT NULL` (unverified, pending, verified, rejected)
- `support_phone TEXT NULL`
- `return_policy TEXT NULL`
- `created_at TIMESTAMPTZ`
- Index: `(slug)`, `(verified_status)`

**organization_members**
- `org_id UUID FK`
- `user_id UUID FK`
- `member_role TEXT NOT NULL` (owner, staff)
- PK `(org_id, user_id)`

**org_compliance**
- `org_id UUID PK FK(organizations.id)`
- `trade_license_no TEXT NULL`
- `vat_reg_no TEXT NULL`
- `tin_no TEXT NULL`
- `ubid TEXT NULL`
- `pra_no TEXT NULL`
- `business_address TEXT NULL`
- `updated_at TIMESTAMPTZ`

(Identifiers like UBID/PRA are referenced in the commerce guideline definitions. citeturn5view0turn5view1turn16view0)

**verification_cases**
- `id UUID PK`
- `org_id UUID FK`
- `status TEXT NOT NULL` (pending, approved, rejected)
- `submitted_by UUID FK(users.id)`
- `reviewed_by UUID FK(users.id) NULL`
- `review_notes TEXT NULL`
- `created_at TIMESTAMPTZ`
- `updated_at TIMESTAMPTZ`
- Index: `(org_id, status)`

**verification_documents**
- `id UUID PK`
- `case_id UUID FK`
- `doc_type TEXT NOT NULL` (nid_front, nid_back, trade_license, tin, vat, ubid, bank_statement)
- `object_key TEXT NOT NULL`
- `mime_type TEXT NOT NULL`
- `sha256 TEXT NOT NULL`
- `created_at TIMESTAMPTZ`
- Index: `(case_id)`

**products**
- `id UUID PK`
- `org_id UUID FK`
- `title TEXT NOT NULL`
- `description TEXT NOT NULL`
- `status TEXT NOT NULL` (active, archived)
- `category TEXT NULL`
- `created_at TIMESTAMPTZ`
- `updated_at TIMESTAMPTZ`
- Index: `(org_id, status)`

**product_variants**
- `id UUID PK`
- `product_id UUID FK`
- `sku TEXT NULL`
- `variant_name TEXT NOT NULL` (e.g., “Red / XL”)
- `price_amount_minor BIGINT NOT NULL`
- `currency CHAR(3) NOT NULL DEFAULT 'BDT'`
- `stock_qty INT NULL` (NULL = unlimited)
- Index: `(product_id)`

**product_images**
- `id UUID PK`
- `product_id UUID FK`
- `object_key TEXT NOT NULL`
- `position INT NOT NULL`
- Index: `(product_id, position)`

**checkout_sessions**
- `id UUID PK`
- `org_id UUID FK`
- `created_by UUID FK(users.id)`
- `status TEXT NOT NULL` (active, expired, converted)
- `session_token TEXT UNIQUE NOT NULL` (random, unguessable)
- `cart_snapshot JSONB NOT NULL`
- `expires_at TIMESTAMPTZ NOT NULL`
- `created_at TIMESTAMPTZ`
- Index: `(org_id, status)`, `(expires_at)`

**orders**
- `id UUID PK`
- `org_id UUID FK`
- `buyer_id UUID FK(users.id) NULL` (guest checkout allowed)
- `buyer_phone TEXT NOT NULL`
- `buyer_name TEXT NULL`
- `shipping_address JSONB NOT NULL`
- `subtotal_amount_minor BIGINT NOT NULL`
- `shipping_amount_minor BIGINT NOT NULL`
- `total_amount_minor BIGINT NOT NULL`
- `currency CHAR(3) NOT NULL`
- `status TEXT NOT NULL`
- `created_at TIMESTAMPTZ`
- `updated_at TIMESTAMPTZ`
- Index: `(org_id, created_at DESC)`, `(buyer_phone)`, `(status)`

**order_items**
- `id UUID PK`
- `order_id UUID FK`
- `product_id UUID NULL` (nullable for custom item)
- `variant_id UUID NULL`
- `title TEXT NOT NULL`
- `unit_price_amount_minor BIGINT NOT NULL`
- `qty INT NOT NULL`
- `line_total_amount_minor BIGINT NOT NULL`
- Index: `(order_id)`

**order_events** (immutable audit)
- `id UUID PK`
- `order_id UUID FK`
- `event_type TEXT NOT NULL`
- `payload JSONB NOT NULL`
- `created_at TIMESTAMPTZ`
- Index: `(order_id, created_at)`

**payment_intents**
- `id UUID PK`
- `order_id UUID FK`
- `provider TEXT NOT NULL` (sslcommerz, bkash, etc.)
- `provider_reference TEXT NULL` (invoice_id/tran_id)
- `status TEXT NOT NULL` (created, pending, succeeded, failed, refunded, partially_refunded)
- `amount_minor BIGINT NOT NULL`
- `currency CHAR(3) NOT NULL`
- `pay_url TEXT NULL`
- `created_at TIMESTAMPTZ`
- `updated_at TIMESTAMPTZ`
- Unique: `(provider, provider_reference)` when not null
- Index: `(order_id)`, `(status)`

**payment_transactions** (immutable)
- `id UUID PK`
- `payment_intent_id UUID FK`
- `provider_event_id TEXT NOT NULL` (idempotency anchor)
- `raw_payload JSONB NOT NULL`
- `status TEXT NOT NULL`
- `created_at TIMESTAMPTZ`
- Unique: `(payment_intent_id, provider_event_id)`

**ledger_accounts**
- `id UUID PK`
- `org_id UUID NULL` (NULL for platform-wide accounts)
- `account_type TEXT NOT NULL` (buyer_escrow, seller_payable, platform_fee, refund_reserve)
- `currency CHAR(3) NOT NULL`
- Unique: `(org_id, account_type, currency)`

**ledger_entries** (double-entry)
- `id UUID PK`
- `transaction_id UUID NOT NULL`
- `account_id UUID FK`
- `direction TEXT NOT NULL` (debit, credit)
- `amount_minor BIGINT NOT NULL`
- `memo TEXT NULL`
- `created_at TIMESTAMPTZ`
- Index: `(transaction_id)`, `(account_id, created_at)`

**shipments**
- `id UUID PK`
- `order_id UUID FK`
- `courier_provider TEXT NOT NULL` (pathao, paperfly, redx, manual)
- `tracking_id TEXT NULL`
- `status TEXT NOT NULL` (quote_pending, booked, picked_up, in_transit, delivered, failed, returned)
- `shipping_fee_amount_minor BIGINT NOT NULL`
- `created_at TIMESTAMPTZ`
- `updated_at TIMESTAMPTZ`
- Index: `(order_id)`, `(courier_provider, tracking_id)`

**shipment_events** (immutable)
- `id UUID PK`
- `shipment_id UUID FK`
- `event_type TEXT NOT NULL`
- `raw_payload JSONB NOT NULL`
- `created_at TIMESTAMPTZ`
- Index: `(shipment_id, created_at)`

**disputes**
- `id UUID PK`
- `order_id UUID FK`
- `opened_by_phone TEXT NOT NULL`
- `reason_code TEXT NOT NULL`
- `status TEXT NOT NULL` (open, awaiting_buyer, awaiting_seller, resolved, rejected)
- `created_at TIMESTAMPTZ`
- `updated_at TIMESTAMPTZ`
- Index: `(order_id)`, `(status)`

**dispute_evidence**
- `id UUID PK`
- `dispute_id UUID FK`
- `object_key TEXT NOT NULL`
- `mime_type TEXT NOT NULL`
- `created_at TIMESTAMPTZ`

**refunds**
- `id UUID PK`
- `payment_intent_id UUID FK`
- `amount_minor BIGINT NOT NULL`
- `status TEXT NOT NULL` (requested, processing, succeeded, failed)
- `provider_ref TEXT NULL`
- `created_at TIMESTAMPTZ`
- Index: `(payment_intent_id, status)`

**notifications**
- `id UUID PK`
- `user_id UUID NULL`
- `phone TEXT NULL`
- `channel TEXT NOT NULL` (sms, email, push)
- `template_key TEXT NOT NULL`
- `payload JSONB NOT NULL`
- `status TEXT NOT NULL` (queued, sent, failed)
- `provider_message_id TEXT NULL`
- `created_at TIMESTAMPTZ`
- Index: `(status, created_at)`

**audit_logs**
- `id UUID PK`
- `actor_user_id UUID NULL`
- `action TEXT NOT NULL`
- `entity_type TEXT NOT NULL`
- `entity_id UUID NULL`
- `ip TEXT NULL`
- `user_agent TEXT NULL`
- `payload JSONB NOT NULL`
- `created_at TIMESTAMPTZ`
- Index: `(entity_type, entity_id, created_at)`

#### 4.2 Indexing strategy

- High-cardinality lookups:
  - `checkout_sessions.session_token UNIQUE`
  - `(provider, provider_reference) UNIQUE`
  - `(courier_provider, tracking_id)` for shipment lookup
- Dashboards:
  - `orders(org_id, created_at desc)`
  - `orders(status)`
- Webhook idempotency:
  - `payment_transactions(payment_intent_id, provider_event_id) UNIQUE`

#### 4.3 Migration strategy

- Use **migration files** committed to VCS (Prisma migrations or Flyway).
- CI pipeline:
  - run migrations on staging first
  - run smoke tests
  - promote to production
- Backward-compatible expand/contract:
  1. add nullable fields / new tables
  2. deploy code that writes both
  3. backfill job
  4. enforce NOT NULL / drop old fields later

#### 4.4 Example records (illustrative)

Use these as fixtures in tests.

```json
{
  "organizations": {
    "id": "b3f0d5fe-6cdd-4a9a-9d5d-9e1a3fdc1a20",
    "name": "Nila Boutique",
    "slug": "nila-boutique",
    "verified_status": "pending"
  },
  "products": {
    "id": "4d5b0c71-5d6c-4f64-9a89-7c6c2c1b0f1b",
    "org_id": "b3f0d5fe-6cdd-4a9a-9d5d-9e1a3fdc1a20",
    "title": "Linen Kurti",
    "status": "active"
  },
  "orders": {
    "id": "1d8b6f3e-2d61-4f0f-9b62-9c3f5f9d2b11",
    "org_id": "b3f0d5fe-6cdd-4a9a-9d5d-9e1a3fdc1a20",
    "buyer_phone": "+8801XXXXXXXXX",
    "currency": "BDT",
    "total_amount_minor": 185000,
    "status": "PAYMENT_PENDING"
  }
}
```

#### 4.5 Data validation rules

- Phone must be E.164 format (store normalized).
- `amount_minor >= 0`
- Order totals must satisfy:
  - `total = subtotal + shipping - discounts`
- State machine guards:
  - cannot go from DELIVERED → SHIPPED
  - cannot refund unless payment succeeded (unless “manual refund”)

## Backend API specification

### **5. API Design (Backend)**

**API conventions**
- Base URL: `https://api.safecart.bd`
- JSON only; reject unknown fields on write endpoints
- Pagination: cursor-based (`cursor`, `limit`)
- Idempotency: `Idempotency-Key` header required for:
  - payment initiation
  - courier booking
  - refunds
- Error format (standard):

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": { "any": "json" }
  }
}
```

**Authentication**
- `Authorization: Bearer <access_token>`
- Refresh token via httpOnly cookie endpoint

Below are the core endpoints grouped by module. For each endpoint: route, purpose, request, response, errors, auth.

#### Auth & Identity APIs

**POST /api/auth/otp/send**  
Purpose: Send OTP to phone.  
Request:
```json
{ "phone_e164": "+8801XXXXXXXXX", "purpose": "login" }
```
Response:
```json
{ "otp_sent": true, "retry_after_seconds": 60 }
```
Errors: `rate_limited`, `invalid_phone`, `sms_failed`  
Auth: none

**POST /api/auth/otp/verify**  
Purpose: Verify OTP and create session.  
Request:
```json
{ "phone_e164": "+8801XXXXXXXXX", "otp": "123456" }
```
Response:
```json
{ "access_token": "jwt", "refresh_token_set": true, "user": { "id": "uuid", "phone_e164": "+880..." } }
```
Errors: `otp_invalid`, `otp_expired`, `too_many_attempts`  
Auth: none

**POST /api/auth/token/refresh**  
Purpose: Rotate refresh token and return new access token.  
Request: empty body (refresh cookie required)  
Response:
```json
{ "access_token": "jwt" }
```
Errors: `refresh_invalid`, `refresh_expired`  
Auth: refresh cookie

**POST /api/auth/logout**  
Purpose: Revoke refresh token session.  
Response:
```json
{ "ok": true }
```
Errors: none (idempotent)  
Auth: refresh cookie or access token

#### Organization & Seller Profile APIs

**POST /api/orgs**  
Purpose: Create seller organization.  
Request:
```json
{ "name": "Nila Boutique", "slug": "nila-boutique", "support_phone": "+8801..." }
```
Response:
```json
{ "org_id": "uuid", "status": "active", "verified_status": "unverified" }
```
Errors: `slug_taken`, `invalid_slug`, `forbidden`  
Auth: required (seller role)

**GET /api/orgs/{org_id}**  
Purpose: Get org profile.  
Response:
```json
{ "id":"uuid","name":"...","slug":"...","verified_status":"pending","return_policy":"..." }
```
Errors: `not_found`, `forbidden`  
Auth: org member required

**PATCH /api/orgs/{org_id}**  
Purpose: Update org settings (support phone, return policy, etc.).  
Request: partial JSON  
Response: updated org  
Errors: `invalid_input`, `forbidden`  
Auth: org owner/staff with permission

#### Seller Verification APIs

**POST /api/orgs/{org_id}/verification/cases**  
Purpose: Submit verification case.  
Request:
```json
{
  "documents": [
    { "doc_type": "trade_license", "upload_token": "signed-upload-token" },
    { "doc_type": "nid_front", "upload_token": "..." }
  ],
  "metadata": { "tin_no": "123...", "vat_reg_no": "..." }
}
```
Response:
```json
{ "case_id":"uuid","status":"pending" }
```
Errors: `missing_required_docs`, `forbidden`, `upload_invalid`  
Auth: org owner

**GET /api/orgs/{org_id}/verification/status**  
Purpose: Check verification state.  
Response:
```json
{ "verified_status":"pending","latest_case_id":"uuid" }
```
Errors: `forbidden`, `not_found`  
Auth: org member

#### Catalog APIs

**POST /api/orgs/{org_id}/products**  
Purpose: Create product.  
Request:
```json
{
  "title":"Linen Kurti",
  "description":"...",
  "category":"fashion",
  "variants":[{"variant_name":"M","price_amount_minor":185000,"currency":"BDT","stock_qty":10}]
}
```
Response:
```json
{ "product_id":"uuid" }
```
Errors: `invalid_input`, `forbidden`  
Auth: org member (seller)

**GET /api/orgs/{org_id}/products?cursor=&limit=**  
Purpose: Seller list products.  
Response:
```json
{ "items":[{"id":"uuid","title":"...","status":"active"}], "next_cursor":"..." }
```
Errors: `forbidden`  
Auth: org member

**GET /api/public/products/{product_id}**  
Purpose: Public product preview page data (optional).  
Response: product snapshot  
Errors: `not_found`, `gone`  
Auth: none

**POST /api/uploads/signed-url**  
Purpose: Get signed upload URL for images/docs.  
Request:
```json
{ "purpose":"product_image", "mime_type":"image/jpeg", "size_bytes":123456 }
```
Response:
```json
{ "upload_url":"https://...", "object_key":"...", "headers":{...} }
```
Errors: `too_large`, `forbidden`  
Auth: required (seller for product images; seller/admin for KYC docs)

#### Checkout & Orders APIs

**POST /api/checkout/sessions**  
Purpose: Create a checkout session (order link).  
Request:
```json
{
  "org_id":"uuid",
  "items":[{"product_id":"uuid","variant_id":"uuid","qty":1}],
  "custom_message":"Deliver in Dhaka by Thursday"
}
```
Response:
```json
{ "checkout_url":"https://safecart.bd/c/<token>", "expires_at":"2026-03-20T..." }
```
Errors: `invalid_item`, `out_of_stock`, `forbidden`  
Auth: seller org member

**GET /api/checkout/sessions/{token}**  
Purpose: Public fetch of checkout session snapshot.  
Response: cart snapshot + org profile + policies  
Errors: `expired`, `not_found`  
Auth: none

**POST /api/checkout/sessions/{token}/convert**  
Purpose: Convert session to order after buyer provides shipping info.  
Request:
```json
{
  "buyer_phone":"+8801...",
  "buyer_name":"...",
  "shipping_address": { "line1":"...", "city":"Dhaka", "area":"...", "postcode":"..." },
  "payment_method":"sslcommerz"
}
```
Response:
```json
{ "order_id":"uuid", "status":"PAYMENT_PENDING" }
```
Errors: `expired`, `invalid_address`, `invalid_payment_method`  
Auth: none (public)

**GET /api/orders/{order_id}/public?access_code=**  
Purpose: Buyer tracking view without login (access_code is unguessable).  
Response:
```json
{ "order_id":"uuid","status":"IN_TRANSIT","shipment":{"tracking_id":"..."} }
```
Errors: `forbidden`, `not_found`  
Auth: none, but requires access_code

**GET /api/orgs/{org_id}/orders?cursor=&limit=&status=**  
Purpose: Seller dashboard order list.  
Response: paginated orders  
Errors: `forbidden`  
Auth: org member

#### Payments & Escrow APIs

**POST /api/orders/{order_id}/payments/initiate**  
Purpose: Create payment intent and return pay URL.  
Headers: `Idempotency-Key: <uuid>` required  
Request:
```json
{ "provider":"sslcommerz", "mode":"invoice_link" }
```
Response:
```json
{ "payment_intent_id":"uuid", "pay_url":"https://.../pay.php?refer=..." }
```
Errors: `invalid_state`, `provider_unavailable`, `forbidden`  
Auth: public allowed if order has valid access_code OR buyer logged in

**GET /api/orders/{order_id}/payments/status**  
Purpose: Poll payment status (buyer page).  
Response:
```json
{ "status":"succeeded" }
```
Errors: `forbidden`, `not_found`  
Auth: same as above

**POST /api/webhooks/payments/sslcommerz/ipn**  
Purpose: Receive IPN.  
Request: gateway form POST payload  
Response: `200 OK` plain text or JSON `{ "ok": true }`  
Errors: `400 invalid_signature` (still 200 if you must prevent retries, but log)  
Auth: gateway signature/allowlist (no user auth)  
Notes: After IPN, call validation API per SSLCOMMERZ guidance. citeturn14view0turn15view0

**POST /api/webhooks/payments/bkash**  
Purpose: Receive bKash webhook/callback.  
Request: provider payload  
Response: `{ "ok": true }`  
Errors: `invalid_signature`  
Auth: provider verification

**POST /api/orders/{order_id}/refunds**  
Purpose: Request refund (admin or seller per policy).  
Headers: `Idempotency-Key` required  
Request:
```json
{ "amount_minor": 185000, "reason":"not_delivered" }
```
Response:
```json
{ "refund_id":"uuid", "status":"processing" }
```
Errors: `invalid_amount`, `invalid_state`, `forbidden`, `provider_refund_failed`  
Auth: admin/support; optionally seller with constraints

#### Logistics APIs

**POST /api/orders/{order_id}/shipments/quote**  
Purpose: Quote shipping options.  
Request:
```json
{ "destination": {"city":"Dhaka","area":"...","postcode":"..."}, "weight_grams": 500 }
```
Response:
```json
{ "quotes":[{"provider":"paperfly","fee_amount_minor":7000,"eta_days":1}] }
```
Errors: `invalid_address`, `provider_unavailable`, `invalid_state`  
Auth: seller org member

**POST /api/orders/{order_id}/shipments/book**  
Purpose: Book shipment.  
Headers: `Idempotency-Key` required  
Request:
```json
{ "provider":"paperfly", "service_level":"standard", "cod_amount_minor":0 }
```
Response:
```json
{ "shipment_id":"uuid","tracking_id":"ABC123","status":"booked" }
```
Errors: `invalid_state`, `booking_failed`, `forbidden`  
Auth: seller org member

**GET /api/shipments/{shipment_id}**  
Purpose: Shipment status for seller/admin.  
Response: shipment and events summary  
Errors: `forbidden`, `not_found`  
Auth: org member or admin

**POST /api/webhooks/couriers/{provider}**  
Purpose: Courier status updates (if supported).  
Response: `{ "ok": true }`  
Errors: `invalid_signature`  
Auth: provider verification

#### Disputes APIs

**POST /api/orders/{order_id}/disputes**  
Purpose: Open dispute.  
Request:
```json
{ "reason_code":"NOT_DELIVERED", "notes":"...", "evidence_upload_tokens":["..."] }
```
Response:
```json
{ "dispute_id":"uuid", "status":"open" }
```
Errors: `window_expired`, `invalid_state`  
Auth: buyer via access_code or logged in

**GET /api/disputes/{dispute_id}**  
Purpose: View dispute details.  
Response: dispute + evidence URLs (signed)  
Errors: `forbidden`, `not_found`  
Auth: buyer (access_code) or seller org member or admin

**POST /api/admin/disputes/{dispute_id}/resolve**  
Purpose: Admin resolution action.  
Request:
```json
{ "resolution":"REFUND_FULL", "notes":"...", "refund_amount_minor":185000 }
```
Response:
```json
{ "status":"resolved" }
```
Errors: `forbidden`, `invalid_state`  
Auth: admin/support

## Frontend specification

### **7. Frontend Structure**

You will build **three web apps** (can be a monorepo):

- Buyer Checkout Web (public)
- Seller Dashboard Web
- Admin Console Web

#### Routing structure (buyer)

- `/c/:token` → Checkout session
- `/o/:orderId` → Order status (requires `access_code` query)
- `/o/:orderId/pay` → Payment initiation + redirect
- `/o/:orderId/track` → Tracking timeline
- `/o/:orderId/dispute` → Dispute form

#### Buyer pages (page-by-page)

**Checkout page `/c/:token`**
- Purpose: show cart + seller + terms; collect shipping info; start payment.
- UI components:
  - Cart summary
  - Seller verification badge
  - Shipping address form
  - Payment method selector
  - “Pay now” button
- Interactions:
  - validate phone/address
  - on submit → call `POST /api/checkout/sessions/{token}/convert`
  - then call `POST /api/orders/{order_id}/payments/initiate`
  - redirect to pay_url (gateway)
- Error states:
  - expired session
  - invalid stock
  - gateway unavailable (show “Try again”)

**Order status `/o/:orderId`**
- Purpose: show current status and next action.
- API calls: `GET /api/orders/{order_id}/public?access_code=...`
- UX:
  - if PAYMENT_PENDING show “Pay now”
  - if IN_TRANSIT show tracking
  - if DELIVERED show “Confirm” / dispute option

#### Seller dashboard routes

- `/seller/login`
- `/seller/org/:orgId/overview`
- `/seller/org/:orgId/products`
- `/seller/org/:orgId/orders`
- `/seller/org/:orgId/orders/:orderId`
- `/seller/org/:orgId/shipments/:shipmentId`
- `/seller/org/:orgId/verification`
- `/seller/org/:orgId/settings`

Key seller interactions:
- product create/edit (upload images via signed URLs)
- generate checkout link
- view/pick orders
- book courier shipment
- view disputes

#### Admin console routes

- `/admin/login`
- `/admin/verification`
- `/admin/disputes`
- `/admin/orders`
- `/admin/risk-holds`
- `/admin/audit-logs`

### **8. State Management Design**

**Global vs local**
- Global: authenticated user, selected org, feature flags
- Local: page forms, modal state
- Server state: all data from APIs should be managed by TanStack Query

**Data fetching strategy**
- REST + TanStack Query
- Cache keys:
  - `order:{id}`
  - `orgOrders:{orgId}:{filters}`
  - `product:{id}`

**Loading/error/retry**
- Retry GETs 2–3 times with exponential backoff
- Never auto-retry POSTs unless idempotency keys are used
- Show offline banners on network failures

## Operations, security, DevOps, testing, and scaling

### **10. Authentication & Authorization**

**Auth method**
- OTP-first login
- JWT access tokens (short-lived)
- refresh tokens stored hashed in DB; delivered via httpOnly cookie

**RBAC**
- Platform roles: buyer, support_agent, admin
- Org roles: owner, staff
- Enforce at API layer with policy checks:
  - `canManageOrg(orgId)`
  - `canProcessRefund(orderId)`
  - `canResolveDispute(disputeId)`

**Session security best practices**
- Follow OWASP session management guidance (unique sessions, secure cookies, rotate refresh). citeturn8search20turn8search0
- If supporting passwords, align with NIST guidance (length >= 8, allow long passphrases, block compromised passwords). citeturn8search2

### **11. DevOps & Deployment**

**Environments**
- `dev` (local docker-compose)
- `staging` (mirrors prod integrations with sandbox gateways)
- `prod`

**CI/CD pipeline**
- Build:
  - lint + typecheck
  - unit tests
  - build docker images
- Test:
  - integration tests with Postgres + Redis
  - contract tests for adapters (mock providers)
- Deploy:
  - run migrations
  - deploy backend
  - deploy frontend
  - run smoke tests

**Deployment architecture**
- Kubernetes (recommended) or ECS
- Separate deployments:
  - api
  - worker (background jobs)
  - web-checkout
  - web-seller
  - web-admin

**Monitoring & logging**
- Structured logs with correlation IDs
- Metrics: request rates, P95 latency, payment success rate, webhook failures, courier booking failures
- Tracing: OpenTelemetry
- Alerting: payment webhook error spike, DB slow queries, queue backlog

**Scaling strategy**
- Horizontal scale stateless services (api, worker)
- Vertical scale Postgres initially; add read replicas when needed
- Use Redis cluster when queue volume grows

### **12. Code Structure (Modular & Scalable)**

**Backend folder structure**

```text
backend/
  src/
    main.ts
    app.module.ts
    config/
    common/
      http/
      errors/
      auth/
      logging/
      utils/
    modules/
      identity/
        controllers/
        services/
        repositories/
        dto/
        jobs/
        events/
      orgs/
      verification/
      catalog/
      checkout/
      orders/
      payments/
        adapters/
          sslcommerz/
          bkash/
      logistics/
        adapters/
          paperfly/
          pathao/
          redx/
      disputes/
      notifications/
      admin/
      audit/
    migrations/
    tests/
```

**Frontend folder structure**

```text
frontend/
  apps/
    checkout-web/
      pages/
      components/
      hooks/
    seller-web/
    admin-web/
  packages/
    ui/
    api-client/
    utils/
```

**Separation of concerns**
- Controllers: request/response mapping only
- Services: business logic + state machines
- Repositories: DB queries only
- Adapters: external provider integrations only
- Jobs: background processing only

### **13. Version Tracking (MANDATORY)**

Create a `TRACK.md` at repo root with strict update rules.

**TRACK.md format**

```markdown
# TRACK

## Current Version
- v0.3.0 (staging)

## Completed Modules
- [x] Identity & OTP
- [x] Organizations
- [ ] Payments (SSLCOMMERZ)
- [ ] Logistics (Paperfly)
- [ ] Disputes

## API Endpoints
- [x] POST /api/auth/otp/send
- [x] POST /api/auth/otp/verify
- [ ] POST /api/webhooks/payments/sslcommerz/ipn
- [ ] POST /api/orders/{id}/payments/initiate

## Features Implemented
- [x] Seller creates checkout link
- [ ] Buyer pays via payment link
- [ ] Courier booking

## Pending Tasks
- [ ] Add idempotency middleware
- [ ] Add payment reconciliation job
- [ ] Add order state machine guards

## Known Issues
- 2026-03-18: Staging OTP send rate limit too strict for shared IP networks.
```

**Developer rule**: every PR must update TRACK.md in the same commit as the feature work.

### **14. Testing Strategy**

**Unit tests**
- State machine transitions (orders, payments, shipments)
- Calculation functions (fees, totals)
- Policy checks (RBAC)

**Integration tests**
- API routes with Postgres + Redis
- Payment webhook ingestion idempotency
- Shipment booking retries

**End-to-end tests**
- Seller creates product → creates link → buyer checks out → payment mocked → shipment booked → delivered → payout eligible.

**Example test cases**
- Duplicate SSLCOMMERZ IPN posted twice must not double-credit ledger. citeturn14view0turn15view0
- Dispute opened during release window must block payout.
- Courier API timeout triggers retry then DLQ.

### **15. Edge Cases & Failure Handling**

- Network failures during payment redirect: buyer returns; system should allow “Resume payment” by reusing existing payment intent (idempotent).
- Invalid inputs: strict schema validation; reject unknown fields.
- Concurrency:
  - Two admins resolving same dispute → use row-level locks or optimistic versioning.
  - Webhook races → lock on `payment_intent_id` in Redis
- Data consistency:
  - Use transaction boundaries when moving order state + writing ledger entries.

### **16. Performance Optimization**

- Cache product + checkout session reads in Redis/CDN
- Keep checkout page assets minimal; use image optimization
- Index order tables heavily used in seller dashboards
- Use asynchronous processing for webhook → queue heavy work

### **17. Future Scalability Plan**

When scaling to millions:

- Split modular monolith into services:
  - payments-service (webhooks + ledger)
  - logistics-service (courier adapters)
  - notifications-service
- Introduce event streaming (Kafka/NATS) for order/payment events
- Database scaling:
  - read replicas
  - partition tables by time (order_events, payment_transactions)
  - move logs/events to cheaper storage (S3/warehouse)

### **18. Assumptions & Constraints**

**Assumptions**
- You will partner with a gateway/PSO/PSP for payment collection and any escrow-like settlement rules; you are not directly holding customer funds (reduces licensing exposure). citeturn10view0turn10view1turn10view3turn12view0
- You will comply with Digital Commerce guideline expectations: disclosures, consent/cookies notices, and transaction record retention. citeturn5view1turn5view2turn17view1turn16view0
- Courier integrations vary; system must support both API-based couriers and “manual tracking” fallback.

**Constraints**
- Bangladesh Bank circular source PDFs may be difficult to programmatically access; rely on partner compliance documentation + legal counsel for final controls. (Escrow policy existence and intent is publicly reported.) citeturn11view0turn12view0
- Delivery obligations and complaint SLAs should be configurable because sellers and product categories may differ. citeturn17view0turn17view2turn5view2
- Data hosting decisions should consider Bangladesh regulatory expectations for financial institutions and outsourcing. citeturn10view3turn10view0