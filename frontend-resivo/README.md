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
