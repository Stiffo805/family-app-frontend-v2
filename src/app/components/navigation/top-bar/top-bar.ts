import { Component, effect, inject, signal } from '@angular/core'
import { NgIcon } from '@ng-icons/core'
import { Router, RouterLink } from '@angular/router'
import { Modal } from '@src/app/components/core/modal/modal'
import { FooterConfig } from '@src/app/util/types'
import { healthMainQueryKey, LOCAL_STORAGE_PASSWORD_KEY_NAME } from '@src/app/util/constants'
import { PrimaryButton } from '../../common/primary-button/primary-button'
import { OfflineService } from '@src/app/services/offline.service'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { HealthService } from '@src/app/services/health.service'

@Component({
  selector: 'app-top-bar',
  imports: [NgIcon, RouterLink, Modal, PrimaryButton],
  template: `
    <div
      [className]="'bg-blue2 sticky top-0 w-full py-2 px-4 opacity-80 flex justify-between items-center'"
    >
      <div [className]="'flex gap-4'">
        <ng-icon
          name="heroHome"
          size="36"
          [routerLink]="'/'"
          fragment="shopping-lists-container"
          [className]="'cursor-pointer'"
        />
        @if (offlineService.isOfflineMode()) {
          <app-primary-button
            text="Wejdź online"
            iconName="bootstrapGlobe"
            [disabled]="healthQuery.isPending() || healthQuery.isError()"
            customClass="bg-green2"
            (onClick)="offlineService.isOfflineMode.set(false)"
          />
        }
      </div>
      <div
        [className]="'flex items-center gap-2 text-xl cursor-pointer'"
        (click)="logoutModalOpen.set(true)"
      >
        Wyloguj <ng-icon name="ionLogOutOutline" size="32" />
      </div>
    </div>
    <app-modal [(open)]="logoutModalOpen" title="Wylogowywanie" [footer]="logoutModalFooter">
      <p>Na pewno chcesz się wylogować?</p>
    </app-modal>
  `,
  styleUrl: './top-bar.css'
})
export class TopBar {
  private router = inject(Router)

  healthService = inject(HealthService)
  offlineService = inject(OfflineService)

  healthQuery = injectQuery(() => ({
    queryKey: [healthMainQueryKey],
    queryFn: () => {
      return this.healthService.health()
    },
    refetchInterval: 5000
  }))

  navOpen = signal(false)

  logoutModalOpen = signal<boolean>(false)

  logoutModalFooter: FooterConfig = {
    rightButtons: [
      {
        text: 'Anuluj',
        customClass: 'bg-gray-100',
        click: () => {
          this.logoutModalOpen.set(false)
        }
      },
      {
        text: 'Potwierdź',
        customClass: 'bg-green2',
        click: () => {
          localStorage.setItem(LOCAL_STORAGE_PASSWORD_KEY_NAME, '')
          this.offlineService.isOfflineMode.set(false)
          this.router.navigate(['/login'])
          this.logoutModalOpen.set(false)
        }
      }
    ]
  }

  toggleNavOpen() {
    this.navOpen.update((cur) => !cur)
  }
}
