import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('transactions')
export class TransactionEntity {
  @PrimaryColumn() id!: string;
  @Column({ name: 'owner_id', type: 'varchar' }) ownerId!: string;
  @Column({ name: 'account_id', type: 'varchar' }) accountId!: string;
  @Column({ name: 'related_account_id', type: 'varchar', nullable: true }) relatedAccountId!: string | null;
  @Column({ name: 'project_id', type: 'varchar', nullable: true }) projectId!: string | null;
  @Column({ name: 'category_id', type: 'varchar', nullable: true }) categoryId!: string | null;
  @Column({ type: 'varchar' }) type!: string;
  @Column({ name: 'amount_minor', type: 'integer' }) amountMinor!: number;
  @Column({ type: 'varchar' }) currency!: string;
  @Column({ type: 'text', nullable: true }) description!: string | null;
  @Column({ name: 'occurred_at', type: 'varchar' }) occurredAt!: string;
  @Column({ name: 'occurred_on', type: 'varchar' }) occurredOn!: string;
  @Column({ name: 'created_at', type: 'varchar' }) createdAt!: string;
  @Column({ name: 'updated_at', type: 'varchar', nullable: true }) updatedAt!: string | null;
  @Column({ name: 'transfer_group_id', type: 'varchar', nullable: true }) transferGroupId!: string | null;
  @Column({ name: 'external_key', type: 'varchar', nullable: true, unique: true }) externalKey!: string | null;
}
