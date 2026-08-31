import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity('users')
export class UserEntity { @PrimaryColumn({ type: 'varchar' }) id!: string; @Column({ type: 'varchar' }) name!: string; @Column({ name: 'created_at', type: 'varchar' }) createdAt!: string; @Column({ name: 'last_seen_at', type: 'varchar', nullable: true }) lastSeenAt!: string | null; @Column({ type: 'boolean', default: false }) blocked!: boolean; }
