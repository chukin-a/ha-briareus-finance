import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity('receipts')
export class ReceiptEntity {
  @PrimaryColumn() id!: string;
  @Column({ name: 'owner_id', type: 'varchar' }) ownerId!: string;
  @Column({ type: 'varchar' }) status!: string;
  @Column({ name: 'file_name', type: 'varchar' }) fileName!: string;
  @Column({ name: 'mime_type', type: 'varchar' }) mimeType!: string;
  @Column({ name: 'stored_path', type: 'varchar' }) storedPath!: string;
  @Column({ type: 'varchar', nullable: true }) merchant!: string | null;
  @Column({ name: 'occurred_on', type: 'varchar', nullable: true }) occurredOn!: string | null;
  @Column({ name: 'amount_minor', type: 'integer', nullable: true }) amountMinor!: number | null;
  @Column({ type: 'varchar', nullable: true }) currency!: string | null;
  @Column({ name: 'account_id', type: 'varchar', nullable: true }) accountId!: string | null;
  @Column({ name: 'category_id', type: 'varchar', nullable: true }) categoryId!: string | null;
  @Column({ name: 'project_id', type: 'varchar', nullable: true }) projectId!: string | null;
  @Column({ type: 'text', nullable: true }) description!: string | null;
  @Column({ name: 'transaction_id', type: 'varchar', nullable: true }) transactionId!: string | null;
  @Column({ name: 'created_at', type: 'varchar' }) createdAt!: string;
}
