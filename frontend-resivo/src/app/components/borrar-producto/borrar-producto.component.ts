import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { ProductoService } from '../../services/producto.service';
import { ResivoService } from '../../services/resivo.service';
import { mensajesDeError } from '../../services/api-error';
import { Producto } from '../../models/producto.model';
import { Resivo } from '../../models/resivo.model';
import { PrecioPipe } from '../../pipes/precio.pipe';
import { FechaPipe } from '../../pipes/fecha.pipe';
import { redondear } from '../../utils/dinero';

// Confirmation to delete a producto, inside a modal. It says the account of the producto and
// how the total of its resivo changes, and it does the DELETE.
//   from the modal of a resivo: [producto]="p" [recibo]="recibo"
//   from /productos:            [producto]="p"   (the resivo is asked to the API by its id)
// It emits (borrado) with the message of the API, or (cerrar) if it is cancelled.
@Component({
  selector: 'app-borrar-producto',
  imports: [ModalComponent, PrecioPipe, FechaPipe],
  templateUrl: './borrar-producto.component.html',
  styleUrl: './borrar-producto.component.css',
})
export class BorrarProductoComponent implements OnInit {
  @Input({ required: true }) producto!: Producto;
  // the resivo of the producto, if the page already has it (with its total)
  @Input() recibo: Resivo | null = null;

  @Output() borrado = new EventEmitter<string>();
  @Output() cerrar = new EventEmitter<void>();

  protected readonly reciboDelProducto = signal<Resivo | null>(null);
  protected readonly borrando = signal(false);
  protected readonly errores = signal<string[]>([]);

  constructor(
    private productoService: ProductoService,
    private resivoService: ResivoService,
  ) {}

  ngOnInit(): void {
    if (this.recibo) {
      this.reciboDelProducto.set(this.recibo);
    } else if (this.producto.resivoId !== undefined) {
      // the producto only brings its resivo without total: ask for it to calculate the new total
      this.resivoService.getById(this.producto.resivoId).subscribe({
        next: (recibo) => this.reciboDelProducto.set(recibo),
        error: () => this.reciboDelProducto.set(null),
      });
    }
  }

  // total of the resivo without this producto
  protected totalNuevo(recibo: Resivo): number {
    return redondear(recibo.total - this.producto.subtotal);
  }

  protected confirmar(): void {
    this.borrando.set(true);
    this.errores.set([]);
    this.productoService.delete(this.producto.id).subscribe({
      next: (respuesta) => {
        this.borrando.set(false);
        this.borrado.emit(respuesta.message);
      },
      error: (e) => {
        // the confirmation stays open with the error (e.g. it was already deleted: 404)
        this.borrando.set(false);
        this.errores.set(mensajesDeError(e));
      },
    });
  }
}
