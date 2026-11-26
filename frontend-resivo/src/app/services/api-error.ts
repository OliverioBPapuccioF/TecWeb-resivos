import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../models/api.model';

// Turns any error of a request into a list of messages to show to the user.
// The API sends `message` as a LIST (validation errors, one per field) or as a TEXT
// (the rest); this always gives back a list, so the screens handle only one case.
export function mensajesDeError(error: unknown): string[] {
  if (!(error instanceof HttpErrorResponse)) {
    return ['Ocurrió un error inesperado'];
  }

  // status 0: the request did not reach the API (it is down, wrong URL or CORS)
  if (error.status === 0) {
    return ['No se pudo conectar con la API. ¿Está levantada?'];
  }

  // the body of the error, with the shape of the API: { statusCode, message, error }
  const cuerpo = error.error as Partial<ApiError> | null;
  if (Array.isArray(cuerpo?.message)) {
    return cuerpo.message;
  }
  if (typeof cuerpo?.message === 'string') {
    return [cuerpo.message];
  }

  // an error without that shape (should not happen with this API)
  return [`Error ${error.status}: ${error.statusText || 'sin detalle'}`];
}
