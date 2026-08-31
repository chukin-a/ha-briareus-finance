import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('recurring_rules')
export class RecurringRuleEntity {
  @PrimaryColumn() id!: string;
  @Column({ name: 'owner_id', type: 'varchar' }) ownerId!: string;
  @Column({ name: 'account_id', type: 'varchar' }) accountId!: string;
  @Column({ type: 'varchar' }) type!: string;
  @Column({ name: 'amount_minor', type: 'integer' }) amountMinor!: number;
  @Column({ type: 'varchar' }) currency!: string;
  @Column({ name: 'frequency', type: 'varchar' }) frequency!: string;
  @Column({ name: 'day_of_month', type: 'integer', nullable: true }) dayOfMonth!: number | null;
  @Column({ name: 'start_date', type: 'varchar' }) startDate!: string;
  @Column({ name: 'end_date', type: 'varchar', nullable: true }) endDate!: string | null;
  @Column({ name: 'category_id', type: 'varchar', nullable: true }) categoryId!: string | null;
  @Column({ name: 'project_id', type: 'varchar', nullable: true }) projectId!: string | null;
  @Column({ type: 'text', nullable: true }) description!: string | null;
  @Column({ type: 'boolean', default: true }) active!: boolean;
}
