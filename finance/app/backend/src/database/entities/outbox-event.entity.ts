import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity('outbox_events')
export class OutboxEventEntity {
  @PrimaryColumn() id!: string; @Column({ type: 'varchar' }) type!: string; @Column({ type: 'text' }) payload!: string;
  @Column({ type: 'varchar', default: 'pending' }) status!: string; @Column({ type: 'integer', default: 0 }) attempts!: number;
  @Column({ name: 'next_attempt_at', type: 'varchar' }) nextAttemptAt!: string; @Column({ name: 'created_at', type: 'varchar' }) createdAt!: string;
}
