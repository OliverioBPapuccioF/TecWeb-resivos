# Commands to handle the Docker part of the backend (database + API) from this folder.
# Run `make` (or `make ayuda`) to see them.
#
# Most of them accept an optional service:  make reiniciar s=api
# (without s= they act on every service of docker-compose.yml)

COMPOSE := docker compose
# the containers of the other repo share the project name (resivos): for this compose file
# they look like "orphans", and compose would suggest --remove-orphans (which deletes them)
export COMPOSE_IGNORE_ORPHANS := true
s ?=

# the published ports come from .env (the same file docker compose reads)
-include .env
DB_PORT_HOST ?= 5432
API_PORT_HOST ?= 3000
API ?= http://localhost:$(API_PORT_HOST)

# deploy: version of the images = version of package.json
# (read with sed, available everywhere; "=" instead of ":=" so it is only read by the
# commands that use it, not on every make)
VERSION = $(shell sed -n 's/^ *"version": *"\([^"]*\)".*/\1/p' package.json)
PROD_PORT ?= 8080
PROD := VERSION=$(VERSION) PROD_PORT=$(PROD_PORT) docker compose -f docker-compose.prod.yml

.DEFAULT_GOAL := ayuda
.PHONY: ayuda levantar dev reiniciar apagar estado logs seed probar probar-api postman borrar borrar-todo deploy deploy-borrar

ayuda: ## Muestra esta ayuda
	@echo "Uso: make <comando> [s=servicio]"
	@echo
	@grep -E '^[a-z-]+:.*## ' $(firstword $(MAKEFILE_LIST)) | awk -F ':.*## ' '{ printf "  make %-14s %s\n", $$1, $$2 }'

levantar: database/.env ## Construye las imágenes y levanta todo (espera a que esté healthy)
	$(COMPOSE) up -d --build --wait $(s)
	@echo
	@echo "Listo:  API -> $(API)   Base -> localhost:$(DB_PORT_HOST)"
	@echo "(el front está en su propio repo: ahí, make levantar)"

dev: database/.env ## Levanta solo la base (y apaga la API de Docker) para correr el back en tu máquina
	@# the api container uses the same port as npm run start:dev, so it is stopped first
	$(COMPOSE) stop api
	$(COMPOSE) up -d --build --wait db
	@echo
	@echo "Base lista en localhost:$(DB_PORT_HOST). Ahora, en otra terminal:"
	@echo "  npm run start:dev"

reiniciar: ## Reinicia los contenedores (para cambios de código: make levantar)
	$(COMPOSE) restart $(s)

apagar: ## Detiene los contenedores sin borrar nada
	$(COMPOSE) stop $(s)

estado: ## Muestra los contenedores y si están healthy
	@$(COMPOSE) ps -a --format 'table {{.Service}}\t{{.Status}}\t{{.Ports}}'

logs: ## Sigue los logs (Ctrl+C para salir)
	$(COMPOSE) logs -f --tail=100 $(s)

seed: ## Carga 30 recibos y 200 productos de ejemplo (API levantada, base vacía)
	@API=$(API) bash database/seed.sh

probar: probar-api ## Prueba la API levantada (lo mismo que probar-api)

probar-api: ## Prueba rápida de la API (otra URL: make probar-api API=https://...)
	@bash scripts/probar-api.sh $(API)

postman: ## Corre la colección de Postman con Newman (otra URL: make postman API=https://...)
	@# newman = the command line runner of Postman (npx downloads it the first time: no
	@# need to install Postman). Everything the collection creates is deleted at the end
	npx --yes newman@6 run postman/resivos.postman_collection.json --env-var baseUrl=$(API)

borrar: ## Borra contenedores, red e imágenes del back (los datos quedan)
	@# (without --remove-orphans: the web container of the frontend shares the project name
	@# "resivos" and is not deleted from here)
	@# with s=, only that service: `down --rmi local <service>` would delete the images of
	@# EVERY service, so its container and its image are deleted by hand
	@if [ -n "$(s)" ]; then \
		imagenes=$$($(COMPOSE) images -q $(s)); \
		$(COMPOSE) rm -s -f $(s) && { [ -z "$$imagenes" ] || docker image rm $$imagenes; }; \
	else \
		$(COMPOSE) down --rmi local; \
	fi

