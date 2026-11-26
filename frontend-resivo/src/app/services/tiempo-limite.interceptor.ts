import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError, timeout, TimeoutError } from 'rxjs';

// how long a request can wait for the API (enough for Render to wake it up, ~1 minute)
export const TIEMPO_LIMITE_MS = 90000;

// Every request of the app fails if the API does not answer in 90 s, instead of leaving the
// screen in "Cargando" forever. The failure looks like an error of the API (status 504, with
// the shape { message }), so mensajesDeError() and the screens show it like any other.
export const tiempoLimiteInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    timeout(TIEMPO_LIMITE_MS),
    catchError((error: unknown) =>
      throwError(() =>
        error instanceof TimeoutError
          ? new HttpErrorResponse({
              status: 504,
              statusText: 'Gateway Timeout',
              url: req.url,
              error: { message: 'La API no respondió a tiempo. Probá de nuevo en un rato.' },
            })
          : error,
      ),
    ),
  );
