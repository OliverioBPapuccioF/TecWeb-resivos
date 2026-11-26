# Frontend Resivo

Aplicación web en **Angular 22** para ver y cargar los **recibos de compra** y sus **productos**.
Consume la API REST de `backend-resivo`. TP de Tecnologías Web (TUARI, UNICEN).

Pantallas: **Inicio** (`/`, últimos recibos y gráficos), **Recibos** (`/recibos`, CRUD de recibos
y sus productos) y **Productos** (`/productos`, todos los productos). El detalle está más abajo.
Las URLs de producción (front en Netlify y API en Render) se agregan cuando se haga el deploy.

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
| `/` | Inicio: los últimos 5 recibos siempre en una fila (si no entran, un riel que se desliza de costado), método de pago (dona), gasto por local (torta: los 5 locales que más gastaron + "Otros") y gasto por mes de los últimos 12 meses (barras) | Lista |
| `/recibos` | Recibos en tarjetas: buscador (local, método de pago o fecha, sin distinguir mayúsculas ni acentos), orden, modal con sus productos, y crear / editar / borrar recibos | Lista |
| `/productos` | Tabla con todos los productos y su recibo (clic en el recibo = modal con sus productos); buscador (producto, local o fecha), orden, precio mayor/menor que un monto. Solo aparecen los de precio mayor a 0: los descuentos (precio negativo) y los regalos (precio 0) no cuentan como productos (siguen en su recibo y en su total) | Lista (editar y borrar en cada fila; los productos nuevos se crean desde su recibo) |
| `/example` | Página de prueba de la API (no está en el menú) | Lista |

Cualquier otra dirección redirige al inicio (`**` en `app.routes.ts`). El menú y el pie están
en `app.component.html`; cada pantalla se muestra entre los dos, en el `<router-outlet>`.

Las reglas de diseño (colores, fuentes, formas y clases disponibles) están al principio de
`src/styles.css`.

## Formulario de recibo

`pages/recibos/formulario-recibo`: el mismo formulario para crear (`[recibo]="null"`, POST) y editar
(`[recibo]="unRecibo"`, PATCH, con los datos cargados), adentro de `<app-modal>`. Es un formulario
**template-driven**: `<form #form="ngForm">`, cada campo con `[(ngModel)]` y una referencia
(`#nombre="ngModel"`) para leer su estado.

| Campo | Validaciones |
| ----- | ------------ |
| Nombre del local | `required` y `pattern` (no solo espacios) |
| Fecha de compra | `<input type="date">`, `required`, `max` = hoy y `appFechaNoFutura` (`src/app/validadores/`), porque el `max` de Angular solo valida números |
| Método de pago | `<select>` con las opciones de `GET /resivo/metodos-pago`, `required` |

Los mensajes aparecen debajo de cada campo al salir de él (`touched`) o al intentar guardar
(`form.submitted`); con errores no se manda nada. Si la API responde un error (ej. 400), sus
mensajes se ven adentro del modal. Al guardar o borrar se vuelve a pedir la lista (sin perder la
búsqueda ni el orden) y aparece un aviso. Borrar pide confirmación y avisa cuántos productos se
borran con el recibo.

## Productos: crear, editar y borrar

- **Crear**: solo desde el modal de productos de un recibo (en `/recibos`), con **Agregar
  producto** al lado del total. No hay `<select>`: el formulario dice a qué recibo se agrega.
- **Editar / Borrar**: en cada fila, en ese modal y en `/productos`. Al editar, el `<select>` viene
  con el recibo del producto ya elegido y se puede cambiar (lo mueve a otro recibo).

`components/formulario-producto` (template-driven, como el de recibo):

| Campo | Validaciones |
| ----- | ------------ |
| Nombre | `required` y `pattern` (no solo espacios) |
| Cantidad | `required`, `min="1"` y `pattern` (número entero) |
| Precio | `required` y `pattern` (hasta 2 decimales). Acepta 0 (regalo) y negativos (descuento), como el back |
| Recibo | Solo al editar: `<select>` con `[ngValue]` (el id queda como número), "Local · fecha", más recientes primero, `required`. Al crear se muestra el recibo como texto |

