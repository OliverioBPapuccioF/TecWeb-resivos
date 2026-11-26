import type { Producto } from './producto.model';

// What the API answers for a resivo (GET /resivo, GET /resivo/:id, POST, PATCH).

// the resivo without its productos: this is how it comes nested inside a producto
// (GET /producto) and the base of the full Resivo
export interface ResivoResumen {
  id: number;
  // name of the local where the purchase was made
  nombre: string;
  // date of the purchase as text 'YYYY-MM-DD' (the same format as <input type="date">)
  tiempoCompra: string;
  // one of GET /resivo/metodos-pago (Efectivo, Débito, Crédito, Transferencia)
  metodoPago: string;
}

export interface Resivo extends ResivoResumen {
  // they come WITHOUT resivo/resivoId (they are already inside their resivo)
  productos: Producto[];
  // sum of the subtotals, calculated by the API and rounded to 2 decimals
  total: number;
}

// What is SENT in the body (same names as the DTOs of the backend).

// POST /resivo: all the fields are required
export interface CreateResivoDto {
  nombre: string;
  tiempoCompra: string;
  metodoPago: string;
}

// PATCH /resivo/:id: only the fields that change (at least one)
export type UpdateResivoDto = Partial<CreateResivoDto>;
