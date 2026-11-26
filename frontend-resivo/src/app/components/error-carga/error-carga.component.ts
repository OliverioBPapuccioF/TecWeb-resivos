import { Component, EventEmitter, Input, Output } from '@angular/core';

// What a page shows when its data could not be loaded: the messages (from the API, or
// "No se pudo conectar con la API" if it does not answer) and a button to try again.
//   @else if (error(); as mensajes) { <app-error-carga [mensajes]="mensajes" (reintentar)="cargar()" /> }
@Component({
  selector: 'app-error-carga',
  imports: [],
  templateUrl: './error-carga.component.html',
  styleUrl: './error-carga.component.css',
})
export class ErrorCargaComponent {
  @Input({ required: true }) mensajes: string[] = [];
  @Output() reintentar = new EventEmitter<void>();
}
