import { MigrationInterface, QueryRunner } from 'typeorm';

/** Converts legacy budget definitions and period records to calendar-month budgets. */
export class ConvertBudgetsToMonthly1710000011000 implements MigrationInterface {
  name = 'ConvertBudgetsToMonthly1710000011000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      UPDATE budgets
      SET cadence = 'monthly',
          period_start = date(period_start, 'start of month'),
          period_end = date(period_start, 'start of month', '+1 month')
    `);
    await q.query(`
      UPDATE budget_periods
      SET start_on = date(start_on, 'start of month'),
          end_on_exclusive = date(start_on, 'start of month', '+1 month')
    `);
  }

  async down(): Promise<void> {
    // The original cadence and custom period boundaries cannot be reconstructed.
  }
}
