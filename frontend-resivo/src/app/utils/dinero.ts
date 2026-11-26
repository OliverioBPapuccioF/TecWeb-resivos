// rounds to 2 decimals (cents), like the API does with its amounts
// (Number.EPSILON fixes cases like 1.005 -> 1.01)
export function redondear(monto: number): number {
  return Math.round((monto + Number.EPSILON) * 100) / 100;
}
