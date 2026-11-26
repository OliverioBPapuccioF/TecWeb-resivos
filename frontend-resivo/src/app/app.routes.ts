import { Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio/inicio.component';
import { RecibosComponent } from './pages/recibos/recibos.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { ExampleComponent } from './pages/example/example.component';
import { RecorridoComponent } from './pages/example/recorrido/recorrido.component';
import { ErroresComponent } from './pages/example/errores/errores.component';
import { EstadisticasComponent } from './pages/example/estadisticas/estadisticas.component';
import { ComponentesComponent } from './pages/example/componentes/componentes.component';

// Every page of the app. Each route shows its component inside the <router-outlet>
// of AppComponent (between the menu and the footer); `title` is the title of the browser tab.
export const routes: Routes = [
  { path: '', component: InicioComponent, title: 'Inicio · Resivos' },
  { path: 'recibos', component: RecibosComponent, title: 'Recibos · Resivos' },
  { path: 'productos', component: ProductosComponent, title: 'Productos · Resivos' },

  // test page of the services (not in the menu): each test is a child route,
  // shown inside the <router-outlet> of ExampleComponent
  {
    path: 'example',
    component: ExampleComponent,
    children: [
      { path: '', redirectTo: 'recorrido', pathMatch: 'full' },
      { path: 'recorrido', component: RecorridoComponent, title: 'Prueba de la API · Recorrido' },
      { path: 'error', component: ErroresComponent, title: 'Prueba de la API · Errores' },
      {
        path: 'estadistica',
        component: EstadisticasComponent,
        title: 'Prueba de la API · Estadísticas',
      },
      {
        path: 'componentes',
        component: ComponentesComponent,
        title: 'Prueba de la API · Componentes',
      },
    ],
  },

  // any other address (e.g. a typo) goes to the home page.
  // It must be the LAST route: the router uses the first one that matches
  { path: '**', redirectTo: '' },
];
