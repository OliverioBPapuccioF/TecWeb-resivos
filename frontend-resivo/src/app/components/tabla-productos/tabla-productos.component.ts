import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Producto } from '../../models/producto.model';
import { PrecioPipe } from '../../pipes/precio.pipe';
import { FechaPipe } from '../../pipes/fecha.pipe';

// Table of productos (styles: .tabla-contenedor, td.numero and .precio in styles.css),
// with the total at the end and Editar / Borrar on each row. It is used for the productos
// of one resivo (modal) and for every producto (/productos, with [conRecibo]="true": a
// column with the resivo of each one, that emits (verRecibo) when it is clicked).
// Whatever is marked with the attribute "pie" goes on the line of the total, on the right
// (e.g. <button pie class="btn-primario">Agregar producto</button>).
// It does not call the API: it emits which producto was chosen and the page decides.
//   <app-tabla-productos [productos]="recibo.productos" [total]="recibo.total"
//                        (editar)="..." (borrar)="..." />
@Component({
  selector: 'app-tabla-productos',
  imports: [PrecioPipe, FechaPipe],
  templateUrl: './tabla-productos.component.html',
  styleUrl: './tabla-productos.component.css',
})
export class TablaProductosComponent {
  @Input({ required: true }) productos: Producto[] = [];
  // total of the resivo (calculated by the API); not shown if it is not given
  @Input() total?: number;
  // false = only to look (no Editar / Borrar column)
  @Input() conAcciones = true;
  // true = column "Recibo" (local and date of the resivo of each producto)
  @Input() conRecibo = false;
  // what it says when there are no productos
  @Input() textoVacio = 'Este recibo todavía no tiene productos.';

  @Output() editar = new EventEmitter<Producto>();
  @Output() borrar = new EventEmitter<Producto>();
  // id of the resivo whose name was clicked (only with conRecibo)
  @Output() verRecibo = new EventEmitter<number>();
}
