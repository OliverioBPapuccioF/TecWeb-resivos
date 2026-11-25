# Backend Resivo

API REST para registrar **recibos de compra** y los **productos** de cada uno. Hecha con NestJS,
TypeORM y PostgreSQL para el TP de Tecnologías Web (TUARI, UNICEN).

## Modelo de datos

Un recibo tiene muchos productos, y cada producto pertenece a un solo recibo (relación 1 a N).
Cada fila de `producto` guarda el `resivo_id` del recibo al que pertenece.

```mermaid
erDiagram
    RESIVO ||--o{ PRODUCTO : "tiene"
    RESIVO {
        int id PK
        string nombre "nombre del local"
        date tiempoCompra
        string metodoPago
    }
    PRODUCTO {
        int id PK
        string nombre
        int cantidad
        double precio
        int resivo_id FK
    }
```

- El **total** del recibo no se guarda en la base: se calcula al devolver el recibo, sumando
  el `subtotal` (`cantidad × precio`) de sus productos.
- Todos los montos que calcula la API (`subtotal`, `total` y las estadísticas) se **redondean a
  2 decimales** (`src/common/dinero.ts`), para evitar resultados como `0.30000000000000004`.
- Al **borrar un recibo** se borran también sus productos (`ON DELETE CASCADE`).

## Requisitos

- Node.js 24 o superior
- Docker (para la base de datos)

## Cómo levantarlo

### 1. Instalar dependencias

```bash
npm install
```

### 2. Levantar PostgreSQL con Docker

Desde la **raíz del repo** (donde están `docker-compose.yml` y el `Makefile`):

```bash
make dev        # levanta solo la base (y apaga la API de Docker, si estaba corriendo)
```

La base se arma con `database/Dockerfile` (Postgres 18) y guarda sus datos en `database/data/`
(ignorada por git). Para apagarla: `make apagar`. Para empezar con la base vacía:
`make borrar-todo`. Para cargar datos de ejemplo (con la API levantada): `make seed`.

### Todo con Docker (base + API)

```bash
make levantar   # construye las imágenes y levanta db + api (espera a que estén healthy)
make estado     # contenedores y su estado
make logs s=api # logs de la API
```

La API queda en `http://localhost:3000` y la base en `localhost:5432`. Los dos contenedores
están en la red `red-db`: adentro de Docker la API llega a la base por el nombre `db`.
`make` sin nada muestra todos los comandos.

### 3. Variables de entorno

Cada carpeta tiene su `.env` (se suben al repo a propósito: son credenciales de prueba):

| Archivo | Lo lee | Para qué |
| ------- | ------ | -------- |
| `.env` (raíz) | `docker compose` y `make` | Puertos de tu máquina donde se publican la base (`DB_PORT_HOST`) y la API (`API_PORT_HOST`) |
| `database/.env` | el contenedor de Postgres | Usuario, contraseña y nombre de la base, zona horaria |
| `backend-resivo/.env` | `npm start`, `start:dev`, `start:debug`, `start:prod` y el contenedor `api` | Configuración del back (tabla de abajo). En Docker, el compose cambia `DB_HOST=db`, `DB_PORT=5432` y `PORT=3000` |

Los scripts de npm cargan `backend-resivo/.env` con la opción `--env-file` de Nest/Node. Una variable
definida en el sistema tiene prioridad sobre el archivo, y si falta alguna se usa el valor por
defecto del código.

