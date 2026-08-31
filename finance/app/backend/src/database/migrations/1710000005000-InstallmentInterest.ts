import { MigrationInterface, QueryRunner } from 'typeorm';

export class InstallmentInterest1710000005000 implements MigrationInterface {
  name = 'InstallmentInterest1710000005000';

  private async addColumnIfMissing(q: QueryRunner, table: string, column: string, definition: string) {
    const columns = await q.query(`PRAGMA table_info(${table})`);
    if (!columns.some((entry: { name: string }) => entry.name === column)) {
      await q.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }

  async up(q: QueryRunner): Promise<void> {
    await this.addColumnIfMissing(q, 'installment_plans', 'interest_mode', "varchar(24) NOT NULL DEFAULT 'none'");
    await this.addColumnIfMissing(q, 'installment_plans', 'monthly_rate_bps', 'integer NOT NULL DEFAULT 0');
    await this.addColumnIfMissing(q, 'installment_obligations', 'principal_minor', 'integer NOT NULL DEFAULT 0');
    await this.addColumnIfMissing(q, 'installment_obligations', 'interest_minor', 'integer NOT NULL DEFAULT 0');
    await q.query(`UPDATE installment_obligations SET principal_minor = amount_minor WHERE principal_minor = 0`);
  }

  async down(): Promise<void> {
    // Compatibility columns are retained to avoid rebuilding SQLite tables.
  }
}
