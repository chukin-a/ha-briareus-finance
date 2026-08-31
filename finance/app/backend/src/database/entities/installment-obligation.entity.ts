import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('installment_obligations')
export class InstallmentObligationEntity {
  @PrimaryColumn() id!: string;
  @Column({ name: 'plan_id', type: 'varchar' }) planId!: string;
  @Column({ name: 'sequence_number', type: 'integer' }) sequenceNumber!: number;
  @Column({ name: 'due_date', type: 'varchar' }) dueDate!: string;
  @Column({ name: 'amount_minor', type: 'integer' }) amountMinor!: number;
  @Column({ name: 'principal_minor', type: 'integer', default: 0 }) principalMinor!: number;
  @Column({ name: 'interest_minor', type: 'integer', default: 0 }) interestMinor!: number;
  @Column({ type: 'varchar', default: 'pending' }) status!: string;
  @Column({ name: 'transaction_id', type: 'varchar', nullable: true }) transactionId!: string | null;
  @Column({ name: 'paid_at', type: 'varchar', nullable: true }) paidAt!: string | null;
}