| Variable      | Por defecto | Descripción              |
| ------------- | ----------- | ------------------------ |
| `PORT`        | `3000`      | Puerto de la API (en Render lo pone Render) |
| `DATABASE_URL` | —          | URL completa de conexión (Render, `docker-compose.prod.yml`). Si está, se ignoran las `DB_*` |
| `DB_HOST`     | `localhost` | Host de PostgreSQL (`db` cuando el back corre dentro de Docker) |
| `DB_PORT`     | `5432`      | Puerto de PostgreSQL (igual a `DB_PORT_HOST` de la raíz) |
| `DB_USER`     | `postgres`  | Usuario de PostgreSQL (igual a `POSTGRES_USER`) |
| `DB_PASSWORD` | `postgres`  | Contraseña de PostgreSQL (igual a `POSTGRES_PASSWORD`) |
| `DB_NAME`     | `resivo`    | Nombre de la base (igual a `POSTGRES_DB`) |
| `CORS_ORIGIN` | `http://localhost:4200` | Origen del front que puede llamar a la API (CORS) |
| `TZ`          | la del sistema | Zona horaria: define qué día es "hoy" para no aceptar fechas futuras |

### 4. Ejecutar la API

```bash
# desarrollo (se reinicia sola con cada cambio)
npm run start:dev

# producción
npm run build
npm run start:prod
```

La API queda disponible en `http://localhost:3000`. Las tablas se crean solas al arrancar
(`synchronize: true` de TypeORM).

## Deploy (Render)

