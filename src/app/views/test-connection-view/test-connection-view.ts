import { Component, inject, signal } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { HealthService } from '@src/app/services/health.service'
import { healthMainQueryKey } from '@src/app/util/constants'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { NgIcon } from "@ng-icons/core";
import { OfflineService } from '@src/app/services/offline.service'
import { PrimaryButton } from "@src/app/components/common/primary-button/primary-button";

@Component({
  selector: 'app-test-connection-view',
  imports: [RouterOutlet, NgIcon, PrimaryButton],
  template: `
    @if ((healthQuery.isPending() || healthQuery.isError()) && !offlineService.isOfflineMode()) {
      <div [className]="'flex justify-center items-center min-h-screen bg-blue2'">
        <div [className]="'bg-white p-8 flex flex-col items-center'">
          <h1 [className]="'text-xl pb-4'">Testowanie połączenia z serwerem</h1>
          <ng-icon name="primeSpinner" size="32" [className]="'animate-spin'" />
          <app-primary-button text="Wejdź offline" customClass="bg-green2 mt-4" (onClick)="offlineService.isOfflineMode.set(true)" />
        </div>
      </div>
    } @else {
      <router-outlet />
    }
  `,
  styleUrl: './test-connection-view.css'
})
export class TestConnectionView {
  healthService = inject(HealthService)
  offlineService = inject(OfflineService)

  healthQuery = injectQuery(() => ({
    queryKey: [healthMainQueryKey],
    queryFn: () => {
      return this.healthService.health()
    },
    refetchInterval: () => 5000
  }))
}
