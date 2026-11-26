#!/usr/bin/env bash
# Loads example data (30 recibos, 200 productos) THROUGH THE API, so it goes through
# the same validations as the frontend. Needs: the API running, curl and jq.
# The data is always the same (no random values), so the numbers can be checked.
#
#   ./database/seed.sh                      (or: make seed)
#   API=http://localhost:3001 ./database/seed.sh
#   FORZAR=1 ./database/seed.sh             (load even if the database already has data)
set -uo pipefail

API=${API:-http://localhost:3000}

if ! curl -sf "$API/" >/dev/null; then
  echo "La API no responde en $API. Levantala primero (npm run start:dev o make levantar)." >&2
  exit 1
fi

existentes=$(curl -s "$API/resivo" | jq length)
if [ "$existentes" -gt 0 ] && [ -z "${FORZAR:-}" ]; then
  echo "La base ya tiene $existentes recibos: no cargo nada para no duplicarlos." >&2
  echo "Borrala con 'make borrar-todo' o forzá la carga con FORZAR=1." >&2
  exit 1
fi

# ---------- catalog: products of each kind of local ("nombre|precio") ----------
# includes discounts (negative price) and gifts (price 0), which the API accepts
declare -A CATALOGO
CATALOGO[super]="Leche entera 1L|1450
Pan lactal|2800.5
Yerba mate 1kg|4200
Arroz 1kg|1890
Fideos tirabuzón|1250.75
Aceite girasol 1.5L|3999
Café molido 500g|8900
Azúcar 1kg|1600
Galletitas|1150
Queso cremoso (kg)|9800
Descuento jubilados|-1200
Detergente 750ml|2350
Papel higiénico x4|3100
Bolsa reutilizable|0"
CATALOGO[kiosco]="Coca-Cola 1.5L|2500
Alfajor Jorgito|800
Agua mineral 2L|1300
Chicles|450
Turrón Misky|350
Chocolate Milka|2700
Papas fritas 150g|2200
Caramelos x10|600
Promo 2x1 alfajores|-800
Gaseosa lima 500ml|1400
Barra de cereal|900
Pilas AA x2|3500"
CATALOGO[ferre]="Tornillos x100|3200
Cinta aisladora|950
Taladro percutor|89999.99
Martillo|12500
Destornillador Phillips|4300
Pintura látex 4L|28750
Rodillo|5600
Lija x5|1750
Descuento por cantidad|-2500
Silicona|3900
Llave inglesa|15200
Guantes de trabajo|6300"
CATALOGO[farmacia]="Ibuprofeno 400mg|3150
Protector solar|15400
Promo 2x1 protector|-7700
Alcohol en gel|2900
Curitas x20|1850
Paracetamol 500mg|2600
Shampoo|6200
Pasta dental|2450
Cepillo de dientes|1900
Algodón 100g|1300
Termómetro digital|8700
Vitamina C|5400"
CATALOGO[verdu]="Tomate (kg)|2300
Papa (kg)|900
Banana (kg)|2100
Cebolla (kg)|1200
Lechuga|1500
Zanahoria (kg)|1100
Manzana (kg)|2600
Bolsa de regalo|0
Naranja (kg)|1800
Zapallo (kg)|1350
Limón (kg)|2400
Palta|1950"
CATALOGO[libreria]="Cuaderno A4|4500
Lapiceras x10|6200
Resaltadores x4|3800
Carpeta A4|5200
Hojas A4 x500|9900
Goma de borrar|500
Lápiz negro|350
Descuento estudiante|-3000
Regla 30cm|1200
Tijera|2800
Plasticola|1450
Calculadora científica|24999.99"
CATALOGO[carne]="Asado (kg)|14500
Vacío (kg)|16200
Pollo entero|7800
Chorizo (kg)|9200
Morcilla (kg)|7400
Milanesas (kg)|12300
Carne picada (kg)|10900
Bondiola (kg)|13800
Matambre (kg)|15600
Molleja (kg)|21000
Carbón 4kg|6500
Sal gruesa|1100"
CATALOGO[pan]="Pan francés (kg)|3200
Facturas x12|7800
Medialunas x6|4500
Bizcochitos 250g|2100
Torta de cumpleaños|28000
Pan dulce|9500
Prepizza x2|3600
Grisines|1700
Budín|5300
Alfajores de maicena x6|4800
Tarta de manzana|12500
Sandwich de miga x12|10800"

# ---------- the 30 recibos: "local|kind|date|payment method|how many productos" ----------
# repeated locals (estadisticas/por-local), repeated dates (estadisticas/por-fecha)
# and the last one without productos (empty state in the frontend)
RECIBOS="Supermercado Día|super|2026-06-02|Débito|10
Kiosco El Sol|kiosco|2026-06-05|Efectivo|4
Ferretería Tandil|ferre|2026-06-11|Transferencia|6
Farmacia Central|farmacia|2026-06-18|Crédito|5
Verdulería Don José|verdu|2026-06-20|Efectivo|9
Carnicería El Gaucho|carne|2026-06-27|Débito|7
Supermercado Día|super|2026-07-04|Efectivo|12
Librería Mitre|libreria|2026-07-09|Crédito|8
Panadería La Espiga|pan|2026-07-09|Efectivo|5
Kiosco El Sol|kiosco|2026-07-15|Débito|3
Farmacia Central|farmacia|2026-07-22|Débito|6
Carnicería El Gaucho|carne|2026-07-31|Transferencia|11
Supermercado Día|super|2026-08-06|Crédito|9
Verdulería Don José|verdu|2026-08-13|Efectivo|7
Ferretería Tandil|ferre|2026-08-21|Crédito|12
Panadería La Espiga|pan|2026-08-28|Débito|4
Kiosco El Sol|kiosco|2026-09-03|Efectivo|5
Librería Mitre|libreria|2026-09-10|Transferencia|6
Supermercado Día|super|2026-09-17|Débito|11
Farmacia Central|farmacia|2026-09-24|Efectivo|3
Carnicería El Gaucho|carne|2026-10-02|Crédito|8
Verdulería Don José|verdu|2026-10-09|Débito|10
Kiosco El Sol|kiosco|2026-10-16|Transferencia|2
Supermercado Día|super|2026-10-23|Efectivo|7
Ferretería Tandil|ferre|2026-10-30|Transferencia|4
Librería Mitre|libreria|2026-11-06|Débito|9
Panadería La Espiga|pan|2026-11-13|Crédito|6
Supermercado Día|super|2026-11-20|Efectivo|8
Kiosco El Sol|kiosco|2026-11-20|Efectivo|3
Panadería La Espiga|pan|2026-11-25|Transferencia|0"

errores=0

# post /ruta '{json}'  -> prints the id of what was created (or an error, and counts it)
post() {
  local r
  r=$(curl -s -X POST "$API$1" -H 'Content-Type: application/json' -d "$2")
  if jq -e .id >/dev/null <<<"$r"; then
    jq -r .id <<<"$r"
  else
    echo "  ERROR POST $1 $2: $(jq -c .message <<<"$r")" >&2
    errores=$((errores + 1))
  fi
}

n=0
while IFS='|' read -r local tipo fecha metodo cuantos; do
  n=$((n + 1))
  id=$(post /resivo "{\"nombre\":\"$local\",\"tiempoCompra\":\"$fecha\",\"metodoPago\":\"$metodo\"}")
  # (post runs in a subshell here, so the error is counted again outside)
  [ -z "$id" ] && { errores=$((errores + 1)); continue; }

  # products of its kind, starting at a different one in each recibo (so they are not all equal)
  mapfile -t productos <<<"${CATALOGO[$tipo]}"
  for ((i = 0; i < cuantos; i++)); do
    IFS='|' read -r nombre precio <<<"${productos[$(((n * 5 + i) % ${#productos[@]}))]}"
    cantidad=$(((n + i) % 4 + 1))
    # discounts and gifts are always 1 unit
    [[ $precio == -* || $precio == 0 ]] && cantidad=1
    post /producto "{\"resivoId\":$id,\"nombre\":\"$nombre\",\"cantidad\":$cantidad,\"precio\":$precio}" >/dev/null
  done
  printf '\r  %2d/30 recibos' "$n"
done <<<"$RECIBOS"
echo

echo "Cargado: $(curl -s "$API/resivo" | jq length) recibos, $(curl -s "$API/producto" | jq length) productos"
[ "$errores" -eq 0 ] || { echo "Hubo $errores errores." >&2; exit 1; }
