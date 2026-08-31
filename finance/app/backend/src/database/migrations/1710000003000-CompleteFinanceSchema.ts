import { MigrationInterface, QueryRunner } from 'typeorm';
export class CompleteFinanceSchema1710000003000 implements MigrationInterface {
  name = 'CompleteFinanceSchema1710000003000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE categories ADD COLUMN archived boolean NOT NULL DEFAULT 0`);
    await q.query(`ALTER TABLE projects ADD COLUMN status varchar(16) NOT NULL DEFAULT 'active'`);
    await q.query(`ALTER TABLE projects ADD COLUMN end_on varchar(10)`);
    await q.query(`ALTER TABLE budgets ADD COLUMN cadence varchar(16) NOT NULL DEFAULT 'custom'`);
    await q.query(`ALTER TABLE budgets ADD COLUMN rollover_enabled boolean NOT NULL DEFAULT 0`);
    await q.query(`ALTER TABLE budgets ADD COLUMN warning_percent integer NOT NULL DEFAULT 80`);
    await q.query(`ALTER TABLE recurring_occurrences ADD COLUMN amount_minor integer`);
    await q.query(`ALTER TABLE recurring_occurrences ADD COLUMN description text`);
    await q.query(`ALTER TABLE installment_obligations ADD COLUMN transaction_id varchar(64)`);
    await q.query(`ALTER TABLE installment_obligations ADD COLUMN paid_at varchar(64)`);
    await q.query(`CREATE TABLE budget_periods (id varchar(64) PRIMARY KEY, budget_id varchar(64) NOT NULL, start_on varchar(10) NOT NULL, end_on_exclusive varchar(10) NOT NULL, planned_amount_minor integer NOT NULL, rollover_minor integer NOT NULL DEFAULT 0, status varchar(16) NOT NULL DEFAULT 'open', UNIQUE(budget_id,start_on))`);
    await q.query(`CREATE TABLE credit_card_terms (account_id varchar(64) PRIMARY KEY, statement_day integer NOT NULL, payment_day integer, grace_rule varchar(32) NOT NULL, fixed_days integer, warning_days integer NOT NULL DEFAULT 5)`);
    await q.query(`CREATE TABLE import_batches (id varchar(64) PRIMARY KEY, owner_id varchar(64) NOT NULL, account_id varchar(64) NOT NULL, format varchar(8) NOT NULL, currency varchar(8) NOT NULL, status varchar(24) NOT NULL, idempotency_key varchar(255) UNIQUE, created_at varchar(64) NOT NULL, confirmed_at varchar(64))`);
    await q.query(`CREATE TABLE import_rows (id varchar(64) PRIMARY KEY, batch_id varchar(64) NOT NULL, row_number integer NOT NULL, occurred_on varchar(10), amount_minor integer, type varchar(16), description text, external_id varchar(255), fingerprint varchar(64) NOT NULL, status varchar(24) NOT NULL, error text, transaction_id varchar(64), UNIQUE(batch_id,row_number))`);
    await q.query(`CREATE INDEX idx_import_rows_fingerprint ON import_rows(fingerprint)`);
    await q.query(`CREATE TABLE receipts (id varchar(64) PRIMARY KEY, owner_id varchar(64) NOT NULL, status varchar(16) NOT NULL, file_name varchar(255) NOT NULL, mime_type varchar(64) NOT NULL, stored_path varchar(512) NOT NULL, merchant varchar(255), occurred_on varchar(10), amount_minor integer, currency varchar(8), account_id varchar(64), category_id varchar(64), project_id varchar(64), description text, transaction_id varchar(64), created_at varchar(64) NOT NULL)`);
    await q.query(`CREATE TABLE application_settings (key varchar(128) PRIMARY KEY, value text NOT NULL)`);
    await q.query(`CREATE TABLE outbox_events (id varchar(64) PRIMARY KEY, type varchar(128) NOT NULL, payload text NOT NULL, status varchar(16) NOT NULL DEFAULT 'pending', attempts integer NOT NULL DEFAULT 0, next_attempt_at varchar(64) NOT NULL, created_at varchar(64) NOT NULL)`);
    await q.query(`CREATE INDEX idx_outbox_due ON outbox_events(status,next_attempt_at)`);
  }
  async down(q: QueryRunner): Promise<void> { for (const table of ['outbox_events','application_settings','receipts','import_rows','import_batches','credit_card_terms','budget_periods']) await q.query(`DROP TABLE IF EXISTS ${table}`); }
}
