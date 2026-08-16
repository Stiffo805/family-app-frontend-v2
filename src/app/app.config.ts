import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core'
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental'

import { routes } from './app.routes'
import { authInterceptor } from '@src/app/api/interceptors/authInterceptor'
import { baseUrlInterceptor } from '@src/app/api/interceptors/baseUrlInterceptor'
import { usernameInterceptor } from '@src/app/api/interceptors/usernameInterceptor'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled'
      })
    ),
    provideHttpClient(withInterceptors([baseUrlInterceptor, authInterceptor, usernameInterceptor])),
    provideTanStackQuery(new QueryClient())
  ]
}
