#!/usr/bin/env bash
# Quick check that a running API works (smoke test): status, reads, errors and one
# write that is deleted at the end. Safe to run against production (also Render).
#
#   bash scripts/probar-api.sh http://localhost:8080
#   bash scripts/probar-api.sh https://resivos-api.onrender.com
#
# Needs curl and jq. Exit code 0 = everything OK.
set -uo pipefail

API=${1:-http://localhost:3000}
fallas=0

# chequear "description" METHOD path expected_code [json body] [jq condition on the body]
chequear() {
  local desc=$1 metodo=$2 ruta=$3 esperado=$4 body=${5:-} condicion=${6:-true} salida codigo
  if [ -n "$body" ]; then
    salida=$(curl -s -X "$metodo" "$API$ruta" -H 'Content-Type: application/json' -d "$body" -w $'\n%{http_code}')
  else
    salida=$(curl -s -X "$metodo" "$API$ruta" -w $'\n%{http_code}')
  fi
  codigo=$(tail -n1 <<<"$salida")
  RESPUESTA=$(sed '$d' <<<"$salida")
  if [ "$codigo" = "$esperado" ] && jq -e "$condicion" >/dev/null 2>&1 <<<"$RESPUESTA"; then
    printf '  ✔ %-48s %s\n' "$desc" "$codigo"
  else
    printf '  ✘ %-48s %s (esperado %s) %s\n' "$desc" "$codigo" "$esperado" "$(cut -c1-120 <<<"$RESPUESTA")"
    fallas=$((fallas + 1))
  fi
}

echo "Probando $API"
chequear "API viva (GET /)" GET / 200 "" '.status == "ok"'
chequear "base de datos viva (GET /salud)" GET /salud 200 "" '.baseDeDatos == "ok"'
chequear "lista de recibos" GET /resivo 200 "" 'type == "array"'
chequear "lista de productos" GET /producto 200 "" 'type == "array"'
chequear "métodos de pago" GET /resivo/metodos-pago 200 "" 'length == 4'
for e in ultimos metodo-pago por-fecha por-local; do
  chequear "estadísticas/$e" GET "/resivo/estadisticas/$e" 200
done
chequear "error de validación en castellano" POST /resivo 400 '{}' '.message | index("El nombre del local es obligatorio") != null'
chequear "id inválido" GET /resivo/abc 400
chequear "recibo inexistente" GET /resivo/2147483647 404

# one write through the whole chain (API -> database), deleted at the end
chequear "crear recibo de prueba" POST /resivo 201 '{"nombre":"PRUEBA-deploy","tiempoCompra":"2026-01-01","metodoPago":"Efectivo"}' '.id > 0'
id=$(jq -r '.id // empty' <<<"$RESPUESTA")
if [ -n "$id" ]; then
  chequear "crear producto (subtotal redondeado)" POST /producto 201 "{\"nombre\":\"PRUEBA\",\"cantidad\":3,\"precio\":0.1,\"resivoId\":$id}" '.subtotal == 0.3'
  chequear "total del recibo" GET "/resivo/$id" 200 "" '.total == 0.3'
  chequear "borrar recibo de prueba (y su producto)" DELETE "/resivo/$id" 200
  chequear "ya no existe" GET "/resivo/$id" 404
fi

if [ "$fallas" -eq 0 ]; then
  echo "Todo OK."
else
  echo "$fallas chequeos fallaron." >&2
  exit 1
fi
