# Integration repo: the whole project (database + API + frontend) from here.
# Run `make` (or `make ayuda`) to see the commands.
#
# Each project has its own Makefile (they are split into their own repos):
#   make -C backend-resivo <command>    database + API (seed, deploy to Render, ...)
#   make -C frontend-resivo <command>   frontend (deploy check for Netlify, ...)
# The three docker-compose files use the same project name (resivos), so the containers
# are the same ones whether they are started from here or from each folder.

COMPOSE := docker compose
BACK := $(MAKE) --no-print-directory -C backend-resivo
FRONT := $(MAKE) --no-print-directory -C frontend-resivo

.DEFAULT_GOAL := ayuda
.PHONY: ayuda levantar dev apagar estado logs seed probar borrar

ayuda: ## Muestra esta ayuda
	@echo "Uso: make <comando>   (cada proyecto tiene más: make -C backend-resivo / frontend-resivo)"
	@echo
	@grep -E '^[a-z-]+:.*## ' $(firstword $(MAKEFILE_LIST)) | awk -F ':.*## ' '{ printf "  make %-10s %s\n", $$1, $$2 }'

levantar: ## Construye y levanta los tres contenedores (espera a que estén healthy)
	@# each project creates its .env files from its .env.example if they are missing
	@$(BACK) -s .env database/.env
	@$(FRONT) -s .env
	$(COMPOSE) up -d --build --wait
	@echo
	@echo "Listo:  Front -> http://localhost:4200   API -> http://localhost:3000   Base -> localhost:5432"

dev: ## Solo la base, para correr la API (npm run start:dev) y el front (npm start) en tu máquina
	$(FRONT) apagar
	$(BACK) dev
	@echo "  cd frontend-resivo && npm start   (en otra terminal)"

apagar: ## Detiene los tres contenedores sin borrar nada
	$(COMPOSE) stop

estado: ## Muestra los contenedores y si están healthy
	@$(COMPOSE) ps -a --format 'table {{.Service}}\t{{.Status}}\t{{.Ports}}'

logs: ## Sigue los logs de los tres (Ctrl+C para salir)
	$(COMPOSE) logs -f --tail=100

seed: ## Carga los datos de ejemplo (API levantada, base vacía)
	$(BACK) seed

probar: ## Prueba la API y el front
	$(BACK) probar
	$(FRONT) probar

borrar: ## Borra contenedores, redes e imágenes (los datos de la base quedan)
	$(COMPOSE) down --rmi local --remove-orphans
