import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('yjs_updates')
export class YjsUpdate {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'uuid' })
  diagramId: string;

  @Column({ type: 'bytea' })
  update: Buffer;

  @CreateDateColumn()
  createdAt: Date;
}
