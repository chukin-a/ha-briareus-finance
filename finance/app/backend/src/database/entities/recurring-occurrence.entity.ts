import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('recurring_occurrences')
export class RecurringOccurrenceEntity {
  @PrimaryColumn() id!: string;
  @Column({ name: 'rule_id', type: 'varchar' }) ruleId!: string;
  @Column({ name: 'due_date', type: 'varchar' }) dueDate!: string;
  @Column({ type: 'varchar', default: 'pending' }) status!: string;
  @Column({ name: 'transaction_id', type: 'varchar', nullable: true }) transactionId!: string | null;
  @Column({ name: 'amount_minor', type: 'integer', nullable: true }) amountMinor!: number | null;
  @Column({ type: 'text', nullable: true }) description!: string | null;
}
