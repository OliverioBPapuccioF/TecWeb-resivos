# Resivos

Aplicación web para cargar **recibos de compra** y sus **productos**, y ver estadísticas de
lo que se gasta. Trabajo Práctico de **Tecnologías Web** (TUARI, UNICEN).

- **Front:** https://resivos.netlify.app (Angular 22, en Netlify)
- **API:** https://resivos-api.onrender.com (NestJS + PostgreSQL, en Render)

> La API está en el plan gratis de Render: se duerme a los 15 minutos sin uso y el primer
> pedido después tarda ~1 minuto (el front avisa que "la API está tardando").

## Estructura

```
.
├── backend-resivo/      API REST en NestJS + TypeORM            -> backend-resivo/README.md
├── frontend-resivo/     App en Angular 22 (standalone, zoneless) -> frontend-resivo/README.md
├── database/            Imagen de PostgreSQL 18 y seed.sh (datos de ejemplo)
├── scripts/             probar-api.sh y probar-web.sh (pruebas de humo)
├── docker-compose.yml   Los tres contenedores: db, api y web
├── docker-compose.prod.yml  Prueba local "como en producción" (make deploy)
├── Makefile             Comandos para levantar, probar y deployar (make = ayuda)
├── render.yaml          Blueprint de Render: API + Postgres
└── netlify.toml         Config de Netlify: compila solo frontend-resivo/
```

Las dos entidades son **Resivo** (local, fecha, método de pago, total) y **Producto**
(nombre, cantidad, precio, subtotal), con una relación uno a muchos: un recibo tiene muchos
productos y, al borrarlo, se borran sus productos. El detalle está en el README del back.

## Levantarlo con Docker (todo junto)

Requisitos: Docker con Compose. Desde la raíz del repo:

```bash
docker compose up --build    # o: make levantar (en segundo plano, espera a que estén healthy)
make seed                    # 30 recibos y 200 productos de ejemplo (con la base vacía)
```

| Servicio | URL | Red |
| -------- | --- | --- |
| `web` (Angular servido por nginx) | http://localhost:4200 | `red-web` |
| `api` (NestJS) | http://localhost:3000 | `red-db` |
| `db` (PostgreSQL 18) | `localhost:5432` | `red-db` |

- La API llega a la base por el nombre `db`, dentro de `red-db`.
- El front está **solo** en `red-web`: no ve a la base. No le hace falta, porque el código de
  Angular corre en el navegador y le pide los datos a la API por `localhost:3000`.
- Los datos de la base quedan en `database/data/` (ignorada por git).

Para comprobar que todo anda:

```bash
make probar    # API (17 chequeos) + front (17 chequeos: rutas, caché, CORS y redes)
```

## Modo desarrollo

```bash
make dev                                    # solo la base (apaga la API y el front de Docker)
cd backend-resivo && npm install && npm run start:dev    # API en localhost:3000
cd frontend-resivo && npm install && npm start           # front en localhost:4200
```

`make` sin nada lista todos los comandos (`estado`, `logs`, `reiniciar`, `apagar`,
`borrar`, `borrar-todo`, `deploy`, ...).

## Deploy

- **Render** (`render.yaml`): construye `backend-resivo/Dockerfile` y crea un Postgres
  administrado. `CORS_ORIGIN` = la URL de Netlify.
- **Netlify** (`netlify.toml`): compila `frontend-resivo` con `npm run build`, que usa
  `src/environments/environment.ts` (la URL de la API en Render). La imagen de Docker usa
  `environment.docker.ts` (`localhost:3000`).
- Cada `git push` a `master` deploya los dos. Antes, `make deploy` prueba la imagen de la API
  "como en producción" y el build de Netlify.

Los pasos completos están en el README del front ("Deploy").

## Decisiones

| Tema | Decisión |
| ---- | -------- |
| Repo | Un solo repo con back, front y base (monorepo) |
| `.env` | Los `.env` de la raíz, `backend-resivo/` y `database/` **están commiteados a propósito**: solo tienen credenciales de prueba para desarrollo local, así cualquiera clona y levanta con `docker compose up --build` sin configurar nada. En Render las variables son otras (las pone Render). |
| URL de la API en el front | Solo en `frontend-resivo/src/environments/` (`npm run verificar-urls` lo comprueba) |
| `/example` | Página de prueba de la API (no está en el menú). También está en producción |
| Productos con precio ≤ 0 | Descuentos y regalos: cuentan en el total del recibo y se ven en su modal, pero no en el listado de `/productos` |

## Conversación con el CLI

El trabajo se hizo con Claude Code; las conversaciones exportadas están en la raíz:

- `conversation-2026-10-22-175319.txt`: primera entrega (backend).
- `front-end-claude.md`: segunda entrega (frontend, Docker y deploy), con las revisiones de
  la skill de la cátedra.
