import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import type { Producto } from '../../producto/entities/producto.entity.js';
import type { Relation } from 'typeorm';
import { redondear, subtotal } from '../../common/dinero.js';

@Entity()
export class Resivo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column({ type: 'date' })
  // Postgres returns a 'date' column as text 'YYYY-MM-DD' (no time, no timezone)
  tiempoCompra!: string;

  @Column()
  metodoPago!: string;

  @OneToMany('Producto', (producto: Producto) => producto.resivo)
  productos!: Relation<Producto[]>;

  get total(): number {
    // sum of the subtotals, rounded again (adding rounded numbers can bring the decimals back)
    return redondear(
      this.productos?.reduce(
        (total, producto) => total + subtotal(producto),
        0,
      ) ?? 0,
    );
  }
}
