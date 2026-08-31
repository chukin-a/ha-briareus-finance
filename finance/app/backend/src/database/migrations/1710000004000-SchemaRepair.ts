import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaRepair1710000004000 implements MigrationInterface {
  name = 'SchemaRepair1710000004000';

  private async addColumnIfMissing(q: QueryRunner, table: string, column: string, definition: string) {
    const columns = await q.query(`PRAGMA table_info(${table})`);
    if (!columns.some((entry: { name: string }) => entry.name === column)) {
      await q.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }

  async up(q: QueryRunner): Promise<void> {
    await this.addColumnIfMissing(q, 'categories', 'archived', 'boolean NOT NULL DEFAULT 0');
    await this.addColumnIfMissing(q, 'projects', 'status', "varchar(16) NOT NULL DEFAULT 'active'");
    await this.addColumnIfMissing(q, 'projects', 'end_on', 'varchar(10)');
  }

  async down(): Promise<void> {
    // SQLite cannot safely remove these compatibility columns without
    // rebuilding tables, so the repair is intentionally irreversible.
  }
}
