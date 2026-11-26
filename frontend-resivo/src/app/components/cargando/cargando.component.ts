import { Component, Input, OnDestroy, signal } from '@angular/core';

// after how long without an answer it says that the API is slow
const DEMORA_MS = 5000;

// Indicator while waiting for the API (style: .cargando in styles.css).
//   @if (cargando()) { <app-cargando texto="Cargando recibos" /> }
// If the answer takes more than 5 s, it adds a line: on Render (free plan) the API sleeps
// when it is not used, and the first request can take about a minute to wake it up.
@Component({
  selector: 'app-cargando',
  imports: [],
  templateUrl: './cargando.component.html',
  styleUrl: './cargando.component.css',
})
export class CargandoComponent implements OnDestroy {
  @Input() texto = 'Cargando';

  protected readonly demorado = signal(false);
  private readonly temporizador = setTimeout(() => this.demorado.set(true), DEMORA_MS);

  ngOnDestroy(): void {
    clearTimeout(this.temporizador);
  }
}
