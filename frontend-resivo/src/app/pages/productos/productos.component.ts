import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { ResivoService } from '../../services/resivo.service';
import { AvisosService } from '../../services/avisos.service';
import { mensajesDeError } from '../../services/api-error';
import { Producto } from '../../models/producto.model';
import { Resivo } from '../../models/resivo.model';
import { CargandoComponent } from '../../components/cargando/cargando.component';
import { ErrorCargaComponent } from '../../components/error-carga/error-carga.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { TablaProductosComponent } from '../../components/tabla-productos/tabla-productos.component';
import { FechaPipe } from '../../pipes/fecha.pipe';
import { normalizar } from '../../utils/texto';
import { FormularioProductoComponent } from '../../components/formulario-producto/formulario-producto.component';
import { BorrarProductoComponent } from '../../components/borrar-producto/borrar-producto.component';

// ways to order the table (the first one keeps the order of the API)
export const ORDENES = [
  { valor: 'api', texto: 'Como se cargaron' },
  { valor: 'nombre-asc', texto: 'Producto: de A a Z' },
  { valor: 'nombre-desc', texto: 'Producto: de Z a A' },
  { valor: 'precio-desc', texto: 'Precio: mayor' },
  { valor: 'precio-asc', texto: 'Precio: menor' },
  { valor: 'subtotal-desc', texto: 'Subtotal: mayor' },
  { valor: 'subtotal-asc', texto: 'Subtotal: menor' },
  { valor: 'cantidad-desc', texto: 'Cantidad: mayor' },
  { valor: 'fecha-desc', texto: 'Fecha: más reciente' },
  { valor: 'fecha-asc', texto: 'Fecha: más antigua' },
] as const;
type Orden = (typeof ORDENES)[number]['valor'];

// /productos: every producto in a table, with the resivo it belongs to.
// The filter (search, price) and the order work on the list already loaded.
// The lines with a price of 0 or less are NOT productos: discounts (negative price, e.g.
// "Descuento jubilados") and gifts (price 0, e.g. "Bolsa de regalo"). They are not shown
// here (they are still in their resivo and in its total).
// Each row can be edited or deleted. New productos are created only from their resivo
// (in /recibos, in the modal of its productos).
@Component({
  selector: 'app-productos',
  imports: [
    FormsModule,
    CargandoComponent,
    ErrorCargaComponent,
    ModalComponent,
    TablaProductosComponent,
    FormularioProductoComponent,
    BorrarProductoComponent,
    FechaPipe,
  ],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css',
})
export class ProductosComponent {
  protected readonly ordenes = ORDENES;

  // what came from the API
  protected readonly productos = signal<Producto[]>([]);
  protected readonly cargando = signal(true);
  // messages of the error when loading (null = no error)
  protected readonly error = signal<string[] | null>(null);

  // filter (two-way binding with [(ngModel)])
  protected readonly busqueda = signal('');
  protected readonly orden = signal<Orden>('api');
  // price filter: "mayor que" / "menor que" a monto (null = no price filter)
  protected readonly comparador = signal<'mayor' | 'menor'>('mayor');
  protected readonly monto = signal<number | null>(null);

  // the resivo whose productos are shown in the modal (clicking its name in the table)
  protected readonly reciboAbierto = signal<Resivo | null>(null);

  // edit / delete a producto of the table
  protected readonly productoEditando = signal<Producto | null>(null);
  protected readonly productoBorrando = signal<Producto | null>(null);

  private readonly fecha = new FechaPipe();

  // the real productos: only the ones with a price greater than 0
  // (without discounts, negative price, and gifts, price 0)
  protected readonly productosReales = computed(() => this.productos().filter((p) => p.precio > 0));

  // the rows to show: the loaded list, filtered and ordered (recalculated by itself)
  protected readonly visibles = computed(() => {
    const texto = normalizar(this.busqueda().trim());
    const monto = this.monto();
    const hayMonto = typeof monto === 'number' && !Number.isNaN(monto);

    const filtrados = this.productosReales().filter((p) => {
      if (hayMonto && (this.comparador() === 'mayor' ? p.precio <= monto : p.precio >= monto)) {
        return false;
      }
      if (!texto) return true;
      return [p.nombre, p.resivo?.nombre ?? '', this.fecha.transform(p.resivo?.tiempoCompra)].some(
        (campo) => normalizar(campo).includes(texto),
      );
    });
    return ordenar(filtrados, this.orden());
  });

  protected readonly hayFiltro = computed(
    () => this.busqueda() !== '' || this.orden() !== 'api' || this.monto() !== null,
  );

  constructor(
    private productoService: ProductoService,
    private resivoService: ResivoService,
    private avisos: AvisosService,
  ) {
    // every time the page is opened, the list is requested again
    this.cargar();
  }

  // silencioso = true: refreshes the list without showing "Cargando" again (after saving)
  protected cargar(silencioso = false): void {
    if (!silencioso) {
      this.cargando.set(true);
    }
    this.error.set(null);
    this.productoService.getAll().subscribe({
      next: (productos) => {
        this.productos.set(productos);
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
    this.comparador.set('mayor');
    this.monto.set(null);
  }

  // ---------- edit / delete ----------

  protected alGuardar(producto: Producto): void {
    const anterior = this.productoEditando();
    this.productoEditando.set(null);
    const movido = anterior?.resivoId !== undefined && anterior.resivoId !== producto.resivoId;
    if (producto.precio <= 0) {
      // with a price of 0 or less it is not a producto anymore: it leaves this list
      this.avisos.exito(
        `"${producto.nombre}" ahora es un ${producto.precio < 0 ? 'descuento' : 'regalo'}: ya no aparece en Productos (sigue en su recibo).`,
        'Modificado',
      );
    } else {
      this.avisos.exito(
        movido
          ? `"${producto.nombre}" modificado y movido al recibo de ${producto.resivo?.nombre}.`
          : `"${producto.nombre}" modificado.`,
      );
    }
    this.cargar(true);
  }

  protected alBorrar(mensaje: string): void {
    this.productoBorrando.set(null);
    this.avisos.exito(mensaje, 'Borrado');
    this.cargar(true);
  }

  // the resivo is asked to the API, because the producto only brings it without its productos
  protected verRecibo(id: number): void {
    this.resivoService.getById(id).subscribe({
      next: (recibo) => this.reciboAbierto.set(recibo),
      error: (e) => this.avisos.error(mensajesDeError(e), 'No se pudo abrir el recibo'),
    });
  }
}

// returns a NEW ordered list (sort() would change the original one)
function ordenar(productos: Producto[], orden: Orden): Producto[] {
  const lista = [...productos];
  const fecha = (p: Producto) => p.resivo?.tiempoCompra ?? '';
  switch (orden) {
    case 'nombre-asc':
      return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    case 'nombre-desc':
      return lista.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es'));
    case 'precio-desc':
      return lista.sort((a, b) => b.precio - a.precio);
    case 'precio-asc':
      return lista.sort((a, b) => a.precio - b.precio);
    case 'subtotal-desc':
      return lista.sort((a, b) => b.subtotal - a.subtotal);
    case 'subtotal-asc':
      return lista.sort((a, b) => a.subtotal - b.subtotal);
    case 'cantidad-desc':
      return lista.sort((a, b) => b.cantidad - a.cantidad);
    case 'fecha-desc':
      return lista.sort((a, b) => fecha(b).localeCompare(fecha(a)) || b.id - a.id);
    case 'fecha-asc':
      return lista.sort((a, b) => fecha(a).localeCompare(fecha(b)) || a.id - b.id);
    default:
      return lista; // 'api': as the API sent them
  }
}
