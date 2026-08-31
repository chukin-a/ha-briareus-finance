import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserAccessControl1710000007000 implements MigrationInterface {
  name = 'UserAccessControl1710000007000';

  private async addColumnIfMissing(q: QueryRunner, column: string, definition: string) {
    const columns = await q.query(`PRAGMA table_info(users)`) as Array<{ name: string }>;
    if (!columns.some(entry => entry.name === column)) {
      await q.query(`ALTER TABLE users ADD COLUMN ${column} ${definition}`);
    }
  }

  async up(q: QueryRunner): Promise<void> {
    await this.addColumnIfMissing(q, 'last_seen_at', 'varchar(64)');
    await this.addColumnIfMissing(q, 'blocked', 'boolean NOT NULL DEFAULT 0');
    await q.query(`UPDATE users SET last_seen_at = COALESCE(last_seen_at, created_at), blocked = COALESCE(blocked, 0)`);
  }

  async down(): Promise<void> {
    // SQLite cannot safely drop compatibility columns without rebuilding users.
  }
}
