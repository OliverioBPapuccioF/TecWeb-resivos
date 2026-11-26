import { Component, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ModalComponent } from '../../../components/modal/modal.component';
import { CargandoComponent } from '../../../components/cargando/cargando.component';
import { AvisosService } from '../../../services/avisos.service';
import { ResivoService } from '../../../services/resivo.service';
import { ProductoService } from '../../../services/producto.service';
import { mensajesDeError } from '../../../services/api-error';
import { TablaProductosComponent } from '../../../components/tabla-productos/tabla-productos.component';
import { FechaPipe } from '../../../pipes/fecha.pipe';
import { PrecioPipe } from '../../../pipes/precio.pipe';
import { Resivo } from '../../../models/resivo.model';
import { Producto } from '../../../models/producto.model';

// /example/componentes: catalog to try the shared components
// (modal, modal with the productos of a resivo, cargando, avisos).
@Component({
  selector: 'app-componentes',
  imports: [ModalComponent, CargandoComponent, TablaProductosComponent, FechaPipe, PrecioPipe],
  templateUrl: './componentes.component.html',
  styleUrl: './componentes.component.css',
})
export class ComponentesComponent {
  // ---------- modal ----------
  protected readonly modalAbierto = signal(false);
  protected readonly guardando = signal(false);
  // errors of the API shown inside the modal
  protected readonly erroresModal = signal<string[]>([]);

  // ---------- modal with the productos of a resivo ----------
  protected readonly reciboAbierto = signal<Resivo | null>(null);
  // form of a producto (new or edit), opened ON TOP of the modal of productos
  protected readonly formularioProductoAbierto = signal(false);
  // the producto being edited (null = a new one)
  protected readonly productoEditando = signal<Producto | null>(null);
  protected readonly guardandoProducto = signal(false);
  protected readonly erroresProducto = signal<string[]>([]);
  // confirmation to delete a producto, also on top
  protected readonly productoBorrando = signal<Producto | null>(null);
  protected readonly borrandoProducto = signal(false);

  // ---------- cargando ----------
  protected readonly cargando = signal(false);
  protected readonly textoCargando = signal('Cargando');
  protected readonly resultadoCarga = signal('');

  constructor(
    protected avisos: AvisosService,
    private resivoService: ResivoService,
    private productoService: ProductoService,
  ) {}

  protected abrirModal(): void {
    this.erroresModal.set([]);
    this.modalAbierto.set(true);
  }

  // simulated: waits 2 s (meanwhile the modal can not be closed) and nothing is sent to the API
  protected async guardarSimulado(): Promise<void> {
    this.guardando.set(true);
    this.erroresModal.set([]);
    await new Promise((r) => setTimeout(r, 2000));
    this.guardando.set(false);
    this.modalAbierto.set(false);
    this.avisos.exito('Formulario de ejemplo guardado (simulado: no se mandó nada a la API).');
  }

  // real request that fails: the errors of the API are shown inside the modal
  protected async guardarConError(): Promise<void> {
    this.guardando.set(true);
    try {
      await firstValueFrom(this.resivoService.create({} as never));
    } catch (e) {
      this.erroresModal.set(mensajesDeError(e));
    }
    this.guardando.set(false);
  }

  // opens a real resivo: the one with more productos, or one without productos
  protected async verProductos(conProductos: boolean): Promise<void> {
    try {
      const recibos = await firstValueFrom(this.resivoService.getAll());
      const elegido = conProductos
        ? [...recibos].sort((a, b) => b.productos.length - a.productos.length)[0]
        : recibos.find((r) => r.productos.length === 0);
      if (elegido) {
        this.reciboAbierto.set(elegido);
      } else {
        this.avisos.error('No hay ningún recibo de ese tipo en la base.');
      }
    } catch (e) {
      this.avisos.error(mensajesDeError(e), 'No se pudieron cargar los recibos');
    }
  }

  // ---------- producto: new / edit / delete (simulated in this catalog, so the example data
  // is not changed; the real requests are connected in the CRUD of productos, step 16) ----------

  protected abrirNuevoProducto(): void {
    this.productoEditando.set(null);
    this.erroresProducto.set([]);
    this.formularioProductoAbierto.set(true);
  }

  // the same form, with the data of the producto already filled in
  protected editarProducto(p: Producto): void {
    this.productoEditando.set(p);
    this.erroresProducto.set([]);
    this.formularioProductoAbierto.set(true);
  }

  // simulated: waits 2 s and nothing is sent to the API (the modal of productos stays open)
  protected async guardarProductoSimulado(): Promise<void> {
    this.guardandoProducto.set(true);
    this.erroresProducto.set([]);
    await new Promise((r) => setTimeout(r, 2000));
    this.guardandoProducto.set(false);
    this.formularioProductoAbierto.set(false);
    const editado = this.productoEditando();
    this.avisos.exito(
      editado
        ? `"${editado.nombre}" modificado (simulado: no se mandó nada a la API).`
        : 'Producto de ejemplo guardado (simulado: no se mandó nada a la API).',
    );
  }

  // real request that fails, so the errors of the API are seen inside the modal:
  // new -> POST with only the resivoId · edit -> PATCH with cantidad 0 (nothing changes)
  protected async guardarProductoConError(recibo: Resivo): Promise<void> {
    this.guardandoProducto.set(true);
    const editado = this.productoEditando();
    try {
      await firstValueFrom(
        editado
          ? this.productoService.update(editado.id, { cantidad: 0 })
          : this.productoService.create({ resivoId: recibo.id } as never),
      );
    } catch (e) {
      this.erroresProducto.set(mensajesDeError(e));
    }
    this.guardandoProducto.set(false);
  }

  protected borrarProducto(p: Producto): void {
    this.productoBorrando.set(p);
  }

  // simulated: waits 1 s and nothing is deleted
  protected async confirmarBorradoSimulado(p: Producto): Promise<void> {
    this.borrandoProducto.set(true);
    await new Promise((r) => setTimeout(r, 1000));
    this.borrandoProducto.set(false);
    this.productoBorrando.set(null);
    this.avisos.exito(`"${p.nombre}" borrado (simulado: no se borró nada en la API).`);
  }

  protected async mostrarCargando(): Promise<void> {
    this.resultadoCarga.set('');
    this.textoCargando.set('Cargando');
    this.cargando.set(true);
    await new Promise((r) => setTimeout(r, 3000));
    this.cargando.set(false);
    this.resultadoCarga.set('Terminó la espera de 3 segundos.');
  }

  protected async cargarRecibos(): Promise<void> {
    this.resultadoCarga.set('');
    this.textoCargando.set('Cargando recibos');
    this.cargando.set(true);
    try {
      const recibos = await firstValueFrom(this.resivoService.getAll());
      this.resultadoCarga.set(`Llegaron ${recibos.length} recibos de la API.`);
    } catch (e) {
      this.avisos.error(mensajesDeError(e), 'No se pudieron cargar los recibos');
    }
    this.cargando.set(false);
  }

  // real errors of the API, shown as notices
  protected async errorReal404(): Promise<void> {
    try {
      await firstValueFrom(this.resivoService.getById(999999));
    } catch (e) {
      this.avisos.error(mensajesDeError(e));
    }
  }

  protected async errorReal400(): Promise<void> {
    try {
      await firstValueFrom(this.resivoService.create({} as never));
    } catch (e) {
      this.avisos.error(mensajesDeError(e), 'El recibo tiene errores');
    }
  }
}
