#!/usr/bin/env bash
# Check that the frontend container works (smoke test): nginx serves the app, every route
# of Angular answers (refreshing on /recibos does not give 404), the cache headers, that
# the build points to the API, CORS, and the networks (web does NOT see the database).
# It does not change any data.
#
#   bash scripts/probar-web.sh                                   (localhost:4200 / :3000)
#   bash scripts/probar-web.sh http://localhost:4200 http://localhost:3000
#
# Run from the root of this repo (make probar), with the web container up (make levantar)
# and the API of the backend repo up. Needs curl and docker.
# Exit code 0 = everything OK.
set -uo pipefail

WEB=${1:-http://localhost:4200}
API=${2:-http://localhost:3000}
fallas=0

ok() { printf '  ✔ %-58s %s\n' "$1" "${2:-}"; }
mal() {
  printf '  ✘ %-58s %s\n' "$1" "${2:-}"
  fallas=$((fallas + 1))
}
# si "description" command...  -> ✔ if the command succeeds, ✘ if not
si() {
  local desc=$1
  shift
  if "$@" >/dev/null 2>&1; then ok "$desc"; else mal "$desc"; fi
}
# headers and code of a GET (the body is discarded)
cabeceras() { curl -s -o /dev/null -D - --max-time 10 "$@"; }
codigo() { curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$@"; }

echo "Frontend: $WEB   ·   API: $API"

echo "== Contenedor"
web=$(docker compose ps -q web 2>/dev/null)
if [ -z "$web" ]; then
  mal "el contenedor web está levantado" "(no existe: corré make levantar)"
  echo "$fallas chequeos fallaron." >&2
  exit 1
fi
salud=$(docker inspect -f '{{.State.Health.Status}}' "$web")
[ "$salud" = healthy ] && ok "el contenedor web está healthy" || mal "el contenedor web está healthy" "($salud)"

echo "== La app"
inicio=$(curl -s --max-time 10 "$WEB/")
[ "$(codigo "$WEB/")" = 200 ] && grep -q '<app-root' <<<"$inicio" &&
  ok "/ devuelve index.html con <app-root>" || mal "/ devuelve index.html con <app-root>"

# routes of Angular: they are not files, nginx must answer index.html (try_files)
for ruta in /recibos /productos /example/recorrido; do
  if [ "$(codigo "$WEB$ruta")" = 200 ] && curl -s --max-time 10 "$WEB$ruta" | grep -q '<app-root'; then
    ok "refrescar en $ruta no da 404" 200
  else
    mal "refrescar en $ruta no da 404" "$(codigo "$WEB$ruta")"
  fi
done

# a missing FILE must be a 404, not index.html (otherwise a broken build looks fine)
c=$(codigo "$WEB/no-existe.js")
[ "$c" = 404 ] && ok "un archivo que no existe da 404" "$c" || mal "un archivo que no existe da 404" "$c"

# every .js and .css that index.html asks for exists
archivos=$(grep -oE '(src|href)="[^"]+\.(js|css)"' <<<"$inicio" | sed -E 's/^(src|href)="//; s/"$//')
faltan=0
for a in $archivos; do [ "$(codigo "$WEB/$a")" = 200 ] || faltan=$((faltan + 1)); done
[ -n "$archivos" ] && [ "$faltan" -eq 0 ] &&
  ok "los $(wc -w <<<"$archivos") .js/.css de index.html existen" ||
  mal "los .js/.css de index.html existen" "(faltan $faltan)"

echo "== Caché y compresión"
main=$(grep -oE 'main-[A-Z0-9]+\.js' <<<"$inicio" | head -n1)
cabeceras "$WEB/index.html" | grep -qi '^cache-control: no-cache' &&
  ok "index.html no se cachea (no-cache)" || mal "index.html no se cachea (no-cache)"
cabeceras "$WEB/$main" | grep -qi '^cache-control:.*immutable' &&
  ok "$main se cachea (tiene hash en el nombre)" || mal "$main se cachea (immutable)"
cabeceras -H 'Accept-Encoding: gzip' "$WEB/$main" | grep -qi '^content-encoding: gzip' &&
  ok "se manda comprimido (gzip)" || mal "se manda comprimido (gzip)"

echo "== Conexión con la API"
curl -s --max-time 10 "$WEB/$main" | grep -qF "\"$API\"" &&
  ok "el build apunta a la API ($API)" || mal "el build apunta a la API ($API)" "(revisá environment.ts)"
c=$(codigo "$API/salud")
[ "$c" = 200 ] && ok "la API responde (/salud)" "$c" || mal "la API responde (/salud)" "$c"
origen=$(cabeceras -H "Origin: $WEB" "$API/resivo" | tr -d '\r' | sed -n 's/^access-control-allow-origin: //Ip')
[ "$origen" = "$WEB" ] && ok "la API acepta pedidos desde $WEB (CORS)" ||
  mal "la API acepta pedidos desde $WEB (CORS)" "(CORS_ORIGIN = '${origen:-ninguno}')"

echo "== Redes"
# the networks of web: only one, red-web (its full name is <project>_red-web)
proyecto=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' "$web")
redes=$(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$web" | xargs)
[ "$redes" = "${proyecto}_red-web" ] && ok "web está solo en red-web" || mal "web está solo en red-web" "($redes)"
# control, if the API of the backend runs in Docker in the same project: from red-db the
# name "db" exists, so the next check means something
api=$(docker ps -q --filter "label=com.docker.compose.project=$proyecto" --filter "label=com.docker.compose.service=api")
if [ -n "$api" ]; then
  si "desde la API se llega a db (red-db)" docker exec "$api" getent hosts db
fi
if docker exec "$web" getent hosts db >/dev/null 2>&1; then
  mal "web NO ve a la base (db)"
else
  ok "web NO ve a la base (db)"
fi
if docker exec "$web" getent hosts api >/dev/null 2>&1; then
  mal "web NO ve a la API por la red de Docker"
else
  ok "web NO ve a la API por la red de Docker (no la necesita)"
fi

echo
if [ "$fallas" -eq 0 ]; then
  echo "Todo OK."
else
  echo "$fallas chequeos fallaron." >&2
  exit 1
fi
