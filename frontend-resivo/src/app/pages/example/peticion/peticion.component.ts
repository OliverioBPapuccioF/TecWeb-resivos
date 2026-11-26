import { Component, EventEmitter, Input, Output } from '@angular/core';
import { JsonPipe } from '@angular/common';

export type Metodo = 'GET' | 'POST' | 'PATCH' | 'DELETE';

// bloqueado = waiting for the previous step · listo = it can be sent
// cargando = waiting for the answer · ok = answered 2xx · error = answered with an error
// cancelado = it can not be done anymore (e.g. its resivo was deleted)
export type EstadoPeticion = 'bloqueado' | 'listo' | 'cargando' | 'ok' | 'error' | 'cancelado';

// what is shown in the Response panel
export interface Resultado {
  ok: boolean;
  status: number;
  ms: number;
  cuerpo: unknown;
  // messages in Spanish (only for errors), from mensajesDeError()
  mensajes?: string[];
}

// One box of the /example page: the request (method, URL, body) and its answer.
// It does not call the API: it only shows the data it receives and emits (enviar)
// when its button is pressed; the page does the request.
@Component({
  selector: 'app-peticion',
  imports: [JsonPipe],
  templateUrl: './peticion.component.html',
  styleUrl: './peticion.component.css',
})
export class PeticionComponent {
  @Input({ required: true }) titulo = '';
  @Input({ required: true }) metodo: Metodo = 'GET';
  @Input({ required: true }) url = '';
  @Input() numero?: number;
  // undefined = the request has no body (GET, DELETE)
  @Input() body?: unknown;
  @Input() estado: EstadoPeticion = 'listo';
  @Input() resultado?: Resultado;
  // text shown while it is locked or cancelled (e.g. "Esperando el paso 3")
  @Input() esperando = '';
  // false = no button (the statistics are loaded by the page)
  @Input() conBoton = true;
  // true = it can be sent again after answering (the error boxes)
  @Input() repetible = false;

  @Output() enviar = new EventEmitter<void>();

  // color of the status code: 2xx green, 4xx orange, 5xx (or 0 = no connection) red
  claseStatus(): string {
    const s = this.resultado?.status ?? 0;
    if (s >= 200 && s < 300) return 'status-ok';
    if (s >= 400 && s < 500) return 'status-aviso';
    return 'status-error';
  }

  botonDeshabilitado(): boolean {
    if (['bloqueado', 'cargando', 'cancelado'].includes(this.estado)) return true;
    return this.estado === 'ok' && !this.repetible;
  }
}
