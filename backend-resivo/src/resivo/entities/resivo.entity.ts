import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import type { Producto } from '../../producto/entities/producto.entity.js';
import type { Relation } from 'typeorm';

@Entity()
export class Resivo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column({ type: 'date' })
  tiempoCompra!: Date;

  @Column()
  metodoPago!: string;

  @OneToMany('Producto', (producto: Producto) => producto.resivo)
  productos!: Relation<Producto[]>;
}