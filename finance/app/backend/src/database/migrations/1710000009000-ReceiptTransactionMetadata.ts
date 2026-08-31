import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReceiptTransactionMetadata1710000009000 implements MigrationInterface {
  name = 'ReceiptTransactionMetadata1710000009000';

  async up(q: QueryRunner): Promise<void> {
    const columns = await q.query(`PRAGMA table_info(transactions)`) as Array<{ name: string }>;
    if (!columns.some(column => column.name === 'receipt_id')) await q.query(`ALTER TABLE transactions ADD COLUMN receipt_id varchar(64)`);
    if (!columns.some(column => column.name === 'metadata_json')) await q.query(`ALTER TABLE transactions ADD COLUMN metadata_json text`);
    if (!columns.some(column => column.name === 'tags_json')) await q.query(`ALTER TABLE transactions ADD COLUMN tags_json text`);
  }

  async down(q: QueryRunner): Promise<void> {
    // SQLite cannot safely drop columns on all supported versions; leave them in place.
  }
}
