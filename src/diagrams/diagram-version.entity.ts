import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Diagram } from './diagram.entity.js';

@Entity('diagram_versions')
export class DiagramVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  diagramId: string;

  @Column({ type: 'int' })
  versionNumber: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  label: string | null;

  @Column({ type: 'jsonb' })
  data: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  thumbnail: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Diagram, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'diagramId' })
  diagram: Diagram;
}
