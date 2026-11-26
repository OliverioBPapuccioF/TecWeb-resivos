import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { registroHttpInterceptor } from './pages/example/registro-http.interceptor';

// configuration of the whole app (replaces the AppModule of older Angular versions)
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // HttpClient for the services that call the API (replaces HttpClientModule).
    // Since Angular 22 it uses fetch by default, so withFetch() is not needed.
    // registroHttpInterceptor only writes down the status code for the /example page
    // (if /example is deleted at the end, delete it from here too)
    provideHttpClient(withInterceptors([registroHttpInterceptor])),
  ],
};
