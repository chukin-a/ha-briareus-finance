import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlanningAndAutomation1710000001000 implements MigrationInterface {
  name = 'PlanningAndAutomation1710000001000';

  private async hasColumn(q: QueryRunner, table: string, column: string) {
    const columns = await q.query(`PRAGMA table_info(${table})`);
    return columns.some((entry: { name: string }) => entry.name === column);
  }

  private async addColumnIfMissing(q: QueryRunner, table: string, column: string, definition: string) {
    if (!(await this.hasColumn(q, table, column))) {
      await q.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }

  async up(q: QueryRunner): Promise<void> {
    // Older development databases used user_id and omitted fields introduced
    // by the current domain model. Preserve those records while bringing the
    // schema to the same shape as a newly-created database.
    for (const table of ['accounts', 'projects', 'transactions']) {
      await this.addColumnIfMissing(q, table, 'owner_id', 'varchar(64)');
      if (await this.hasColumn(q, table, 'user_id')) {
        await q.query(`UPDATE ${table} SET owner_id = user_id WHERE owner_id IS NULL`);
      }
    }
    await this.addColumnIfMissing(q, 'transactions', 'category_id', 'varchar(64)');
    await this.addColumnIfMissing(q, 'accounts', 'initial_balance_minor', 'integer NOT NULL DEFAULT 0');
    await this.addColumnIfMissing(q, 'accounts', 'archived', 'boolean NOT NULL DEFAULT 0');
    await this.addColumnIfMissing(q, 'accounts', 'grace_period_rule', 'varchar(32)');
    await this.addColumnIfMissing(q, 'accounts', 'grace_period_day', 'integer');
    await this.addColumnIfMissing(q, 'transactions', 'updated_at', 'varchar(64)');
    await this.addColumnIfMissing(q, 'transactions', 'transfer_group_id', 'varchar(64)');
    await this.addColumnIfMissing(q, 'transactions', 'external_key', 'varchar(255)');
    await q.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_external_key ON transactions(external_key) WHERE external_key IS NOT NULL`);
    await q.query(`CREATE TABLE IF NOT EXISTS budgets (id varchar(64) PRIMARY KEY, owner_id varchar(64) NOT NULL, name varchar(255) NOT NULL, category_id varchar(64), project_id varchar(64), period_start varchar(32) NOT NULL, period_end varchar(32) NOT NULL, planned_amount_minor integer NOT NULL, currency varchar(8) NOT NULL, active boolean NOT NULL DEFAULT 1)`);
    await q.query(`CREATE TABLE IF NOT EXISTS recurring_rules (id varchar(64) PRIMARY KEY, owner_id varchar(64) NOT NULL, account_id varchar(64) NOT NULL, type varchar(16) NOT NULL, amount_minor integer NOT NULL, currency varchar(8) NOT NULL, frequency varchar(16) NOT NULL, day_of_month integer, start_date varchar(32) NOT NULL, end_date varchar(32), category_id varchar(64), project_id varchar(64), description text, active boolean NOT NULL DEFAULT 1)`);
    await q.query(`CREATE TABLE IF NOT EXISTS recurring_occurrences (id varchar(64) PRIMARY KEY, rule_id varchar(64) NOT NULL, due_date varchar(32) NOT NULL, status varchar(16) NOT NULL DEFAULT 'pending', transaction_id varchar(64), UNIQUE(rule_id, due_date))`);
    await q.query(`CREATE TABLE IF NOT EXISTS installment_plans (id varchar(64) PRIMARY KEY, owner_id varchar(64) NOT NULL, account_id varchar(64) NOT NULL, name varchar(255) NOT NULL, total_amount_minor integer NOT NULL, installment_count integer NOT NULL, first_due_date varchar(32) NOT NULL, frequency varchar(16) NOT NULL DEFAULT 'monthly', fee_minor integer NOT NULL DEFAULT 0, currency varchar(8) NOT NULL, status varchar(16) NOT NULL DEFAULT 'active')`);
    await q.query(`CREATE TABLE IF NOT EXISTS installment_obligations (id varchar(64) PRIMARY KEY, plan_id varchar(64) NOT NULL, sequence_number integer NOT NULL, due_date varchar(32) NOT NULL, amount_minor integer NOT NULL, status varchar(16) NOT NULL DEFAULT 'pending', UNIQUE(plan_id, sequence_number))`);
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE IF EXISTS installment_obligations'); await q.query('DROP TABLE IF EXISTS installment_plans'); await q.query('DROP TABLE IF EXISTS recurring_occurrences'); await q.query('DROP TABLE IF EXISTS recurring_rules'); await q.query('DROP TABLE IF EXISTS budgets'); await q.query('DROP INDEX IF EXISTS idx_transactions_external_key');
  }
}
