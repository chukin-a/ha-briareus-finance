import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('projects')
export class ProjectEntity {
  @PrimaryColumn() id!: string;
  @Column({ name: 'owner_id', type: 'varchar' }) ownerId!: string;
  @Column({ type: 'varchar' }) name!: string;
  @Column({ name: 'planned_amount_minor', type: 'integer' }) plannedAmountMinor!: number;
  @Column({ type: 'varchar' }) currency!: string;
  @Column({ name: 'created_at', type: 'varchar' }) createdAt!: string;
  @Column({ type: 'varchar', default: 'active' }) status!: string;
  @Column({ name: 'end_on', type: 'varchar', nullable: true }) endOn!: string | null;
}
