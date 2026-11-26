import { Component, OnDestroy, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ResivoService } from '../../../services/resivo.service';
import { ProductoService } from '../../../services/producto.service';
import { Resivo } from '../../../models/resivo.model';
import { Producto } from '../../../models/producto.model';
import { EstadoPeticion, PeticionComponent } from '../peticion/peticion.component';
import { NOMBRE_RECIBO_PRUEBA, Peticion, VistaPeticiones } from '../peticiones';

// /example/recorrido: the whole cycle of a resivo and of a producto, in two columns.
// Each column goes strictly in order (crear -> ver -> modificar -> eliminar).
// "Crear producto" is enabled as soon as the resivo exists. If the resivo is deleted
// first, its producto is deleted too (cascade): its pending steps get cancelled.
@Component({
  selector: 'app-recorrido',
  imports: [PeticionComponent],
  templateUrl: './recorrido.component.html',
  styleUrl: './recorrido.component.css',
})
export class RecorridoComponent extends VistaPeticiones implements OnDestroy {
  // ids created by the cycle (the next steps use them)
  private readonly resivoId = signal<number | null>(null);
  private readonly productoId = signal<number | null>(null);
  protected readonly limpiando = signal(false);

  private readonly hoy = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

  protected readonly recibo: Peticion[] = [
    {
      clave: 'r1',
      numero: 1,
      titulo: 'Crear recibo',
      metodo: 'POST',
      ruta: () => '/resivo',
      body: () => this.bodyRecibo(),
      llamar: () => this.resivoService.create(this.bodyRecibo()),
      alResponder: (r) => this.resivoId.set((r as Resivo).id),
    },
    {
      clave: 'r2',
      numero: 2,
      titulo: 'Ver recibo',
      metodo: 'GET',
      ruta: () => `/resivo/${idTexto(this.resivoId())}`,
      llamar: () => this.resivoService.getById(this.resivoId()!),
    },
    {
      clave: 'r3',
      numero: 3,
      titulo: 'Modificar recibo',
      metodo: 'PATCH',
      ruta: () => `/resivo/${idTexto(this.resivoId())}`,
      body: () => ({ metodoPago: 'Débito' }),
      llamar: () => this.resivoService.update(this.resivoId()!, { metodoPago: 'Débito' }),
    },
    {
      clave: 'r4',
      numero: 4,
      titulo: 'Eliminar recibo',
      metodo: 'DELETE',
      ruta: () => `/resivo/${idTexto(this.resivoId())}`,
      llamar: () => this.resivoService.delete(this.resivoId()!),
    },
  ];

  protected readonly producto: Peticion[] = [
    {
      clave: 'p1',
      numero: 1,
      titulo: 'Crear producto (en ese recibo)',
      metodo: 'POST',
      ruta: () => '/producto',
      body: () => this.bodyProducto(),
      llamar: () => this.productoService.create(this.bodyProducto()),
      alResponder: (p) => this.productoId.set((p as Producto).id),
    },
    {
      clave: 'p2',
      numero: 2,
      titulo: 'Ver producto',
      metodo: 'GET',
      ruta: () => `/producto/${idTexto(this.productoId())}`,
      llamar: () => this.productoService.getById(this.productoId()!),
    },
    {
      clave: 'p3',
      numero: 3,
      titulo: 'Modificar producto',
      metodo: 'PATCH',
      ruta: () => `/producto/${idTexto(this.productoId())}`,
      body: () => ({ cantidad: 3 }),
      llamar: () => this.productoService.update(this.productoId()!, { cantidad: 3 }),
    },
    {
      clave: 'p4',
      numero: 4,
      titulo: 'Eliminar producto',
      metodo: 'DELETE',
      ruta: () => `/producto/${idTexto(this.productoId())}`,
      llamar: () => this.productoService.delete(this.productoId()!),
    },
  ];

  // the two columns of the page
  protected readonly columnas = [
    { nombre: 'Recibo', ruta: '/resivo', pasos: this.recibo },
    { nombre: 'Producto', ruta: '/producto', pasos: this.producto },
  ];

  constructor(
    private resivoService: ResivoService,
    private productoService: ProductoService,
  ) {
    super();
  }

  // ---------- states ----------

  protected estado(p: Peticion): EstadoPeticion {
    if (this.cargando(p)) return 'cargando';
    const r = this.resultados()[p.clave];
    if (r?.ok) return 'ok';
    if (this.cancelada(p)) return 'cancelado';
    if (!this.habilitada(p)) return 'bloqueado';
    return r ? 'error' : 'listo';
  }

  // a step can be sent when the previous one of ITS column went well;
  // "crear producto" only needs the resivo to exist
  private habilitada(p: Peticion): boolean {
    if (p.clave === 'p1') return this.hecho('r1');
    const columna = this.columnaDe(p);
    const anterior = columna[columna.indexOf(p) - 1];
    return !anterior || this.hecho(anterior.clave);
  }

  // once the resivo is deleted, the producto steps that were not done can not be done:
  // the producto was deleted with it (or it can not be created anymore)
  private cancelada(p: Peticion): boolean {
    return this.producto.includes(p) && this.hecho('r4') && !this.hecho(p.clave);
  }

  protected esperando(p: Peticion): string {
    if (this.cancelada(p)) {
      return p.clave === 'p1'
        ? 'Se eliminó el recibo: ya no se puede crear el producto'
        : 'El producto se borró junto con el recibo';
    }
    if (p.clave === 'p1') return 'Esperando que se cree el recibo';
    const columna = this.columnaDe(p);
    const anterior = columna[columna.indexOf(p) - 1];
    return anterior ? `Esperando el paso ${anterior.numero}: ${anterior.titulo.toLowerCase()}` : '';
  }

  // the cycle is over when every step is done or cancelled
  protected terminado(): boolean {
    return [...this.recibo, ...this.producto].every(
      (p) => this.hecho(p.clave) || this.cancelada(p),
    );
  }

  protected productoCancelado(): boolean {
    return this.producto.some((p) => this.cancelada(p));
  }

  private hecho(clave: string): boolean {
    return this.resultados()[clave]?.ok ?? false;
  }

  private columnaDe(p: Peticion): Peticion[] {
    return this.recibo.includes(p) ? this.recibo : this.producto;
  }

  // ---------- start again / leave ----------

  // "Rehacer el proceso": deletes what the cycle created and did not delete, and starts again
  protected async rehacer(): Promise<void> {
    this.limpiando.set(true);
    await this.limpiar();
    this.resivoId.set(null);
    this.productoId.set(null);
    this.resultados.set({});
    this.limpiando.set(false);
  }

  // leaving the view (another tab or another page) also cleans what was left
  ngOnDestroy(): void {
    void this.limpiar();
  }

  private async limpiar(): Promise<void> {
    const id = this.resivoId();
    if (id !== null && !this.hecho('r4')) {
      // deleting the resivo also deletes its producto (ON DELETE CASCADE)
      await firstValueFrom(this.resivoService.delete(id)).catch(() => undefined);
    }
  }

  // ---------- bodies ----------

  private bodyRecibo() {
    return { nombre: NOMBRE_RECIBO_PRUEBA, tiempoCompra: this.hoy, metodoPago: 'Efectivo' };
  }

  private bodyProducto() {
    return {
      nombre: 'Producto de ejemplo',
      cantidad: 2,
      precio: 1500.5,
      resivoId: this.resivoId() ?? 0,
    };
  }
}

function idTexto(id: number | null): string {
  return id === null ? ':id' : String(id);
}
