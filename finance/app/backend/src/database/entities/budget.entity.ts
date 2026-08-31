import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('budgets')
export class BudgetEntity {
  @PrimaryColumn() id!: string;
  @Column({ name: 'owner_id', type: 'varchar' }) ownerId!: string;
  @Column({ type: 'varchar' }) name!: string;
  @Column({ name: 'category_id', type: 'varchar', nullable: true }) categoryId!: string | null;
  @Column({ name: 'project_id', type: 'varchar', nullable: true }) projectId!: string | null;
  @Column({ name: 'period_start', type: 'varchar' }) periodStart!: string;
  @Column({ name: 'period_end', type: 'varchar' }) periodEnd!: string;
  @Column({ name: 'planned_amount_minor', type: 'integer' }) plannedAmountMinor!: number;
  @Column({ type: 'varchar' }) currency!: string;
  @Column({ type: 'boolean', default: true }) active!: boolean;
  @Column({ type: 'varchar', default: 'custom' }) cadence!: string;
  @Column({ name: 'rollover_enabled', type: 'boolean', default: false }) rolloverEnabled!: boolean;
  @Column({ name: 'warning_percent', type: 'integer', default: 80 }) warningPercent!: number;
}
