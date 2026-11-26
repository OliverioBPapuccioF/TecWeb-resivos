import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideCharts } from 'ng2-charts';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  PieController,
  Tooltip,
} from 'chart.js';
import { routes } from './app.routes';
import { registroHttpInterceptor } from './pages/example/registro-http.interceptor';
import { tiempoLimiteInterceptor } from './services/tiempo-limite.interceptor';

// configuration of the whole app (replaces the AppModule of older Angular versions)
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // HttpClient for the services that call the API (replaces HttpClientModule).
    // Since Angular 22 it uses fetch by default, so withFetch() is not needed.
    // tiempoLimiteInterceptor: a request fails if the API does not answer in 90 s.
    // registroHttpInterceptor only writes down the status code for the /example page
    // (if /example is deleted at the end, delete it from here too)
    provideHttpClient(withInterceptors([tiempoLimiteInterceptor, registroHttpInterceptor])),
    // Chart.js (charts of the home page) through ng2-charts. Only the pieces that are used
    // are registered (doughnut, pie and bars), so the rest of Chart.js is not in the bundle
    provideCharts({
      registerables: [
        DoughnutController,
        PieController,
        ArcElement,
        BarController,
        BarElement,
        CategoryScale,
        LinearScale,
        Tooltip,
        Legend,
      ],
    }),
  ],
};
