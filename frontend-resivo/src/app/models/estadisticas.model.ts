// What the API answers in GET /resivo/estadisticas/* (home page).
// Every amount is calculated by the API and rounded to 2 decimals.

// GET /resivo/estadisticas/ultimos -> UltimoResivo[] (the 5 most recent by date)
export interface UltimoResivo {
  id: number;
  nombre: string;
  tiempoCompra: string;
  total: number;
}

// one item of GET /resivo/estadisticas/metodo-pago
export interface CantidadPorMetodo {
  metodoPago: string;
  cantidad: number;
}

// GET /resivo/estadisticas/metodo-pago
export interface EstadisticaMetodoPago {
  // null when there are no resivos
  masUsado: string | null;
  // always the 4 methods of the list (with 0 if there are none)
  cantidades: CantidadPorMetodo[];
}

// GET /resivo/estadisticas/por-fecha -> GastoPorFecha[] (oldest date first)
export interface GastoPorFecha {
  fecha: string;
  total: number;
  cantidadRecibos: number;
}

// GET /resivo/estadisticas/por-local -> GastoPorLocal[] (biggest total first)
export interface GastoPorLocal {
  nombre: string;
  total: number;
  cantidadRecibos: number;
}