La API se deploya en [Render](https://render.com) con el Blueprint `render.yaml` de la raíz:
Render construye `backend-resivo/Dockerfile` y crea un Postgres administrado (no usa
`docker-compose` ni `database/Dockerfile`). La API recibe la conexión en `DATABASE_URL`.

Antes de deployar, desde la raíz:

```bash
make deploy          # construye resivos-api:<versión> y la prueba "como en producción"
make deploy-borrar   # borra esa prueba local (contenedores, imágenes, datos y credenciales)
```

`make deploy` levanta `docker-compose.prod.yml`: las imágenes versionadas (versión del
`package.json`), la base **sin publicar** y en un volumen propio, credenciales aleatorias
(`deploy/prod.env`, ignorado por git) y la API en `localhost:8080`, conectada con
`DATABASE_URL` igual que en Render. Corre `scripts/probar-api.sh` y, si todo pasa, la apaga.

En Render:

1. La primera vez: **Dashboard → New → Blueprint** y elegir este repo. Pide `CORS_ORIGIN`
   (la URL del front cuando esté deployado).
2. Después, cada `git push` a `main` deploya solo.
3. Para probar la API deployada: `make probar API=https://<tu-servicio>.onrender.com`

> ⚠ Plan gratis: el servicio se duerme sin uso (el primer pedido tarda ~1 minuto) y la base
> **vence a los 30 días** (14 días más de gracia; después Render la borra con sus datos).

## Endpoints

### Estado de la API

| Método | Ruta | Descripción | Respuesta OK |
| ------ | ---- | ----------- | ------------ |
| `GET`  | `/`  | Chequeo de que la API está viva (lo usa el front) | 200 |

```json
{ "status": "ok", "message": "API de recibos funcionando" }
```

### Recibos (`/resivo`)

| Método   | Ruta                   | Descripción                                    | Respuesta OK |
| -------- | ---------------------- | ---------------------------------------------- | ------------ |
| `GET`    | `/resivo`              | Lista todos los recibos con sus productos y total | 200       |
| `GET`    | `/resivo?nombre=texto` | Filtra los recibos cuyo nombre contiene `texto` (sin distinguir mayúsculas) | 200 |
| `GET`    | `/resivo/metodos-pago` | Lista fija de métodos de pago (para el `select` del front) | 200 |
| `GET`    | `/resivo/:id`          | Un recibo con sus productos y total            | 200          |
| `POST`   | `/resivo`              | Crea un recibo y lo devuelve igual que `GET /resivo/:id` | 201 |
| `PATCH`  | `/resivo/:id`          | Modifica uno o más campos de un recibo y lo devuelve igual que `GET /resivo/:id` | 200 |
| `DELETE` | `/resivo/:id`          | Borra un recibo y sus productos                | 200          |

Body de `POST /resivo` (en `PATCH` todos los campos son opcionales, pero tiene que venir al menos uno).
`metodoPago` tiene que ser uno de: `Efectivo`, `Débito`, `Crédito`, `Transferencia` (la misma lista que devuelve `GET /resivo/metodos-pago`).

```json
{
  "nombre": "Kiosco El Sol",
  "tiempoCompra": "2026-10-18",
  "metodoPago": "Efectivo"
}
```

Respuesta de `GET /resivo/:id`:

```json
{
  "id": 4,
  "nombre": "Kiosco El Sol",
  "tiempoCompra": "2026-10-18",
  "metodoPago": "Efectivo",
  "productos": [
    { "id": 5, "nombre": "Coca-Cola 1.5L", "cantidad": 2, "precio": 2500, "subtotal": 5000 },
    { "id": 6, "nombre": "Alfajor Jorgito", "cantidad": 3, "precio": 800, "subtotal": 2400 }
  ],
  "total": 7400
}
```

### Estadísticas (`/resivo/estadisticas`)

Datos para la página de inicio del front. Se calculan en el momento con todos los recibos cargados.

| Método | Ruta | Descripción | Respuesta OK |
| ------ | ---- | ----------- | ------------ |
| `GET`  | `/resivo/estadisticas/ultimos`     | Los 5 recibos más recientes por fecha de compra | 200 |
| `GET`  | `/resivo/estadisticas/metodo-pago` | Cuántos recibos hay por método de pago y cuál es el más usado | 200 |
| `GET`  | `/resivo/estadisticas/por-fecha`   | Gasto total por fecha de compra (de la más vieja a la más nueva) | 200 |
| `GET`  | `/resivo/estadisticas/por-local`   | Gasto total por local, agrupado por nombre (sin distinguir mayúsculas ni espacios de más), de mayor a menor | 200 |

```jsonc
// GET /resivo/estadisticas/ultimos
[{ "id": 4, "nombre": "Kiosco El Sol", "tiempoCompra": "2026-10-18", "total": 7400 }]

// GET /resivo/estadisticas/metodo-pago  (masUsado es null si no hay recibos)
{
  "masUsado": "Efectivo",
  "cantidades": [
    { "metodoPago": "Efectivo", "cantidad": 3 },
    { "metodoPago": "Débito", "cantidad": 1 },
    { "metodoPago": "Crédito", "cantidad": 0 },
    { "metodoPago": "Transferencia", "cantidad": 0 }
  ]
}

// GET /resivo/estadisticas/por-fecha
[{ "fecha": "2026-10-18", "total": 7400, "cantidadRecibos": 1 }]

// GET /resivo/estadisticas/por-local
[{ "nombre": "Kiosco El Sol", "total": 7400, "cantidadRecibos": 1 }]
```

### Productos (`/producto`)

| Método   | Ruta                     | Descripción                                     | Respuesta OK |
| -------- | ------------------------ | ----------------------------------------------- | ------------ |
| `GET`    | `/producto`              | Lista todos los productos con su recibo         | 200          |
| `GET`    | `/producto?nombre=texto` | Filtra los productos cuyo nombre contiene `texto` (sin distinguir mayúsculas) | 200 |
| `GET`    | `/producto/:id`          | Un producto con su recibo                       | 200          |
| `POST`   | `/producto`              | Crea un producto dentro de un recibo y lo devuelve igual que `GET /producto/:id` | 201 |
| `PATCH`  | `/producto/:id`          | Modifica uno o más campos de un producto (también puede moverlo de recibo) | 200 |
| `DELETE` | `/producto/:id`          | Borra un producto                               | 200          |

Body de `POST /producto` (en `PATCH` todos los campos son opcionales, pero tiene que venir al menos uno):

```json
{
  "nombre": "Coca-Cola 1.5L",
  "cantidad": 2,
  "precio": 2500,
  "resivoId": 4
}
```

Respuesta de `GET /producto/:id` (`resivoId` y `subtotal` los agrega la API):

```json
{
  "id": 5,
  "nombre": "Coca-Cola 1.5L",
  "cantidad": 2,
  "precio": 2500,
  "resivo": { "id": 4, "nombre": "Kiosco El Sol", "tiempoCompra": "2026-10-18", "metodoPago": "Efectivo" },
  "resivoId": 4,
  "subtotal": 5000
}
```

## Validaciones y errores

Los bodies se validan con `class-validator`:

- Los campos que no están en el DTO se descartan sin error.
- A los textos se les recortan los espacios de los costados antes de validar (`"  Día "` se guarda `"Día"`).
- Se informa **un mensaje por campo**: el de la primera regla que falla.
- `tiempoCompra` tiene que tener el formato `AAAA-MM-DD`, ser una fecha real y no ser posterior a hoy.
- `precio` acepta hasta 2 decimales y puede ser 0 o negativo (descuentos y promociones).

Todos los errores tienen la forma estándar de Nest, con el mensaje en castellano.
`message` es una **lista** en los errores de validación del body y un **texto** en el resto:

```json
{
  "statusCode": 400,
  "message": ["El nombre del local es obligatorio", "La fecha de compra no puede ser posterior a hoy"],
  "error": "Bad Request"
}
```

| Caso | Código | Mensaje |
| ---- | ------ | ------- |
| Falta un campo obligatorio | 400 | `El nombre del local es obligatorio`, `La cantidad es obligatoria`, … (lista) |
| Tipo o formato incorrecto | 400 | `La fecha de compra tiene que tener el formato AAAA-MM-DD`, `La cantidad tiene que ser un número entero`, … (lista) |
| Fecha inexistente (ej. `2026-02-30`) | 400 | `La fecha de compra no es una fecha válida` (lista) |
| Fecha futura | 400 | `La fecha de compra no puede ser posterior a hoy` (lista) |
| Método de pago fuera de la lista | 400 | `El método de pago tiene que ser uno de: Efectivo, Débito, Crédito, Transferencia` (lista) |
| Precio con más de 2 decimales | 400 | `El precio tiene que ser un número con hasta 2 decimales` (lista) |
| `PATCH` sin ningún campo válido | 400 | `Tenés que mandar al menos un campo para actualizar: …` |
| `:id` no es un entero mayor a 0 (ej. `/resivo/abc`) | 400 | `El id tiene que ser un número entero mayor a 0` |
| Body con JSON mal escrito | 400 | `El body no es un JSON válido` |
| No existe el recibo | 404 | `Recibo con id X no encontrado` |
| No existe el producto | 404 | `Producto con id X no encontrado` |
| Se crea o mueve un producto a un `resivoId` que no existe | 404 | `Recibo con id X no encontrado` |
| Ruta inexistente | 404 | `La ruta GET /xxx no existe` |
| Falla la base de datos | 500 | `No se pudieron obtener los recibos`, `No se pudo crear el producto`, … (el detalle queda en la consola del back) |

Respuestas de un `DELETE` exitoso (200):

```json
{ "message": "Recibo \"Día\" eliminado correctamente (junto con 2 productos)", "status": "success" }
{ "message": "Producto \"Leche\" eliminado correctamente", "status": "success" }
```

## Estructura

```
src/
├── main.ts                 # arranque, CORS, ValidationPipe y filtro de errores globales
├── common/
│   ├── errores.filter.ts   # todos los errores salen con la misma forma y en castellano
│   ├── parse-id.pipe.ts    # valida el :id de las rutas
│   └── validaciones.ts     # recortar textos, fecha no futura
├── app.module.ts           # conexión a PostgreSQL (TypeORM)
├── resivo/
│   ├── entities/           # entidad Resivo (cálculo del total)
│   ├── metodo-pago.ts      # lista fija de métodos de pago
│   ├── dto/                # CreateResivoDto, UpdateResivoDto
│   ├── resivo.controller.ts
│   ├── resivo.service.ts
│   └── resivo.module.ts
└── producto/
    ├── entities/           # entidad Producto (relación con Resivo)
    ├── dto/                # CreateProductoDto, UpdateProductoDto
    ├── producto.controller.ts
    ├── producto.service.ts
    └── producto.module.ts  # importa ResivoModule para validar el resivoId
```
