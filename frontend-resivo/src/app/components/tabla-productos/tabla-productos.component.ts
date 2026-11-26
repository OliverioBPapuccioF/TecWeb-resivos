import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Producto } from '../../models/producto.model';
import { PrecioPipe } from '../../pipes/precio.pipe';

// Table with the productos of a resivo (styles: .tabla-contenedor, td.numero and .precio
// in styles.css), with the total at the end and Editar / Borrar on each row.
// Whatever is marked with the attribute "pie" goes on the line of the total, on the right
// (e.g. <button pie class="btn-primario">Agregar producto</button>).
// It does not call the API: it emits which producto was chosen and the page decides.
//   <app-tabla-productos [productos]="recibo.productos" [total]="recibo.total"
//                        (editar)="..." (borrar)="..." />
@Component({
  selector: 'app-tabla-productos',
  imports: [PrecioPipe],
  templateUrl: './tabla-productos.component.html',
  styleUrl: './tabla-productos.component.css',
})
export class TablaProductosComponent {
  @Input({ required: true }) productos: Producto[] = [];
  // total of the resivo (calculated by the API); not shown if it is not given
  @Input() total?: number;
  // false = only to look (no Editar / Borrar column)
  @Input() conAcciones = true;

  @Output() editar = new EventEmitter<Producto>();
  @Output() borrar = new EventEmitter<Producto>();
}
