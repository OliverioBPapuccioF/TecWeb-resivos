// Money helpers.
// JavaScript numbers are binary, so 0.1 + 0.2 gives 0.30000000000000004: every amount
// that the API calculates (subtotal, total, statistics) is rounded to 2 decimals (cents).

// rounds to 2 decimals (Number.EPSILON fixes cases like 1.005 -> 1.01)
export function redondear(monto: number): number {
  return Math.round((monto + Number.EPSILON) * 100) / 100;
}

// subtotal of a producto: cantidad x precio, rounded
export function subtotal(producto: {
  cantidad: number;
  precio: number;
}): number {
  return redondear(producto.cantidad * producto.precio);
}
