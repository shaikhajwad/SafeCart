import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000001 implements MigrationInterface {
  name = 'InitialSchema1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // === USERS / IDENTITY ===
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "phone_e164" VARCHAR(20) UNIQUE,
        "email" VARCHAR(255) UNIQUE,
        "status" TEXT NOT NULL DEFAULT 'active',
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_phone" ON "users" ("phone_e164");`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "refresh_token_hash" TEXT NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "revoked_at" TIMESTAMPTZ,
        "user_agent" TEXT,
        "ip" TEXT,
        CONSTRAINT "PK_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sessions_user_id" ON "sessions" ("user_id");`);

    // === ORGS ===
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orgs" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "status" TEXT NOT NULL DEFAULT 'active',
        "verified_status" TEXT NOT NULL DEFAULT 'unverified',
        "support_phone" TEXT,
        "support_email" TEXT,
        "return_policy" TEXT,
        CONSTRAINT "PK_orgs" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "org_members" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "org_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'member',
        CONSTRAINT "PK_org_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_org_members_org_user" UNIQUE ("org_id", "user_id"),
        CONSTRAINT "FK_org_members_org" FOREIGN KEY ("org_id") REFERENCES "orgs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_org_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "org_compliance_profiles" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "org_id" uuid NOT NULL UNIQUE,
        "trade_license_number" TEXT,
        "nid_number" TEXT,
        "bank_account_number" TEXT,
        "bank_name" TEXT,
        "routing_number" TEXT,
        "vat_registration_number" TEXT,
        "encryption_iv" TEXT,
        CONSTRAINT "PK_org_compliance_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ocp_org" FOREIGN KEY ("org_id") REFERENCES "orgs"("id") ON DELETE CASCADE
      );
    `);

    // === VERIFICATION ===
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "verification_cases" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "org_id" uuid NOT NULL,
        "submitted_by" uuid NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "reviewed_by" uuid,
        "review_notes" TEXT,
        CONSTRAINT "PK_verification_cases" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vc_org" FOREIGN KEY ("org_id") REFERENCES "orgs"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "verification_documents" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "case_id" uuid NOT NULL,
        "doc_type" TEXT NOT NULL,
        "object_key" TEXT NOT NULL,
        "mime_type" TEXT NOT NULL DEFAULT 'application/octet-stream',
        "sha256" TEXT NOT NULL DEFAULT '',
        CONSTRAINT "PK_verification_documents" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vd_case" FOREIGN KEY ("case_id") REFERENCES "verification_cases"("id") ON DELETE CASCADE
      );
    `);

    // === CATALOG ===
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "org_id" uuid NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "category" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "FK_products_org" FOREIGN KEY ("org_id") REFERENCES "orgs"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_org_id" ON "products" ("org_id");`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_variants" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "product_id" uuid NOT NULL,
        "variant_name" TEXT NOT NULL DEFAULT 'default',
        "sku" TEXT,
        "price_minor" BIGINT NOT NULL,
        "stock_qty" INTEGER,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "PK_product_variants" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pv_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      );
    `);

    // === CHECKOUT ===
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "checkout_sessions" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "org_id" uuid NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "status" TEXT NOT NULL DEFAULT 'active',
        "expires_at" TIMESTAMPTZ NOT NULL,
        "snapshot" JSONB,
        CONSTRAINT "PK_checkout_sessions" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cs_token" ON "checkout_sessions" ("token");`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "org_id" uuid NOT NULL,
        "checkout_session_id" uuid,
        "buyer_phone" TEXT NOT NULL,
        "buyer_name" TEXT,
        "buyer_access_code" TEXT NOT NULL,
        "shipping_address" JSONB NOT NULL DEFAULT '{}',
        "subtotal_minor" BIGINT NOT NULL DEFAULT 0,
        "delivery_fee_minor" BIGINT NOT NULL DEFAULT 0,
        "discount_minor" BIGINT NOT NULL DEFAULT 0,
        "total_minor" BIGINT NOT NULL DEFAULT 0,
        "currency" TEXT NOT NULL DEFAULT 'BDT',
        "status" TEXT NOT NULL DEFAULT 'ORDER_CREATED',
        "paid_at" TIMESTAMPTZ,
        "handover_due_at" TIMESTAMPTZ,
        CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_org" FOREIGN KEY ("org_id") REFERENCES "orgs"("id")
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_org_status" ON "orders" ("org_id", "status");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_buyer_phone" ON "orders" ("buyer_phone");`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_items" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "order_id" uuid NOT NULL,
        "product_id" uuid,
        "variant_id" uuid,
        "title" TEXT NOT NULL,
        "unit_price_minor" BIGINT NOT NULL,
        "qty" INTEGER NOT NULL DEFAULT 1,
        "line_total_minor" BIGINT NOT NULL,
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_oi_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_events" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "order_id" uuid NOT NULL,
        "event_type" TEXT NOT NULL,
        "payload" JSONB NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_order_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_oe_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_oe_order_id" ON "order_events" ("order_id", "created_at");`);

    // === PAYMENTS ===
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_intents" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "order_id" uuid NOT NULL,
        "provider" TEXT NOT NULL,
        "provider_ref" TEXT,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "amount_minor" BIGINT NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'BDT',
        "pay_url" TEXT,
        "idempotency_key" TEXT NOT NULL UNIQUE,
        CONSTRAINT "PK_payment_intents" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pi_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_pi_order_id" ON "payment_intents" ("order_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_pi_status" ON "payment_intents" ("status");`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_txns" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "payment_intent_id" uuid NOT NULL,
        "provider_event_id" TEXT NOT NULL UNIQUE,
        "txn_status" TEXT NOT NULL,
        "raw_payload" JSONB NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_payment_txns" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pt_intent" FOREIGN KEY ("payment_intent_id") REFERENCES "payment_intents"("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refunds" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "payment_intent_id" uuid NOT NULL,
        "amount_minor" BIGINT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "provider_ref" TEXT,
        "reason" TEXT,
        CONSTRAINT "PK_refunds" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refunds_intent" FOREIGN KEY ("payment_intent_id") REFERENCES "payment_intents"("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "escrow_holds" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "order_id" uuid NOT NULL UNIQUE,
        "status" TEXT NOT NULL DEFAULT 'held',
        "policy_snapshot" JSONB NOT NULL DEFAULT '{}',
        "release_eligible_at" TIMESTAMPTZ,
        CONSTRAINT "PK_escrow_holds" PRIMARY KEY ("id"),
        CONSTRAINT "FK_eh_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_eh_status" ON "escrow_holds" ("status");`);

    // === LOGISTICS ===
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shipments" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "order_id" uuid NOT NULL UNIQUE,
        "provider" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'booked',
        "tracking_id" TEXT,
        "provider_ref" TEXT,
        "fee_minor" BIGINT,
        "cod_amount_minor" BIGINT NOT NULL DEFAULT 0,
        "idempotency_key" TEXT NOT NULL UNIQUE,
        CONSTRAINT "PK_shipments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_shipments_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_shipments_order_id" ON "shipments" ("order_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_shipments_status" ON "shipments" ("status");`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shipment_events" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "shipment_id" uuid NOT NULL,
        "event_type" TEXT NOT NULL,
        "location" TEXT,
        "payload" JSONB NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_shipment_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_se_shipment" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE
      );
    `);

    // === DISPUTES ===
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "disputes" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "order_id" uuid NOT NULL UNIQUE,
        "opened_by" uuid NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'open',
        "reason" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "resolved_by" uuid,
        "resolution_notes" TEXT,
        "refund_amount_minor" BIGINT,
        CONSTRAINT "PK_disputes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_disputes_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dispute_evidence" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "dispute_id" uuid NOT NULL,
        "uploaded_by" uuid NOT NULL,
        "object_key" TEXT NOT NULL,
        "mime_type" TEXT NOT NULL,
        "description" TEXT,
        CONSTRAINT "PK_dispute_evidence" PRIMARY KEY ("id"),
        CONSTRAINT "FK_de_dispute" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE CASCADE
      );
    `);

    // === NOTIFICATIONS ===
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_logs" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "user_id" uuid,
        "channel" TEXT NOT NULL,
        "recipient" TEXT NOT NULL,
        "template_key" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'queued',
        "payload" JSONB NOT NULL DEFAULT '{}',
        "error_message" TEXT,
        CONSTRAINT "PK_notification_logs" PRIMARY KEY ("id")
      );
    `);

    // === AUDIT ===
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "actor_id" uuid,
        "resource_type" TEXT NOT NULL,
        "resource_id" TEXT NOT NULL,
        "event_type" TEXT NOT NULL,
        "ip" TEXT,
        "user_agent" TEXT,
        "diff" JSONB,
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_al_actor_id" ON "audit_logs" ("actor_id", "created_at");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_al_resource" ON "audit_logs" ("resource_type", "resource_id");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_logs" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dispute_evidence" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "disputes" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shipment_events" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shipments" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "escrow_holds" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refunds" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_txns" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_intents" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_events" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "checkout_sessions" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_variants" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "verification_documents" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "verification_cases" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "org_compliance_profiles" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "org_members" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orgs" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE;`);
  }
}
