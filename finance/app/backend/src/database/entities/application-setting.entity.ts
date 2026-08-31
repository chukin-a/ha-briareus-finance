import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity('application_settings')
export class ApplicationSettingEntity { @PrimaryColumn() key!: string; @Column({ type: 'text' }) value!: string; }
