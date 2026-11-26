import { Component, Input } from '@angular/core';

// Indicator while waiting for the API (style: .cargando in styles.css).
//   @if (cargando()) { <app-cargando texto="Cargando recibos" /> }
@Component({
  selector: 'app-cargando',
  imports: [],
  templateUrl: './cargando.component.html',
  styleUrl: './cargando.component.css',
})
export class CargandoComponent {
  @Input() texto = 'Cargando';
}
