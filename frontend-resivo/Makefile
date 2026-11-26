# Commands to handle the Docker part of the frontend (the web container) from this folder.
# Run `make` (or `make ayuda`) to see them. To develop, use npm start (ng serve) instead.
#
# The API and the database are in the backend repo: start them there (make levantar)
# so the app has data.

COMPOSE := docker compose
# the containers of the other repo share the project name (resivos): for this compose file
# they look like "orphans", and compose would suggest --remove-orphans (which deletes them)
export COMPOSE_IGNORE_ORPHANS := true

# the published port comes from .env (the same file docker compose reads)
-include .env
WEB_PORT_HOST ?= 4200
WEB ?= http://localhost:$(WEB_PORT_HOST)
# the API that the Docker image calls (apiUrl of src/environments/environment.docker.ts)
API ?= http://localhost:3000

DIST := dist/frontend-resivo/browser

.DEFAULT_GOAL := ayuda
.PHONY: ayuda levantar reiniciar apagar estado logs probar borrar deploy

ayuda: ## Muestra esta ayuda
	@echo "Uso: make <comando>"
	@echo
	@grep -E '^[a-z-]+:.*## ' $(firstword $(MAKEFILE_LIST)) | awk -F ':.*## ' '{ printf "  make %-10s %s\n", $$1, $$2 }'

levantar: ## Construye la imagen y levanta el front (espera a que esté healthy)
	$(COMPOSE) up -d --build --wait
	@echo
	@echo "Listo:  Front -> $(WEB)   (usa la API de $(API): levantala en el repo del back)"

reiniciar: ## Reinicia el contenedor (para cambios de código: make levantar)
	$(COMPOSE) restart web

apagar: ## Detiene el contenedor sin borrarlo (libera el 4200 para ng serve)
	$(COMPOSE) stop web

estado: ## Muestra el contenedor y si está healthy
	@$(COMPOSE) ps -a --format 'table {{.Service}}\t{{.Status}}\t{{.Ports}}'

logs: ## Sigue los logs de nginx (Ctrl+C para salir)
	$(COMPOSE) logs -f --tail=100 web

probar: ## Prueba el contenedor: rutas, caché, CORS y redes (no ve a la base)
	@bash scripts/probar-web.sh $(WEB) $(API)

borrar: ## Borra el contenedor, la red y la imagen del front
	@# (without --remove-orphans: db and api share the project name "resivos" and they
	@# belong to the backend)
	$(COMPOSE) down --rmi local

# A fresh clone has no .env (it is not committed): it is created from .env.example, only if
# it does not exist. Because .env is included above, make creates it before any command.
.env:
	cp $@.example $@

deploy: ## Compila como Netlify (npm run build) y revisa el resultado
	@echo "== Build de producción, igual que en Netlify (usa environment.ts)"
	npm run build
	@# the build must have _redirects, the URL of environment.ts and no localhost:3000
	@url=$$(sed -n "s/^ *apiUrl: '\(.*\)',*$$/\1/p" src/environments/environment.ts); \
	falla=0; \
	if [ -f $(DIST)/_redirects ]; then echo "  ✔ tiene _redirects (refrescar en /recibos no da 404)"; \
	else echo "  ✘ falta _redirects"; falla=1; fi; \
	if grep -qF "\"$$url\"" $(DIST)/main-*.js; then echo "  ✔ llama a la API en $$url"; \
	else echo "  ✘ no aparece la URL de environment.ts ($$url)"; falla=1; fi; \
	if grep -q 'localhost:3000' $(DIST)/main-*.js; then echo "  ✘ el build tiene localhost:3000"; falla=1; \
	else echo "  ✔ no tiene localhost:3000"; fi; \
	rm -rf dist; exit $$falla
	@echo
	@echo "Listo para deployar en Netlify:"
	@echo "  1. Primera vez: Add new project -> este repo (lee netlify.toml) y Project visibility = Public."
	@echo "  2. En Render: CORS_ORIGIN de la API = la URL de Netlify."
	@echo "  Después, cada git push deploya solo."
