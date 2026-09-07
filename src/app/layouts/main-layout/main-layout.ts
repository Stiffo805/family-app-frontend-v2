import { Component, effect, inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { Router, RouterOutlet } from '@angular/router'
import { TopBar } from '@src/app/components/navigation/top-bar/top-bar'
import { AuthService } from '@src/app/services/auth.service'
import { OfflineService } from '@src/app/services/offline.service'
import { injectMutation, QueryClient } from '@tanstack/angular-query-experimental'
import { switchMap } from 'rxjs'

@Component({
  selector: 'app-main-layout',
  imports: [TopBar, RouterOutlet],
  template: `
    <app-top-bar />
    <router-outlet />
  `,
  styleUrl: './main-layout.css'
})
export class MainLayout {
  private router = inject(Router)

  authService = inject(AuthService)
  offlineService = inject(OfflineService)
  queryClient = inject(QueryClient)

  checkPassMutation = injectMutation(() => ({
    mutationFn: () => {
      return this.authService.tryLogin()
    }
  }))

  constructor() {
    toObservable(this.offlineService.isOfflineMode)
      .pipe(
        switchMap(async (isOfflineMode) => {
          if (isOfflineMode) return

          try {
            await this.checkPassMutation.mutateAsync()
          } catch (error) {
            this.router.navigate(['/login'])
          }
        })
      )
      .subscribe()
  }
}
