import { MigrationInterface, QueryRunner } from 'typeorm';

export class SingleTransactionDate1710000012000 implements MigrationInterface {
  name = 'SingleTransactionDate1710000012000';

  async up(queryRunner: QueryRunner) {
    await queryRunner.query("UPDATE transactions SET occurred_at = occurred_on || substr(occurred_at, 11) WHERE occurred_on IS NOT NULL");
    await queryRunner.query('DROP INDEX IF EXISTS idx_transactions_category_period');
    await queryRunner.query('DROP INDEX IF EXISTS idx_transactions_account_period');
    await queryRunner.query('DROP INDEX IF EXISTS idx_transactions_occurred_on');
    await queryRunner.query('ALTER TABLE transactions DROP COLUMN occurred_on');
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query('ALTER TABLE transactions ADD COLUMN occurred_on varchar(10)');
    await queryRunner.query('UPDATE transactions SET occurred_on = substr(occurred_at, 1, 10)');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_transactions_occurred_on ON transactions(occurred_on)');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_transactions_account_period ON transactions(account_id, occurred_on)');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_transactions_category_period ON transactions(category_id, occurred_on)');
  }
}
