import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('accounts')
export class AccountEntity {
  @PrimaryColumn() id!: string;
  @Column({ name: 'owner_id', type: 'varchar' }) ownerId!: string;
  @Column({ type: 'varchar' }) name!: string;
  @Column({ type: 'varchar' }) type!: string;
  @Column({ type: 'varchar' }) currency!: string;
  @Column({ name: 'credit_limit_minor', type: 'integer', nullable: true }) creditLimitMinor!: number | null;
  @Column({ name: 'grace_period_rule', type: 'varchar', nullable: true }) gracePeriodRule!: string | null;
  @Column({ name: 'grace_period_day', type: 'integer', nullable: true }) gracePeriodDay!: number | null;
  @Column({ name: 'initial_balance_minor', type: 'integer', default: 0 }) initialBalanceMinor!: number;
  @Column({ type: 'boolean', default: false }) archived!: boolean;
  @Column({ name: 'created_at', type: 'varchar' }) createdAt!: string;
}
