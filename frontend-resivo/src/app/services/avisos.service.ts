import { Injectable, signal } from '@angular/core';

export interface Aviso {
  id: number;
  tipo: 'exito' | 'error';
  titulo: string;
  // one or more lines (e.g. the validation errors of the API, one per field)
  mensajes: string[];
}

// how long a success notice stays (the errors stay until they are closed)
const DURACION_EXITO_MS = 4000;

// Success and error notices for the whole app. Any screen calls exito() or error(),
// and <app-avisos> (in the root component) shows them stacked.
//   this.avisos.exito('Recibo creado');
//   this.avisos.error(mensajesDeError(e));
@Injectable({ providedIn: 'root' })
export class AvisosService {
  readonly lista = signal<Aviso[]>([]);
  private ultimoId = 0;

  // it goes away by itself after a few seconds
  exito(mensaje: string, titulo = 'Listo'): void {
    const id = this.agregar('exito', titulo, [mensaje]);
    setTimeout(() => this.cerrar(id), DURACION_EXITO_MS);
  }

  // it stays until it is closed, so the message of the API can be read calmly
  error(mensajes: string | string[], titulo = 'Error'): void {
    this.agregar('error', titulo, Array.isArray(mensajes) ? mensajes : [mensajes]);
  }

  cerrar(id: number): void {
    this.lista.update((avisos) => avisos.filter((a) => a.id !== id));
  }

  private agregar(tipo: Aviso['tipo'], titulo: string, mensajes: string[]): number {
    const id = ++this.ultimoId;
    this.lista.update((avisos) => [...avisos, { id, tipo, titulo, mensajes }]);
    return id;
  }
}
