import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecurringAccountOptional1710000008000 implements MigrationInterface {
  name = 'RecurringAccountOptional1710000008000';

  async up(q: QueryRunner): Promise<void> {
    const columns = await q.query(`PRAGMA table_info(recurring_rules)`) as Array<{ name: string; notnull: number }>;
    const account = columns.find(column => column.name === 'account_id');
    if (!account || account.notnull === 0) return;

    await q.query(`CREATE TABLE recurring_rules_repaired (id varchar(64) PRIMARY KEY, owner_id varchar(64) NOT NULL, account_id varchar(64), type varchar(16) NOT NULL, amount_minor integer NOT NULL, currency varchar(8) NOT NULL, frequency varchar(16) NOT NULL, day_of_month integer, start_date varchar(32) NOT NULL, end_date varchar(32), category_id varchar(64), project_id varchar(64), description text, active boolean NOT NULL DEFAULT 1)`);
    await q.query(`INSERT INTO recurring_rules_repaired (id, owner_id, account_id, type, amount_minor, currency, frequency, day_of_month, start_date, end_date, category_id, project_id, description, active) SELECT id, owner_id, account_id, type, amount_minor, currency, frequency, day_of_month, start_date, end_date, category_id, project_id, description, active FROM recurring_rules`);
    await q.query(`DROP TABLE recurring_rules`);
    await q.query(`ALTER TABLE recurring_rules_repaired RENAME TO recurring_rules`);
  }

  async down(): Promise<void> {
    // Existing account-less rules cannot be safely made mandatory again.
  }
}