`components/borrar-producto`: la confirmación dice la cuenta del producto y cómo queda el total
del recibo ("pasa de $4.501,50 a $0"); si no recibe el recibo, se lo pide a la API.

Al guardar o borrar desde un recibo se actualizan el modal (tabla y total) y la tarjeta; en
`/productos` se vuelve a pedir la lista. Si al editar el precio queda en 0 o menos, el aviso dice
que ya no aparece en Productos (sigue en su recibo).

## Gráficos (Inicio)

Con [Chart.js](https://www.chartjs.org/) 4.6 a través de [ng2-charts](https://valor-software.com/ng2-charts/) 11
(`<canvas baseChart [type] [data] [options]>`). En `app.config.ts`, `provideCharts` registra solo
lo que se usa (dona, torta y barras) para que el resto de Chart.js no entre en el bundle.
`src/app/utils/graficos.ts` toma los colores y la fuente de las variables de `styles.css` (sin
el rojo, que en el diseño es solo para borrar y errores). Las estadísticas las calcula la API;
el front solo arma el top 5 + "Otros" de la torta y suma los totales por mes para las barras.

El límite de tamaño del bundle inicial (`budgets` en `angular.json`) se subió a 700 kB por
Chart.js.

## Estados de cada pantalla

Inicio, Recibos y Productos muestran siempre uno de estos estados:

| Estado | Qué se ve |
| ------ | --------- |
| Cargando | `<app-cargando>`; a los 5 s, el aviso de que la API está tardando |
| Error | `<app-error-carga>` con el mensaje (del back, "No se pudo conectar con la API" o "La API no respondió a tiempo") y **Reintentar** |
| Vacío | Un `.vacio` que dice que todavía no hay datos (y cómo cargarlos) |
| Sin resultados | Un `.vacio` cuando la búsqueda/filtro no encuentra nada |
| Éxito | Los datos; después de guardar o borrar, un aviso de éxito |

Todos los pedidos tienen un límite de **90 segundos** (`services/tiempo-limite.interceptor.ts`):
si la API no contesta, fallan con "La API no respondió a tiempo" en lugar de quedar cargando.
Los errores de carga se muestran solo en la página; los avisos rojos quedan para errores que
no se ven en ella (por ejemplo, al guardar en un modal o al abrir un recibo).

## Componentes compartidos (`src/app/components/`)

| Componente | Uso |
| ---------- | --- |
| `<app-modal>` | Popup con el contenido que se le pasa (`ng-content`). Arriba, al lado del título, siempre tiene **Cerrar**; abajo, **Cancelar** (`textoCerrar` cambia el texto y `[textoCerrar]="null"` lo saca) más los botones con el atributo `acciones`. Se cierra con esos botones, clic afuera o Esc, salvo mientras `[ocupado]` es `true`. `[ancho]="true"` lo hace más ancho (para una tabla). Bloquea el scroll de fondo y pone el foco en el primer campo (al cerrar vuelve al botón que lo abrió). **Se pueden apilar**: un modal abierto desde otro queda adelante, y Esc o el clic afuera cierran solo el de adelante. |
| `<app-tabla-productos [productos] [total] [conRecibo] [textoVacio]>` | Tabla con los productos de un recibo (cantidad, precio, subtotal), el total al final y **Editar** / **Borrar** en cada fila: emite `(editar)` y `(borrar)` con el producto. Con `[conRecibo]="true"` agrega la columna Recibo (local · fecha), que emite `(verRecibo)` con el id. Si no hay productos muestra un `.vacio` con `textoVacio`. Lo que se le pase con el atributo `pie` (ej. el botón **Agregar producto**) va en la misma línea que el total, a la derecha. |
| `<app-cargando texto="Cargando recibos" />` | Indicador mientras se espera la API. Si pasan 5 s, agrega "La API está tardando en responder…" (en Render la API se duerme y el primer pedido puede tardar un minuto). |
| `<app-error-carga [mensajes] (reintentar)>` | Lo que muestra una pantalla cuando no pudo cargar sus datos: los mensajes y el botón Reintentar. |
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
