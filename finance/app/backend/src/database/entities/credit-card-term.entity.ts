import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity('credit_card_terms')
export class CreditCardTermEntity {
  @PrimaryColumn({ name: 'account_id' }) accountId!: string;
  @Column({ name: 'statement_day', type: 'integer' }) statementDay!: number;
  @Column({ name: 'payment_day', type: 'integer', nullable: true }) paymentDay!: number | null;
  @Column({ name: 'grace_rule', type: 'varchar' }) graceRule!: string;
  @Column({ name: 'fixed_days', type: 'integer', nullable: true }) fixedDays!: number | null;
  @Column({ name: 'warning_days', type: 'integer', default: 5 }) warningDays!: number;
}
