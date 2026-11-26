import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ResivoService } from '../../services/resivo.service';
import { AvisosService } from '../../services/avisos.service';
import { mensajesDeError } from '../../services/api-error';
import { Resivo } from '../../models/resivo.model';
import { CargandoComponent } from '../../components/cargando/cargando.component';
import { ErrorCargaComponent } from '../../components/error-carga/error-carga.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { TablaProductosComponent } from '../../components/tabla-productos/tabla-productos.component';
import { FechaPipe } from '../../pipes/fecha.pipe';
import { normalizar } from '../../utils/texto';
import { PrecioPipe } from '../../pipes/precio.pipe';
import { FormularioReciboComponent } from './formulario-recibo/formulario-recibo.component';
import { FormularioProductoComponent } from '../../components/formulario-producto/formulario-producto.component';
import { BorrarProductoComponent } from '../../components/borrar-producto/borrar-producto.component';
import { Producto } from '../../models/producto.model';

// ways to order the cards (the first one keeps the order of the API)
export const ORDENES = [
  { valor: 'api', texto: 'Como se cargaron' },
  { valor: 'fecha-desc', texto: 'Fecha: más reciente' },
  { valor: 'fecha-asc', texto: 'Fecha: más antigua' },
  { valor: 'total-desc', texto: 'Total: mayor' },
  { valor: 'total-asc', texto: 'Total: menor' },
  { valor: 'local-asc', texto: 'Local: de A a Z' },
  { valor: 'local-desc', texto: 'Local: de Z a A' },
] as const;
type Orden = (typeof ORDENES)[number]['valor'];

// /recibos: every resivo in a card, with a search and an order chosen in the page, and the
// buttons to create, edit and delete them. In the modal of the productos of a resivo, its
// productos are added (the only place where productos are created), edited and deleted.
// The search and the order work on the list already loaded (they do not call the API again).
@Component({
  selector: 'app-recibos',
  imports: [
    FormsModule,
    CargandoComponent,
    ErrorCargaComponent,
    ModalComponent,
    TablaProductosComponent,
    FormularioReciboComponent,
    FormularioProductoComponent,
    BorrarProductoComponent,
    FechaPipe,
    PrecioPipe,
  ],
  templateUrl: './recibos.component.html',
  styleUrl: './recibos.component.css',
})
export class RecibosComponent {
  protected readonly ordenes = ORDENES;

  // what came from the API
  protected readonly recibos = signal<Resivo[]>([]);
  protected readonly cargando = signal(true);
  // messages of the error when loading (null = no error)
  protected readonly error = signal<string[] | null>(null);

  // filter (two-way binding with [(ngModel)])
  protected readonly busqueda = signal('');
  protected readonly orden = signal<Orden>('api');

  // the resivo whose productos are shown in the modal
  protected readonly reciboAbierto = signal<Resivo | null>(null);

  // productos of the open resivo: form (productoEditando null = a new one) and delete
  protected readonly formularioProductoAbierto = signal(false);
  protected readonly productoEditando = signal<Producto | null>(null);
  protected readonly productoBorrando = signal<Producto | null>(null);

  // form: open or not, and the resivo being edited (null = a new one)
  protected readonly formularioAbierto = signal(false);
  protected readonly reciboEditando = signal<Resivo | null>(null);

  // confirmation to delete a resivo
  protected readonly reciboBorrando = signal<Resivo | null>(null);
  protected readonly borrando = signal(false);
  protected readonly erroresBorrar = signal<string[]>([]);

  private readonly fecha = new FechaPipe();

  // the cards to show: the loaded list, filtered by the search and ordered.
  // computed() recalculates it by itself when recibos, busqueda or orden change
  protected readonly visibles = computed(() => {
    const texto = normalizar(this.busqueda().trim());
    const filtrados = texto
      ? this.recibos().filter((r) =>
          [r.nombre, r.metodoPago, this.fecha.transform(r.tiempoCompra)].some((campo) =>
            normalizar(campo).includes(texto),
          ),
        )
      : this.recibos();
    return ordenar(filtrados, this.orden());
  });

  protected readonly hayFiltro = computed(() => this.busqueda() !== '' || this.orden() !== 'api');

  constructor(
    private resivoService: ResivoService,
    private avisos: AvisosService,
  ) {
    // every time the page is opened, the list is requested again
    this.cargar();
  }

