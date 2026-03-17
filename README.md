# SafeCart

SafeCart is a **checkout + escrow-orchestration + courier-booking** platform built specifically for Bangladesh Facebook-based commerce (F-commerce). It lets sellers generate a **shareable checkout link** that can be pasted directly into Messenger or WhatsApp, giving buyers a standardised, trust-worthy purchase experience and giving sellers a compliant, automated fulfilment workflow.

> Full specifications: [`SRS.md`](./SRS.md) · [`Technical Doc.md`](<./Technical%20Doc.md>)

---

## Table of Contents

1. [Why SafeCart](#why-safecart)
2. [Key Features](#key-features)
3. [Architecture Overview](#architecture-overview)
4. [Tech Stack](#tech-stack)
5. [Module Breakdown](#module-breakdown)
6. [Folder Structure](#folder-structure)
7. [Development Setup](#development-setup)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Compliance Notes](#compliance-notes)
11. [Roadmap](#roadmap)
12. [Contributing](#contributing)

---

## Why SafeCart

Bangladesh social commerce is efficient for discovery but weak in:

- **consistent checkout & policy disclosure** – terms vary per seller
- **payment safety & refund predictability** – buyers pay blindly, refunds are informal
- **delivery orchestration** – no standard SLA or tracking visibility
- **complaint/dispute handling** – no audit trail or formal resolution process

Bangladesh's **Digital Commerce Operation Guidelines 2021** impose concrete requirements on sellers: disclosures & consent, record retention (≥ 6 years), 48-hour courier handover after full payment, 72-hour complaint resolution, and explicit permission to use **Bangladesh Bank-approved escrow service** for transactions. SafeCart productises all of those into a single, standard workflow.

---

## Key Features

| Area | Feature |
|---|---|
| **Seller tools** | Onboarding & KYC/verification; catalog or quick-order link creation; courier booking; payout tracking |
| **Checkout** | Mobile-first hosted checkout page; buyer address & terms capture; cookie notice & data-consent banner |
| **Payments** | SSLCOMMERZ (payment links + IPN + order validation); bKash tokenised checkout; idempotent webhook ingestion |
| **Escrow** | State machine: hold → ship → deliver → release (or dispute paths); refund automation |
| **Logistics** | Multi-courier abstraction (Pathao, eCourier, Paperfly, RedX); delivery SLA timers; manual fallback |
| **Disputes** | Evidence capture; SLA-tracked resolution; refund workflow; audit log |
| **Notifications** | SMS / email / push / WhatsApp via provider abstraction |
| **Admin console** | KYC approval; risk holds; dispute resolution; reporting exports |
| **Compliance** | 6-year immutable audit logs; trade license / TIN / UBID display; exportable records |

---

## Architecture Overview

```text
                       +----------------------+
                       |   Admin Web (React)  |
                       +----------+-----------+
                                  |
                                  v
+--------------------+  +--------------------+  +------------------------+
| Buyer Checkout     |→ | API Gateway / BFF  |→ | Modular Monolith App   |
| (Next.js SSR)      |  | rate-limit, auth   |  | (Domain Modules)       |
+--------------------+  +----------+---------+  +---+----------+---------+
                                   |                 |          |
                                   v                 v          v
                      +--------------------+   +----------+  +------------------+
                      | PostgreSQL         |   | Redis    |  | Object Storage   |
                      | (system of record) |   | cache/q  |  | S3-compatible    |
                      +--------------------+   +----------+  +------------------+
```

**External integrations** (async via webhooks / background jobs):
- Payment gateways: SSLCOMMERZ, bKash, PortWallet
- Courier partners: Pathao, eCourier, Paperfly, RedX
- SMS / Email / Push providers

**Design choice – Modular Monolith**  
Orders, payments, and shipments are tightly coupled and require strong transactional guarantees. A modular monolith with an internal event bus reduces failure modes while module boundaries are clean enough for future service extraction.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | TypeScript + NestJS (or Fastify), PostgreSQL, Redis + BullMQ |
| **Buyer checkout** | Next.js (SSR + edge caching) |
| **Seller & admin dashboards** | React + TypeScript + TanStack Query |
| **Background workers** | BullMQ + scheduled cron jobs |
| **Infrastructure** | Kubernetes (or ECS), Docker, GitHub Actions CI/CD |
| **Observability** | OpenTelemetry traces, structured logs, Prometheus metrics |
| **Object storage** | S3-compatible (KYC docs, product images, dispute evidence) |

---

## Module Breakdown

| Module | Responsibility |
|---|---|
| **A – Identity & Access** | OTP login, refresh tokens, RBAC (buyer / seller / staff / admin) |
| **B – Org & Seller Profile** | Shop profile, business identifiers (trade license, TIN, UBID) |
| **C – Seller Verification (KYC)** | Document upload, admin review workflow, compliance status |
| **D – Catalog & Pricing** | Products, variants, pricing, "create order link" |
| **E – Checkout & Orders** | Order creation, state machine (pending → confirmed → shipped → delivered) |
| **F – Payments & Escrow** | Gateway adapters, IPN/webhook ingestion, ledger, escrow hold/release |
| **G – Logistics** | Courier quotes/booking, tracking, delivery OTP, SLA timers |
| **H – Disputes, Returns, Refunds** | Ticket workflow, evidence, SLA, refund automation |
| **I – Notifications** | SMS/email/push via abstracted provider adapters |
| **J – Admin, Risk & Moderation** | Verification review, risk holds, escalation, audit tools |
| **K – Audit & Reporting** | Immutable event log, exportable records, 6-year retention |

All modules communicate via **interfaces and domain events** – no module writes directly into another module's tables.

---

## Folder Structure

```text
backend/
  src/
    modules/
      identity/          # auth, OTP, sessions
      orgs/              # seller profile
      verification/      # KYC
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

frontend/
  apps/
    checkout-web/        # public buyer checkout (Next.js)
    seller-web/          # seller dashboard
    admin-web/           # admin console
  packages/
    ui/
    api-client/
    utils/
```

---

## Development Setup

```bash
# 1. Install dependencies
npm install           # from repo root (or per app/package)

# 2. Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# 3. Run database migrations
npm run migration:run --workspace=backend

# 4. Start backend
npm run dev --workspace=backend

# 5. Start buyer checkout web
npm run dev --workspace=frontend/apps/checkout-web
```

Copy `.env.example` to `.env` and fill in gateway credentials and database URLs before starting.

---

## Testing

```bash
# Unit tests (state machines, fee calculations, RBAC policies)
npm run test --workspace=backend

# Integration tests (API routes + Postgres + Redis)
npm run test:integration --workspace=backend

# End-to-end tests
npm run test:e2e
```

Key test scenarios:
- Duplicate SSLCOMMERZ IPN posted twice must **not** double-credit the ledger (idempotency).
- Dispute opened during escrow release window must **block** payout.
- Courier API timeout must trigger retry and then route to DLQ.

---

## Deployment

Three environments are defined: `dev` (docker-compose), `staging` (sandbox gateways), and `prod`.

CI/CD pipeline (GitHub Actions):
1. Lint + typecheck
2. Unit tests
3. Build Docker images
4. Integration tests with Postgres + Redis
5. Run DB migrations
6. Deploy API, Worker, and all frontend apps
7. Smoke tests

Kubernetes workloads: `api`, `worker`, `web-checkout`, `web-seller`, `web-admin`.

---

## Compliance Notes

SafeCart is designed to help sellers meet **Bangladesh Digital Commerce Operation Guidelines 2021**:

- **Cookie notice & consent** – displayed on buyer checkout page for any non-essential cookies.
- **Personal data consent** – buyers informed about data collection; explicit checkbox required.
- **Record retention** – transaction records stored for ≥ 6 years; legal hold capability included.
- **Delivery SLA** – 48-hour courier handover timer enforced after full payment; automated reminders sent to seller.
- **Complaint handling** – 72-hour resolution SLA tracked and escalated automatically.
- **Refunds** – automated workflow aligned with guideline refund timelines.
- **Escrow** – SafeCart never holds funds directly; escrow-style hold/release is orchestrated through a Bangladesh Bank-approved licensed PSP/PSO partner.

> ⚠️ Exact Bangladesh Bank escrow circular details must be reviewed with a licensed PSP/PSO partner and legal counsel.

---

## Roadmap

A **30-day MVP** scope is defined in [`Technical Doc.md`](<./Technical%20Doc.md>):

| Week | Milestone |
|---|---|
| 1 | Repo + CI/CD, core DB schema, OTP auth + RBAC |
| 2 | Seller org/compliance profile, checkout link, buyer checkout pages |
| 3 | SSLCOMMERZ adapter + IPN, courier adapter (Pathao or eCourier) |
| 4 | Disputes + refunds MVP, SLA jobs + notifications, admin console MVP |
| 4+ | E2E & load tests, pilot readiness, monitoring hardening |

---

## Contributing

Every pull request **must** update [`TRACK.md`](./TRACK.md) in the same commit as the feature work. `TRACK.md` tracks the current version, completed modules, implemented API endpoints, and known issues.
