import { Column, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import type { Resivo } from '../../resivo/entities/resivo.entity.js';
import type { Relation } from 'typeorm';

@Entity()
export class Producto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column()
  cantidad!: number;

  @Column({ type: 'double precision' })
  precio!: number;

  @ManyToOne('Resivo', (resivo: Resivo) => resivo.productos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'resivo_id' })
  resivo!: Relation<Resivo>;
}