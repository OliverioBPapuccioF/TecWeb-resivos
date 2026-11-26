import { Routes } from '@angular/router';
import { ExampleComponent } from './pages/example/example.component';
import { RecorridoComponent } from './pages/example/recorrido/recorrido.component';
import { ErroresComponent } from './pages/example/errores/errores.component';
import { EstadisticasComponent } from './pages/example/estadisticas/estadisticas.component';

export const routes: Routes = [
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
    ],
  },
];
