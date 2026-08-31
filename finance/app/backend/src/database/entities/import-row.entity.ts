import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity('import_rows')
export class ImportRowEntity {
  @PrimaryColumn() id!: string;
  @Column({ name: 'batch_id', type: 'varchar' }) batchId!: string;
  @Column({ name: 'row_number', type: 'integer' }) rowNumber!: number;
  @Column({ name: 'occurred_on', type: 'varchar', nullable: true }) occurredOn!: string | null;
  @Column({ name: 'amount_minor', type: 'integer', nullable: true }) amountMinor!: number | null;
  @Column({ type: 'varchar', nullable: true }) type!: string | null;
  @Column({ type: 'text', nullable: true }) description!: string | null;
  @Column({ name: 'external_id', type: 'varchar', nullable: true }) externalId!: string | null;
  @Column({ type: 'varchar' }) fingerprint!: string;
  @Column({ type: 'varchar' }) status!: string;
  @Column({ type: 'text', nullable: true }) error!: string | null;
  @Column({ name: 'transaction_id', type: 'varchar', nullable: true }) transactionId!: string | null;
}
