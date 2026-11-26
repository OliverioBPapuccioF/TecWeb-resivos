import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, timer } from 'rxjs';
import { ApiService } from './api.service';

// null = still asking · 'ok' = it answers · 'caida' = it does not answer
// 'desconocida' = it can not be known (if the API is down, the database can not be asked)
export type EstadoParte = 'ok' | 'caida' | 'desconocida' | null;

// Knows if the API and the database are alive (GET /salud) and keeps it in signals,
// so any screen can show it. It is checked every few seconds while some screen asks
// for it (iniciar / detener), and right away when a request fails (verificar).
@Injectable({ providedIn: 'root' })
export class SaludService {
  readonly api = signal<EstadoParte>(null);
  readonly baseDeDatos = signal<EstadoParte>(null);

  private periodico?: Subscription;
  private consultando = false;

  constructor(private apiService: ApiService) {}

  // starts checking now and then every `cadaMs` milliseconds
  iniciar(cadaMs = 10000): void {
    this.detener();
    this.periodico = timer(0, cadaMs).subscribe(() => this.verificar());
  }

  detener(): void {
    this.periodico?.unsubscribe();
    this.periodico = undefined;
  }

  // asks GET /salud once (if it is not already asking)
  verificar(): void {
    if (this.consultando) return;
    this.consultando = true;
    this.apiService.getSalud().subscribe({
      next: () => {
        this.api.set('ok');
        this.baseDeDatos.set('ok');
        this.consultando = false;
      },
      error: (e: unknown) => {
        const status = e instanceof HttpErrorResponse ? e.status : 0;
        if (status === 0) {
          // the request did not reach the API: nothing is known about the database
          this.api.set('caida');
          this.baseDeDatos.set('desconocida');
        } else {
          // the API answered with an error: 503 = the database does not answer
          this.api.set('ok');
          this.baseDeDatos.set(status === 503 ? 'caida' : 'desconocida');
        }
        this.consultando = false;
      },
    });
  }
}
