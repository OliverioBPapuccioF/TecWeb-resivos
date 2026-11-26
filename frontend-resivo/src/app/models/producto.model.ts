import type { ResivoResumen } from './resivo.model';

// What the API answers for a producto.
// It comes in two ways, so resivoId and resivo are optional:
// - inside a resivo (GET /resivo, GET /resivo/:id): WITHOUT resivoId and resivo
// - on its own (GET /producto, GET /producto/:id, POST, PATCH): WITH both
export interface Producto {
  id: number;
  nombre: string;
  // whole number greater than 0
  cantidad: number;
  // up to 2 decimals; can be 0 (gift) or negative (discount)
  precio: number;
  // cantidad x precio, calculated by the API and rounded to 2 decimals
  subtotal: number;
  // id of the resivo it belongs to (handy to preload the <select> of the form)
  resivoId?: number;
  // the resivo it belongs to, without its productos and without total
  resivo?: ResivoResumen;
}

// What is SENT in the body (same names as the DTOs of the backend).

// POST /producto: all the fields are required
export interface CreateProductoDto {
  nombre: string;
  cantidad: number;
  precio: number;
  // the resivo it belongs to (it must exist, if not the API answers 404)
  resivoId: number;
}

// PATCH /producto/:id: only the fields that change (at least one);
// sending another resivoId moves the producto to that resivo
export type UpdateProductoDto = Partial<CreateProductoDto>;
