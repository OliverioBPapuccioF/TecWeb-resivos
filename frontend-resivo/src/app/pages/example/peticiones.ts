import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { mensajesDeError } from '../../services/api-error';
import { EstadoPeticion, Metodo, Resultado } from './peticion/peticion.component';
import { ultimoStatus } from './registro-http.interceptor';

// Name of the resivo created by the recorrido. When /example is opened, every resivo
// with this name is deleted: they are tests that were left unfinished (page reloaded,
// tab closed...). Their productos are deleted with them (ON DELETE CASCADE).
export const NOMBRE_RECIBO_PRUEBA = 'Ejemplo /example';

// One request of the /example page.
export interface Peticion {
  clave: string;
  numero?: number;
  titulo: string;
  metodo: Metodo;
  // path shown in the box (the full URL is apiUrl + ruta)
  ruta: () => string;
  // fixed body (undefined = no body)
  body?: () => unknown;
  // the call to the service
  llamar: () => Observable<unknown>;
  // what to keep from a successful answer (e.g. the id that the next steps need)
  alResponder?: (cuerpo: unknown) => void;
}

// What the three views of /example (recorrido, errores, estadisticas) have in common:
// sending a request and keeping its answer. Each view extends this class, so each one
// has its own answers: when you change of view, the new one starts from zero.
export abstract class VistaPeticiones {
  protected readonly apiUrl = environment.apiUrl;

  // answer of each request, by its clave
  protected readonly resultados = signal<Record<string, Resultado>>({});
  // claves of the requests that are waiting for their answer
  private readonly enCurso = signal<Record<string, boolean>>({});

  protected url(p: Peticion): string {
    return this.apiUrl + p.ruta();
  }

  protected body(p: Peticion): unknown {
    return p.body ? p.body() : undefined;
  }

  protected cargando(p: Peticion): boolean {
    return this.enCurso()[p.clave] ?? false;
  }

  // state of a box that can be sent at any time (errors, statistics)
  protected estadoLibre(p: Peticion): EstadoPeticion {
    if (this.cargando(p)) return 'cargando';
    const r = this.resultados()[p.clave];
    if (!r) return 'listo';
    return r.ok ? 'ok' : 'error';
  }

  // sends the request and keeps the answer (or the error) to show it
  protected async enviar(p: Peticion): Promise<void> {
    this.enCurso.update((e) => ({ ...e, [p.clave]: true }));
    const inicio = performance.now();
    let resultado: Resultado;
    try {
      const cuerpo = await firstValueFrom(p.llamar());
      resultado = { ok: true, status: ultimoStatus(), ms: ms(inicio), cuerpo };
      p.alResponder?.(cuerpo);
    } catch (e) {
      const http = e instanceof HttpErrorResponse ? e : null;
      resultado = {
        ok: false,
        status: http?.status ?? 0,
        ms: ms(inicio),
        // the raw body of the error as the API sent it (or null if it did not answer)
        cuerpo: http?.error ?? null,
        mensajes: mensajesDeError(e),
      };
    }
    this.resultados.update((r) => ({ ...r, [p.clave]: resultado }));
    this.enCurso.update((e) => ({ ...e, [p.clave]: false }));
  }
}

function ms(inicio: number): number {
  return Math.round(performance.now() - inicio);
}
