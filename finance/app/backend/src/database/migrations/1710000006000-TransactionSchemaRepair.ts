import { MigrationInterface, QueryRunner } from 'typeorm';

export class TransactionSchemaRepair1710000006000 implements MigrationInterface {
  name = 'TransactionSchemaRepair1710000006000';

  async up(q: QueryRunner): Promise<void> {
    const columns = await q.query(`PRAGMA table_info(transactions)`) as Array<{ name: string; notnull: number }>;
    const sqlRows = await q.query(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'transactions'`) as Array<{ sql: string | null }>;
    const hasUserId = columns.some(column => column.name === 'user_id');
    const ownerColumn = columns.some(column => column.name === 'owner_id') ? 'owner_id' : hasUserId ? 'user_id' : "'local-dev-owner'";
    const needsRepair = hasUserId || !!sqlRows[0]?.sql?.includes(`CHECK (type IN ('income', 'expense', 'transfer'))`);

    if (!needsRepair) return;

    await q.query(`DROP INDEX IF EXISTS idx_transactions_user_id`);
    await q.query(`DROP INDEX IF EXISTS idx_transactions_account_id`);
    await q.query(`DROP INDEX IF EXISTS idx_transactions_occurred_at`);
    await q.query(`DROP INDEX IF EXISTS idx_transactions_external_key`);
    await q.query(`DROP INDEX IF EXISTS idx_transactions_occurred_on`);
    await q.query(`DROP INDEX IF EXISTS idx_transactions_account_period`);
    await q.query(`DROP INDEX IF EXISTS idx_transactions_category_period`);
    await q.query(`CREATE TABLE transactions_repaired (id varchar(64) PRIMARY KEY, owner_id varchar(64) NOT NULL, account_id varchar(64) NOT NULL, related_account_id varchar(64), project_id varchar(64), category_id varchar(64), type varchar(16) NOT NULL, amount_minor integer NOT NULL CHECK (amount_minor > 0), currency varchar(8) NOT NULL, description text, occurred_at varchar(64) NOT NULL, occurred_on varchar(10) NOT NULL, created_at varchar(64) NOT NULL, updated_at varchar(64), transfer_group_id varchar(64), external_key varchar(255))`);
    await q.query(`INSERT INTO transactions_repaired (id, owner_id, account_id, related_account_id, project_id, category_id, type, amount_minor, currency, description, occurred_at, occurred_on, created_at, updated_at, transfer_group_id, external_key) SELECT id, COALESCE(${ownerColumn}, 'local-dev-owner'), account_id, related_account_id, project_id, category_id, type, amount_minor, currency, description, occurred_at, COALESCE(occurred_on, substr(occurred_at, 1, 10)), created_at, updated_at, transfer_group_id, external_key FROM transactions`);
    await q.query(`DROP TABLE transactions`);
    await q.query(`ALTER TABLE transactions_repaired RENAME TO transactions`);
    await q.query(`CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id)`);
    await q.query(`CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON transactions(occurred_at)`);
    await q.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_external_key ON transactions(external_key) WHERE external_key IS NOT NULL`);
    await q.query(`CREATE INDEX IF NOT EXISTS idx_transactions_occurred_on ON transactions(occurred_on)`);
    await q.query(`CREATE INDEX IF NOT EXISTS idx_transactions_account_period ON transactions(account_id, occurred_on)`);
    await q.query(`CREATE INDEX IF NOT EXISTS idx_transactions_category_period ON transactions(category_id, occurred_on)`);
  }

  async down(): Promise<void> {
    // Compatibility repair is intentionally irreversible because SQLite table
    // rebuilds would otherwise reintroduce constraints that break current writes.
  }
}
