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

  @Column()
  precio!: number;

  @ManyToOne('Resivo', (resivo: Resivo) => resivo.productos)
  @JoinColumn({ name: 'resivo_id' })
  resivo!: Relation<Resivo>;
}