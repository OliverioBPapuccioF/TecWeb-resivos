import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';
import { SaludService } from '../../services/salud.service';

// This interceptor sees every request of the app. It does two things:
// 1. writes down the status of the last successful answer: the services return only the
//    body, and the /example page wants to show the real code (200, 201...)
// 2. when a request fails without connection (status 0) or with a server error (5xx),
//    asks GET /salud right away, so the state of the API and the database is updated
//    without waiting for the next periodic check
let status = 0;

export function ultimoStatus(): number {
  return status;
}

export const registroHttpInterceptor: HttpInterceptorFn = (req, next) => {
  const salud = inject(SaludService);
  return next(req).pipe(
    tap({
      next: (evento) => {
        if (evento instanceof HttpResponse) {
          status = evento.status;
        }
      },
      error: (e: unknown) => {
        const fallaServidor = e instanceof HttpErrorResponse && (e.status === 0 || e.status >= 500);
        // (not for /salud itself: it is the check)
        if (fallaServidor && !req.url.endsWith('/salud')) {
          salud.verificar();
        }
      },
    }),
  );
};
