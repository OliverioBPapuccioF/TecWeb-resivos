# Frontend Resivo

Aplicación web en **Angular 22** para ver y cargar los **recibos de compra** y sus **productos**.
Consume la API REST de `backend-resivo`. TP de Tecnologías Web (TUARI, UNICEN).

> En construcción: las pantallas se agregan en los pasos siguientes del TP.

## Requisitos

- Node.js 22.22, 24.15 o 26 (o superior)
- La API levantada en `http://localhost:3000` (desde la raíz del repo: `make levantar`)

## Cómo correrlo

```bash
npm install
npm start          # = ng serve, en http://localhost:4200 (se recarga sola con cada cambio)
```

Compilar para producción (queda en `dist/frontend-resivo/browser`):

```bash
npm run build
```

## Pantallas

| Ruta | Pantalla | Estado |
| ---- | -------- | ------ |
| `/` | Inicio con estadísticas | En construcción (Paso 17) |
| `/recibos` | Recibos en tarjetas, buscador y CRUD | En construcción (Pasos 13 y 14) |
| `/productos` | Listado de productos, filtro y CRUD | En construcción (Pasos 15 y 16) |
| `/example` | Página de prueba de la API (no está en el menú) | Lista |

Cualquier otra dirección redirige al inicio (`**` en `app.routes.ts`). El menú y el pie están
en `app.component.html`; cada pantalla se muestra entre los dos, en el `<router-outlet>`.

Las reglas de diseño (colores, fuentes, formas y clases disponibles) están al principio de
`src/styles.css`.

## Componentes compartidos (`src/app/components/`)

| Componente | Uso |
| ---------- | --- |
| `<app-modal>` | Popup con el contenido que se le pasa (`ng-content`). Arriba, al lado del título, siempre tiene **Cerrar**; abajo, **Cancelar** (`textoCerrar` cambia el texto y `[textoCerrar]="null"` lo saca) más los botones con el atributo `acciones`. Se cierra con esos botones, clic afuera o Esc, salvo mientras `[ocupado]` es `true`. `[ancho]="true"` lo hace más ancho (para una tabla). Bloquea el scroll de fondo y pone el foco en el primer campo (al cerrar vuelve al botón que lo abrió). **Se pueden apilar**: un modal abierto desde otro queda adelante, y Esc o el clic afuera cierran solo el de adelante. |
| `<app-tabla-productos [productos] [total]>` | Tabla con los productos de un recibo (cantidad, precio, subtotal), el total al final y **Editar** / **Borrar** en cada fila: emite `(editar)` y `(borrar)` con el producto. Si no hay productos muestra un `.vacio`. Lo que se le pase con el atributo `pie` (ej. el botón **Agregar producto**) va en la misma línea que el total, a la derecha. |
| `<app-cargando texto="Cargando recibos" />` | Indicador mientras se espera la API. |
| `AvisosService` + `<app-avisos>` | `avisos.exito('…')` se va solo a los 4 s; `avisos.error(mensajesDeError(e))` queda hasta cerrarlo. `<app-avisos>` está una sola vez, en `app.component.html`. |

Pipes (`src/app/pipes/`): `precio` → `$7.400`, `$1.500,50`, `-$1.200`; `fecha` → `'2026-10-18'` a `18/10/2026`.

Se pueden probar en `/example/componentes`, incluido el modal de productos de un recibo:
**Agregar producto** y **Editar** abren el formulario en un segundo modal encima (al editar, con
los datos del producto cargados) y **Borrar** abre una confirmación. Ahí guardar y borrar son
simulados, para no tocar los datos de ejemplo.

## Configuración (environments)

La dirección de la API se escribe en **un solo lugar**: `src/environments/`.

| Archivo | Lo usa | `apiUrl` |
| ------- | ------ | -------- |
| `environment.development.ts` | `npm start` (`ng serve`) | `http://localhost:3000` |
| `environment.ts` | `npm run build` y la imagen de Docker | `http://localhost:3000` (al deployar: la URL real de la API, sin `/` al final) |

Los dos tienen los mismos campos (`production`, `nombreApp`, `apiUrl`); Angular reemplaza uno
por el otro al compilar (`fileReplacements` en `angular.json`). Los servicios usan
`environment.apiUrl`, nunca una URL escrita a mano. Para comprobarlo:

```bash
npm run verificar-urls   # falla si encuentra localhost:<puerto> fuera de src/environments/
```

`HttpClient` se registra en `src/app/app.config.ts` con `provideHttpClient()` (reemplaza al
`HttpClientModule` de versiones anteriores).

## Página de prueba `/example`

`http://localhost:4200/example` (no está en el menú) prueba los servicios contra la API y
muestra cada pedido **crudo**: método, URL y body que se manda, y código, tiempo y JSON que
responde. Colores por método (como Swagger): GET azul, POST verde, PATCH turquesa, DELETE rojo.

Arriba tiene el estado de la **API** y de la **base de datos** (`GET /salud`, cada 10 s y apenas un pedido falla con 500 o sin conexión; si algo está caído aparece un aviso) y pestañas para elegir la prueba (cada una es una ruta hija;
`/example` redirige a `/example/recorrido`). Cada vez que se entra a una, arranca de cero.

| Ruta | Prueba |
| ---- | ------ |
| `/example/recorrido` | Dos columnas, **Recibo** y **Producto**, cada una en orden: crear → ver → modificar → eliminar. Crear producto se habilita apenas existe el recibo; si se elimina el recibo primero, los pasos que le faltan al producto quedan cancelados (se borró en cascada). **Rehacer el proceso** (y salir de la vista) borra lo que quedó creado. |
| `/example/error` | Pedidos que fallan a propósito (400 y 404), con el mensaje en castellano. |
| `/example/estadistica` | Las 4 estadísticas, que se piden solas al entrar. |
| `/example/componentes` | Catálogo para probar el modal, el cargando y los avisos (incluidos errores reales de la API). |

Además, **cada vez que se abre `/example`** (también al recargar la página) se borran los recibos llamados "Ejemplo /example" que quedaron de recorridos sin terminar (y sus productos, por la cascada). Las pruebas se muestran recién después de esa limpieza.

Para mostrar el código HTTP real, `pages/example/registro-http.interceptor.ts` (registrado en
`app.config.ts`) anota el status de cada respuesta. Si al final se borra `/example`, borrarlo
también de ahí.

## Con Docker

La imagen se construye en dos etapas: Node compila la app y **nginx** sirve los archivos
estáticos. `nginx.conf` responde `index.html` en cualquier ruta (si no, refrescar el
navegador en `/recibos` daría 404).

```bash
docker build -t frontend-resivo .
docker run --rm -p 4200:80 frontend-resivo
```

El código de Angular corre **en el navegador**, no en el contenedor: el navegador le pide los
datos a la API directamente, así que no hace falta un proxy.

## Decisiones del proyecto

| Tema | Decisión |
| ---- | -------- |
| Componentes | Standalone (sin `NgModule`), con `@if` / `@for` |
| Nombres de archivos | Estilo 2016, como las filminas: `app.component.ts`, `resivo.service.ts` |
| Detección de cambios | **Zoneless** (sin `zone.js`): el estado que se muestra va en `signal()` |
| Estilos | CSS puro, sin frameworks |
| Tests | No se generan (`skipTests` en `angular.json`) |
