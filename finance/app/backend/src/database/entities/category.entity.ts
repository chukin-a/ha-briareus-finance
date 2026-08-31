import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('categories')
export class CategoryEntity {
  @PrimaryColumn() id!: string;
  @Column({ type: 'varchar' }) name!: string;
  @Column({ type: 'varchar' }) type!: string;
  @Column({ name: 'parent_id', type: 'varchar', nullable: true }) parentId!: string | null;
  @Column({ type: 'varchar' }) icon!: string;
  @Column({ type: 'varchar' }) color!: string;
  @Column({ name: 'sort_order', type: 'integer' }) sortOrder!: number;
  @Column({ type: 'boolean', default: false }) archived!: boolean;
}
