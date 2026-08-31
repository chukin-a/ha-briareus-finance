import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('installment_plans')
export class InstallmentPlanEntity {
  @PrimaryColumn() id!: string;
  @Column({ name: 'owner_id', type: 'varchar' }) ownerId!: string;
  @Column({ name: 'account_id', type: 'varchar' }) accountId!: string;
  @Column({ type: 'varchar' }) name!: string;
  @Column({ name: 'total_amount_minor', type: 'integer' }) totalAmountMinor!: number;
  @Column({ name: 'installment_count', type: 'integer' }) installmentCount!: number;
  @Column({ name: 'first_due_date', type: 'varchar' }) firstDueDate!: string;
  @Column({ name: 'frequency', type: 'varchar', default: 'monthly' }) frequency!: string;
  @Column({ name: 'fee_minor', type: 'integer', default: 0 }) feeMinor!: number;
  @Column({ name: 'interest_mode', type: 'varchar', default: 'none' }) interestMode!: 'none' | 'flat' | 'declining';
  @Column({ name: 'monthly_rate_bps', type: 'integer', default: 0 }) monthlyRateBps!: number;
  @Column({ type: 'varchar' }) currency!: string;
  @Column({ type: 'varchar', default: 'active' }) status!: string;
}
