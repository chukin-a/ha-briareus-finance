import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity('import_batches')
export class ImportBatchEntity {
  @PrimaryColumn() id!: string;
  @Column({ name: 'owner_id', type: 'varchar' }) ownerId!: string;
  @Column({ name: 'account_id', type: 'varchar' }) accountId!: string;
  @Column({ type: 'varchar' }) format!: string;
  @Column({ type: 'varchar' }) currency!: string;
  @Column({ type: 'varchar' }) status!: string;
  @Column({ name: 'idempotency_key', type: 'varchar', nullable: true, unique: true }) idempotencyKey!: string | null;
  @Column({ name: 'created_at', type: 'varchar' }) createdAt!: string;
  @Column({ name: 'confirmed_at', type: 'varchar', nullable: true }) confirmedAt!: string | null;
}
