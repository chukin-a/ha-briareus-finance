import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity('budget_periods')
export class BudgetPeriodEntity {
  @PrimaryColumn() id!: string;
  @Column({ name: 'budget_id', type: 'varchar' }) budgetId!: string;
  @Column({ name: 'start_on', type: 'varchar' }) startOn!: string;
  @Column({ name: 'end_on_exclusive', type: 'varchar' }) endOnExclusive!: string;
  @Column({ name: 'planned_amount_minor', type: 'integer' }) plannedAmountMinor!: number;
  @Column({ name: 'rollover_minor', type: 'integer', default: 0 }) rolloverMinor!: number;
  @Column({ type: 'varchar', default: 'open' }) status!: string;
}
