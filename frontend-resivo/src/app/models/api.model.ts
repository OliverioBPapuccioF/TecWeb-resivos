// Answers of the API that are the same for every entity.

// Body of every error of the API (400, 404, 500...), with the message in Spanish.
// message is a LIST in the validation errors of the body (one item per field)
// and a TEXT in the rest, so the frontend has to handle both.
export interface ApiError {
  statusCode: number;
  message: string | string[];
  // name of the HTTP status in English (e.g. "Bad Request"): show message, not this
  error: string;
}

// DELETE /resivo/:id and DELETE /producto/:id
export interface RespuestaEliminar {
  // e.g. 'Recibo "Día" eliminado correctamente (junto con 2 productos)'
  message: string;
  status: 'success';
}

// GET /salud : the API and the database.
// 200 -> { api: 'ok', baseDeDatos: 'ok' }
// 503 -> the body of the error (ApiError) also brings api: 'ok' and baseDeDatos: 'caida'
export interface Salud {
  api: 'ok';
  baseDeDatos: 'ok' | 'caida';
}
