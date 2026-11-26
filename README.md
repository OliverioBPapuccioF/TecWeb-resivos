# Resivos

Aplicación web para cargar **recibos de compra** y sus **productos**, y ver estadísticas de
lo que se gasta. Trabajo Práctico de **Tecnologías Web** (TUARI, UNICEN).

- **Front:** https://resivos.netlify.app (Angular 22, en Netlify)
- **API:** https://resivos-api.onrender.com (NestJS + PostgreSQL, en Render)
- **Repo del back:** https://github.com/OliverioBPapuccioF/resivos-backend
- **Repo del front:** https://github.com/OliverioBPapuccioF/resivos-frontend

> La API está en el plan gratis de Render: se duerme a los 15 minutos sin uso y el primer
> pedido después tarda ~1 minuto (el front avisa que "la API está tardando").

## Repos

El back y el front están en **dos repos separados** (los de la entrega). Este es el repo de
**integración**: tiene los dos proyectos como carpetas y un compose que levanta todo junto.
Cada carpeta se pasa a su repo con `git subtree`, que conserva su historial de commits:

```bash
git subtree split --prefix=backend-resivo -b back     # rama solo con backend-resivo/
git subtree split --prefix=frontend-resivo -b front   # rama solo con frontend-resivo/
git push git@github.com:OliverioBPapuccioF/resivos-backend.git back:main
git push git@github.com:OliverioBPapuccioF/resivos-frontend.git front:main
```

Cada carpeta es un proyecto completo: su `.gitignore`, `.env.example`, `docker-compose.yml`,
`Makefile`, scripts de prueba, config de deploy y README.

## Estructura

```
.
├── backend-resivo/      API (NestJS + TypeORM) y base (database/)  -> backend-resivo/README.md
│                        compose db + api, Makefile, render.yaml, scripts/probar-api.sh
├── frontend-resivo/     App en Angular 22 (standalone, zoneless)    -> frontend-resivo/README.md
│                        compose web, Makefile, netlify.toml, scripts/probar-web.sh
├── docker-compose.yml   Incluye los dos compose: db, api y web juntos
└── Makefile             Atajos para los tres (llama a los Makefile de cada carpeta)
```

Las dos entidades son **Resivo** (local, fecha, método de pago, total) y **Producto**
(nombre, cantidad, precio, subtotal), con una relación uno a muchos: un recibo tiene muchos
productos y, al borrarlo, se borran sus productos. El detalle está en el README del back.

## Levantarlo con Docker (todo junto)

Requisitos: Docker con Compose. Desde la raíz del repo:

```bash
make levantar    # crea los .env desde los .env.example (si faltan) y levanta los tres
make seed        # 30 recibos y 200 productos de ejemplo (con la base vacía)
```

Sin `make`, primero se copian los `.env.example` (los `.env` no están en el repo):

```bash
cp backend-resivo/.env.example backend-resivo/.env
cp backend-resivo/database/.env.example backend-resivo/database/.env
cp frontend-resivo/.env.example frontend-resivo/.env
docker compose up --build
```

| Servicio | URL | Red |
| -------- | --- | --- |
| `web` (Angular servido por nginx) | http://localhost:4200 | `red-web` |
| `api` (NestJS) | http://localhost:3000 | `red-db` |
| `db` (PostgreSQL 18) | `localhost:5432` | `red-db` |

- La API llega a la base por el nombre `db`, dentro de `red-db`.
- El front está **solo** en `red-web`: no ve a la base. No le hace falta, porque el código de
  Angular corre en el navegador y le pide los datos a la API por `localhost:3000`.
- Los datos de la base quedan en `backend-resivo/database/data/` (ignorada por git).
- Los tres compose usan el mismo nombre de proyecto (`resivos`): los contenedores son los
  mismos si se levantan desde acá o desde cada carpeta (`make levantar` en cada una).

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

`make` sin nada lista los comandos de acá (`estado`, `logs`, `apagar`, `borrar`, ...). Los
demás están en cada carpeta: `make -C backend-resivo` (`borrar-todo`, `deploy`, ...) y
`make -C frontend-resivo` (`deploy`: chequeo del build de Netlify).

## Deploy

- **Render** (`backend-resivo/render.yaml`), desde el [repo del back](https://github.com/OliverioBPapuccioF/resivos-backend): construye su
  `Dockerfile` y crea un Postgres administrado. `CORS_ORIGIN` = la URL de Netlify.
- **Netlify** (`frontend-resivo/netlify.toml`), desde el [repo del front](https://github.com/OliverioBPapuccioF/resivos-frontend): compila con
  `npm run build`, que usa `src/environments/environment.ts` (la URL de la API en Render). La
  imagen de Docker usa `environment.docker.ts` (`localhost:3000`).
- Cada `git push` a cada repo deploya su parte. Antes, `make -C backend-resivo deploy` prueba
  la imagen de la API "como en producción" y `make -C frontend-resivo deploy`, el build de
  Netlify.

Los pasos completos están en el README del front ("Deploy").

## Decisiones

| Tema | Decisión |
| ---- | -------- |
| Repos | Back y front en repos separados (sacados de este con `git subtree`); este queda para levantar todo junto |
| `.env` | **No están en el repo** (`.gitignore`): cada proyecto sube su `.env.example` con todas las variables y valores para desarrollo local, y `make levantar` los copia a `.env` si faltan. En Render las variables las pone Render (`render.yaml`). |
| URL de la API en el front | Solo en `frontend-resivo/src/environments/` (`npm run verificar-urls` lo comprueba) |
| `/example` | Página de prueba de la API (no está en el menú). También está en producción |
| Productos con precio ≤ 0 | Descuentos y regalos: cuentan en el total del recibo y se ven en su modal, pero no en el listado de `/productos` |

## Conversación con el CLI

El trabajo se hizo con Claude Code; cada conversación exportada está en el repo de su parte:

- `backend-resivo/conversation-2026-10-22-175319.txt`: primera entrega (backend).
- `frontend-resivo/front-end-claude.md`: segunda entrega (frontend, Docker y deploy), con las
  revisiones de la skill de la cátedra.