borrar-todo: database/.env ## Como borrar, pero también los datos de la base (pide confirmación)
	@if [ -z "$(SI)" ]; then \
		read -r -p "¿Seguro? Se borran TODOS los datos de la base (database/data) [s/N] " r; \
		case "$$r" in s|S) ;; *) echo "Cancelado."; exit 1 ;; esac; \
	fi
	@# everything is stopped first: nobody can be writing in the database while it is deleted
	$(COMPOSE) stop
	@# the files of database/data belong to the user of the container (not to you),
	@# so they are deleted from inside a container: no sudo needed
	$(COMPOSE) run --rm --no-deps -T --entrypoint sh db -c 'rm -rf /var/lib/postgresql/*'
	$(COMPOSE) down --rmi local
	@echo "Listo: la base va a arrancar vacía la próxima vez (make levantar / make dev)."

# A fresh clone has no .env (they are not committed): they are created from their
# .env.example, only if they do not exist (yours are never overwritten). Because .env is
# included above, make creates it before running any command.
.env database/.env:
	cp $@.example $@

# ---------- deploy (Render) ----------

deploy: ## Construye las imágenes versionadas y las prueba como en producción (Render)
	@echo "== 1/4 Imágenes resivos-api:$(VERSION) y resivos-db:$(VERSION)"
	@echo "   (la de la API es la misma que construye Render, desde ./Dockerfile)"
	docker build -t resivos-api:$(VERSION) .
	docker build -t resivos-db:$(VERSION) ./database
	@echo "== 2/4 Credenciales de producción (deploy/prod.env, ignorado por git)"
	@if [ -f deploy/prod.env ]; then \
		echo "   ya existen: se reutilizan (la base del volumen se creó con ellas)"; \
	else \
		mkdir -p deploy; clave=$$(openssl rand -hex 16); \
		printf '%s\n' \
			"# generated by make deploy: credentials of the local production test" \
			"# (they are deleted together with the database by: make deploy-borrar)" \
			"POSTGRES_USER=resivo" "POSTGRES_PASSWORD=$$clave" "POSTGRES_DB=resivo" \
			"DATABASE_URL=postgresql://resivo:$$clave@db:5432/resivo" \
			"CORS_ORIGIN=http://localhost:4200" \
			"TZ=America/Argentina/Buenos_Aires" "PGTZ=America/Argentina/Buenos_Aires" \
			> deploy/prod.env; \
		echo "   generadas (contraseña aleatoria)"; \
	fi
	@echo "== 3/4 Levanto producción local (API en localhost:$(PROD_PORT), base sin publicar)"
	$(PROD) up -d --wait
	@echo "== 4/4 Pruebo la API"
	@bash scripts/probar-api.sh http://localhost:$(PROD_PORT) || \
		{ $(PROD) logs --tail=40 api; $(PROD) down; exit 1; }
	@# (docker compose port answers ":0" without error when it is not published, so ask docker inspect)
	@if docker inspect -f '{{json .NetworkSettings.Ports}}' $$($(PROD) ps -q db) | grep -q HostPort; then \
		echo "  ✘ la base está publicada"; $(PROD) down; exit 1; \
	else echo "  ✔ la base no está publicada (solo la ve la API)"; fi
	$(PROD) down
	@echo
	@echo "Listo para deployar la versión $(VERSION):"
	@echo "  1. Render, primera vez: New -> Blueprint -> este repo (lee render.yaml)."
	@echo "  2. Probar la API: make probar-api API=https://<api>.onrender.com"
	@echo "  3. CORS_ORIGIN = la URL del front en Netlify (Environment -> Save and deploy)."
	@echo "  4. Datos de ejemplo: make seed API=https://<api>.onrender.com"
	@echo "  Después, cada git push a la rama del Blueprint deploya solo."

deploy-borrar: ## Borra la prueba de producción local (contenedores, imágenes, datos y credenciales)
	$(PROD) down --volumes
	-docker image rm resivos-api:$(VERSION) resivos-db:$(VERSION)
	rm -f deploy/prod.env
