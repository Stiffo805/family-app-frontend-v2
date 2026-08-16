import { Component, effect, inject, signal } from '@angular/core'
import { form, FormField } from '@angular/forms/signals'
import { Router } from '@angular/router'
import { PrimaryButton } from '@src/app/components/common/primary-button/primary-button'
import { AuthService } from '@src/app/services/auth.service'
import { OfflineService } from '@src/app/services/offline.service'
import { LOCAL_STORAGE_PASSWORD_KEY_NAME } from '@src/app/util/constants'
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental'

type LoginFormData = {
  password: string
}

@Component({
  selector: 'app-login-view',
  imports: [PrimaryButton, FormField],
  template: `
    <div [className]="'flex justify-center items-center min-h-screen bg-blue2'">
      <div [className]="'w-[min(90vw,500px)] rounded-md border-4 border-white p-8'">
        <div [className]="'flex flex-col items-center justify-center gap-6'">
          <h1 [className]="'text-2xl font-bold'">Podaj hasło do aplikacji</h1>
          <input
            type="password"
            [classList]="'bg-white border border-blue3 text-2xl p-3 w-full'"
            placeholder="wprowadź hasło"
            [formField]="loginForm.password"
          />
        </div>
        <div [className]="'flex justify-end items-center gap-8 pt-4'">
          @if (loginMutation.error() && !loginMutation.isPending()) {
            <p [className]="'text-center text-lg text-red-700'">Nie udało się zalogować!</p>
          }
          <app-primary-button
            text="Zaloguj"
            customClass="bg-green2 text-2xl"
            (onClick)="loginMutation.mutate()"
          />
        </div>
      </div>
    </div>
  `,
  styleUrl: './login-view.css'
})
export class LoginView {
  private router = inject(Router)

  authService = inject(AuthService)
  offlineService = inject(OfflineService)
  queryClient = inject(QueryClient)

  loginMutation = injectMutation(() => ({
    mutationFn: () => {
      localStorage.setItem(LOCAL_STORAGE_PASSWORD_KEY_NAME, this.loginModel().password)
      return this.authService.tryLogin()
    }
  }))

  checkPassMutation = injectQuery(() => ({
    queryKey: ['login'],
    queryFn: () => {
      return this.authService.tryLogin()
    },
    refetchOnMount: true
  }))

  loginModel = signal<LoginFormData>({
    password: ''
  })

  loginForm = form(this.loginModel)

  constructor() {
    effect(() => {
      if (this.loginMutation.isSuccess() || this.checkPassMutation.isSuccess()) {
        this.router.navigate(['/'])
      }
    })

    effect(() => {
      if (this.offlineService.isOfflineMode()) {
        this.router.navigate(['/'])
      }
    })
  }
}
