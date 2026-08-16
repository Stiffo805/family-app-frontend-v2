import { Component, effect, inject } from '@angular/core'
import { Router, RouterOutlet } from '@angular/router'
import { TopBar } from '@src/app/components/navigation/top-bar/top-bar'
import { AuthService } from '@src/app/services/auth.service'
import { OfflineService } from '@src/app/services/offline.service'
import { injectMutation, QueryClient } from '@tanstack/angular-query-experimental'

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
    this.checkPassMutation.mutate()

    effect(() => {
      if (!this.offlineService.isOfflineMode() && this.checkPassMutation.error()) {
        this.router.navigate(['/login'])
      }
    })
  }
}
