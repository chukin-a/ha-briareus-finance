import { MigrationInterface, QueryRunner } from 'typeorm';

export class FinancialPeriods1710000002000 implements MigrationInterface {
  name = 'FinancialPeriods1710000002000';
  async up(q: QueryRunner): Promise<void> {
    const columns = await q.query(`PRAGMA table_info(transactions)`);
    if (!columns.some((entry: { name: string }) => entry.name === 'occurred_on')) {
      await q.query(`ALTER TABLE transactions ADD COLUMN occurred_on varchar(10)`);
    }
    await q.query(`UPDATE transactions SET occurred_on = substr(occurred_at, 1, 10) WHERE occurred_on IS NULL`);
    await q.query(`CREATE INDEX IF NOT EXISTS idx_transactions_occurred_on ON transactions(occurred_on)`);
    await q.query(`CREATE INDEX IF NOT EXISTS idx_transactions_account_period ON transactions(account_id, occurred_on)`);
    await q.query(`CREATE INDEX IF NOT EXISTS idx_transactions_category_period ON transactions(category_id, occurred_on)`);
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS idx_transactions_category_period`); await q.query(`DROP INDEX IF EXISTS idx_transactions_account_period`); await q.query(`DROP INDEX IF EXISTS idx_transactions_occurred_on`); await q.query(`ALTER TABLE transactions DROP COLUMN occurred_on`);
  }
}