  // silencioso = true: refreshes the list without showing "Cargando" again
  // (after saving or deleting, so the cards do not disappear for a moment)
  protected cargar(silencioso = false): void {
    if (!silencioso) {
      this.cargando.set(true);
    }
    this.error.set(null);
    this.resivoService.getAll().subscribe({
      next: (recibos) => {
        this.recibos.set(recibos);
        this.cargando.set(false);
      },
      error: (e) => {
        const mensajes = mensajesDeError(e);
        this.error.set(mensajes);
        this.cargando.set(false);
      },
    });
  }

  protected limpiar(): void {
    this.busqueda.set('');
    this.orden.set('api');
  }

  // ---------- create / edit ----------

  protected nuevoRecibo(): void {
    this.reciboEditando.set(null);
    this.formularioAbierto.set(true);
  }

  protected editarRecibo(recibo: Resivo): void {
    this.reciboEditando.set(recibo);
    this.formularioAbierto.set(true);
  }

  // the form saved it: close it, show the notice and ask for the list again
  protected alGuardar(recibo: Resivo): void {
    const editado = this.reciboEditando() !== null;
    this.formularioAbierto.set(false);
    this.avisos.exito(
      editado ? `Recibo de "${recibo.nombre}" modificado.` : `Recibo de "${recibo.nombre}" creado.`,
    );
    this.cargar(true);
  }

  // ---------- productos of the open resivo ----------

  protected agregarProducto(): void {
    this.productoEditando.set(null);
    this.formularioProductoAbierto.set(true);
  }

  protected editarProducto(producto: Producto): void {
    this.productoEditando.set(producto);
    this.formularioProductoAbierto.set(true);
  }

  protected alGuardarProducto(producto: Producto, recibo: Resivo): void {
    const editado = this.productoEditando() !== null;
    this.formularioProductoAbierto.set(false);
    const movido = producto.resivoId !== recibo.id;
    this.avisos.exito(
      !editado
        ? `"${producto.nombre}" agregado al recibo.`
        : movido
          ? `"${producto.nombre}" modificado y movido al recibo de ${producto.resivo?.nombre}.`
          : `"${producto.nombre}" modificado.`,
    );
    this.actualizarRecibo(recibo.id);
  }

  protected alBorrarProducto(mensaje: string, recibo: Resivo): void {
    this.productoBorrando.set(null);
    this.avisos.exito(mensaje, 'Borrado');
    this.actualizarRecibo(recibo.id);
  }

  // asks the API again for the open resivo (its table and total in the modal) and for the
  // list (the total of its card); the modal of productos stays open
  private actualizarRecibo(id: number): void {
    this.resivoService.getById(id).subscribe({
      next: (recibo) => this.reciboAbierto.set(recibo),
      error: (e) => this.avisos.error(mensajesDeError(e), 'No se pudo actualizar el recibo'),
    });
    this.cargar(true);
  }

  // ---------- delete ----------

  protected pedirBorrado(recibo: Resivo): void {
    this.erroresBorrar.set([]);
    this.reciboBorrando.set(recibo);
  }

  protected confirmarBorrado(recibo: Resivo): void {
    this.borrando.set(true);
    this.erroresBorrar.set([]);
    this.resivoService.delete(recibo.id).subscribe({
      next: (respuesta) => {
        this.borrando.set(false);
        this.reciboBorrando.set(null);
        // the message of the API already says how many productos were deleted with it
        this.avisos.exito(respuesta.message, 'Borrado');
        this.cargar(true);
      },
      error: (e) => {
        // the confirmation stays open with the error (e.g. it was already deleted: 404)
        this.borrando.set(false);
        this.erroresBorrar.set(mensajesDeError(e));
      },
    });
  }
}

// returns a NEW ordered list (sort() would change the original one)
function ordenar(recibos: Resivo[], orden: Orden): Resivo[] {
  const lista = [...recibos];
  switch (orden) {
    case 'fecha-desc':
      return lista.sort((a, b) => b.tiempoCompra.localeCompare(a.tiempoCompra) || b.id - a.id);
    case 'fecha-asc':
      return lista.sort((a, b) => a.tiempoCompra.localeCompare(b.tiempoCompra) || a.id - b.id);
    case 'total-desc':
      return lista.sort((a, b) => b.total - a.total);
    case 'total-asc':
      return lista.sort((a, b) => a.total - b.total);
    case 'local-asc':
      return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    case 'local-desc':
      return lista.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es'));
    default:
      return lista; // 'api': as the API sent them
  }
}
