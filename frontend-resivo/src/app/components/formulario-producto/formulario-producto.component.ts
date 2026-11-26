import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { ModalComponent } from '../modal/modal.component';
import { ResivoService } from '../../services/resivo.service';
import { ProductoService } from '../../services/producto.service';
import { mensajesDeError } from '../../services/api-error';
import { Producto } from '../../models/producto.model';
import { Resivo } from '../../models/resivo.model';
import { FechaPipe } from '../../pipes/fecha.pipe';

// the values of the form (null = the field is empty)
interface ModeloProducto {
  nombre: string;
  cantidad: number | null;
  precio: number | null;
  resivoId: number | null;
}

// Form of a producto inside a modal: the same one to create and to edit.
//   new (only from the modal of a resivo): [producto]="null" [reciboFijo]="recibo"
//        -> POST to that resivo; there is no <select>, it only says which resivo it goes to
//   edit: [producto]="p" [reciboInicial]="id of its resivo"
//        -> PATCH; a <select> with its resivo already chosen (another one moves it there)
// It emits (guardado) with the producto that the API answered, or (cerrar) if it is cancelled.
@Component({
  selector: 'app-formulario-producto',
  imports: [FormsModule, ModalComponent],
  templateUrl: './formulario-producto.component.html',
  styleUrl: './formulario-producto.component.css',
})
export class FormularioProductoComponent implements OnInit {
  // null = new producto
  @Input() producto: Producto | null = null;
  // editing: the resivo already chosen in the <select> (the one the producto is in now)
  @Input() reciboInicial: number | null = null;
  // new: the resivo it is added to (then there is no <select>)
  @Input() reciboFijo: Resivo | null = null;

  @Output() guardado = new EventEmitter<Producto>();
  @Output() cerrar = new EventEmitter<void>();

  // bound to the fields with [(ngModel)]
  protected modelo: ModeloProducto = { nombre: '', cantidad: 1, precio: null, resivoId: null };

  // options of the <select>: every resivo, the most recent first
  protected readonly recibos = signal<Resivo[]>([]);
  protected readonly cargandoRecibos = signal(true);
  protected readonly errorRecibos = signal(false);
  protected readonly guardando = signal(false);
  // errors that the API answered when saving
  protected readonly erroresApi = signal<string[]>([]);

  private readonly fecha = new FechaPipe();

  constructor(
    private resivoService: ResivoService,
    private productoService: ProductoService,
  ) {}

  ngOnInit(): void {
    // editing: the form starts with a copy of the data (nothing changes if it is cancelled)
    if (this.producto) {
      const { nombre, cantidad, precio } = this.producto;
      this.modelo = { nombre, cantidad, precio, resivoId: this.reciboInicial };
    } else {
      this.modelo.resivoId = this.reciboFijo?.id ?? this.reciboInicial;
    }

    // the options of the <select> are needed only when the resivo can be chosen
    if (this.reciboFijo) {
      this.cargandoRecibos.set(false);
      return;
    }
    this.resivoService.getAll().subscribe({
      next: (recibos) => {
        const ordenados = [...recibos].sort(
          (a, b) => b.tiempoCompra.localeCompare(a.tiempoCompra) || b.id - a.id,
        );
        this.recibos.set(ordenados);
        this.cargandoRecibos.set(false);
      },
      error: () => {
        this.errorRecibos.set(true);
        this.cargandoRecibos.set(false);
      },
    });
  }

  protected get titulo(): string {
    return this.producto ? 'Editar producto' : 'Nuevo producto';
  }

  // text of each option: "Local · 18/10/2026" (there are repeated locals, the date tells them apart)
  protected etiqueta(recibo: Resivo): string {
    return `${recibo.nombre} · ${this.fecha.transform(recibo.tiempoCompra)}`;
  }

  protected guardar(form: NgForm): void {
    this.erroresApi.set([]);
    if (form.invalid || this.modelo.resivoId === null) {
      return;
    }

    this.guardando.set(true);
    const datos = {
      nombre: this.modelo.nombre.trim(),
      cantidad: Number(this.modelo.cantidad),
      precio: Number(this.modelo.precio),
      resivoId: this.modelo.resivoId,
    };
    const pedido: Observable<Producto> = this.producto
      ? this.productoService.update(this.producto.id, datos)
      : this.productoService.create(datos);

    pedido.subscribe({
      next: (producto) => {
        this.guardando.set(false);
        this.guardado.emit(producto);
      },
      error: (e) => {
        // the modal stays open with the messages of the API
        this.guardando.set(false);
        this.erroresApi.set(mensajesDeError(e));
      },
    });
  }
}
