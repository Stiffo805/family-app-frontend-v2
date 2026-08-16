import { Component, computed, effect, inject, linkedSignal, signal } from '@angular/core'
import { NgIcon } from '@ng-icons/core'
import { NgClass } from '@angular/common'
import { Changelog } from '@src/app/components/core/changelog/changelog'
import { LayoutService } from '@src/app/services/layout.service'
import { Router, RouterLink } from '@angular/router'
import { PrimaryButton } from '@src/app/components/common/primary-button/primary-button'
import { Modal } from '@src/app/components/core/modal/modal'
import {
  getAllShoppingListsMainQueryKey,
  getLatestChangelogEntriesMainQueryKey,
  getUsernameQueryKey,
  LOCAL_STORAGE_SHOPPING_LISTS_KEY_NAME,
  LOCAL_STORAGE_USERNAME_KEY_NAME
} from '@src/app/util/constants'
import { CreateShoppingListFormData, FooterConfig } from '@src/app/util/types'
import { form, FormField } from '@angular/forms/signals'
import {
  injectMutation,
  injectQuery,
  keepPreviousData,
  QueryClient
} from '@tanstack/angular-query-experimental'
import {
  AllShoppingListsResponse,
  ShoppingListService
} from '@src/app/services/shopping-list.service'
import { getUsernameOptions } from '@src/app/api/queries/getUsernameOptions'
import {
  formatDatetime,
  getLocalShoppingLists,
  mapChangelogEntryRecordToChangelogEntry,
  mapShoppingListRecordToShoppingList
} from '@src/app/util/helpers'
import { OfflineService } from '@src/app/services/offline.service'
import { ChangelogService } from '@src/app/services/changelog.service'

const availableChangelogItemsLimits: number[] = [3, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

@Component({
  selector: 'app-dashboard-view',
  imports: [NgIcon, NgClass, Changelog, RouterLink, PrimaryButton, Modal, FormField],
  template: `
    <div [className]="'bg-blue2 pb-6 min-h-screen'">
      <div [className]="'p-4 flex gap-2 items-center'">
        <p>
          Nazwa urządzenia/użytkownika:
          <strong>{{ getUsernameQuery.data() ? getUsernameQuery.data() : 'Brak' }}</strong>
        </p>
        <ng-icon
          name="bootstrapPencil"
          [className]="'cursor-pointer'"
          size="14"
          (click)="changeUsernameModalOpen.set(true)"
        />
      </div>
      <hr />
      <div [className]="'flex justify-center gap-2 items-center pb-6 pt-12'">
        <h1 [className]="'text-center text-3xl font-semibold'">Historia zmian</h1>
      </div>

      <app-changelog [data]="changelogEntries()" />
      @if (changelogEntries()) {
        <div [className]="'flex justify-center'">
          <app-primary-button
            text="Pokaż więcej"
            iconName="bootstrapPlusLg"
            customClass="bg-green2 mt-4"
            (onClick)="handleIncreaseChangelogItemsLimit($event)"
          />
        </div>
      }

      <h1
        [className]="'text-center text-3xl font-semibold pb-6 pt-18'"
        id="shopping-lists-container"
      >
        Listy zakupów
      </h1>
      <div [className]="'flex flex-col items-center pb-6 gap-4'">
        <app-primary-button
          text="Utwórz listę"
          iconName="bootstrapPlusLg"
          customClass="bg-green2"
          (onClick)="createShoppingListModalOpen.set(true)"
          [disabled]="offlineService.isOfflineMode()"
        />
        @if (!!shoppingLists()?.length && !offlineService.isOfflineMode()) {
          <app-primary-button
            text="Zapisz/zaktualizuj listy offline"
            iconName="bootstrapSave"
            customClass="bg-gray-300"
            (onClick)="saveShoppingListsToLocalStorage()"
            [disabled]="shoppingListsSaved()"
          />
        }
      </div>
      <div
        [ngClass]="{
          'flex flex-wrap gap-6': true,
          'justify-center': this.layoutService.isMobile(),
          'px-6': !this.layoutService.isMobile()
        }"
      >
        @for (shoppingList of shoppingLists(); track shoppingList?.title) {
          <div
            [ngClass]="{
              'bg-blue-200 min-w-100 py-4 px-6 rounded-lg flex flex-col gap-2 cursor-pointer': true,
              'w-6/7': layoutService.isMobile(),
              'w-[calc(33%-var(--spacing)*3)]': !layoutService.isMobile()
            }"
            [routerLink]="['/shopping-list', shoppingList?.id]"
          >
            <p [className]="'text-2xl text-blue1'">
              <strong>{{ shoppingList?.title }}</strong>
            </p>
            <p [className]="'text-md'">
              Data ostatniej modyfikacji:
              <strong [className]="'text-purple1'">{{
                formatDatetimeHelper(shoppingList?.lastUpdatedAt)
              }}</strong>
            </p>
          </div>
        } @empty {
          <p [className]="'text-center text-lg pb-4 w-full'">
            Nie utworzono jeszcze żadnej listy zakupów.
          </p>
        }
      </div>
    </div>
    <app-modal
      [(open)]="changeUsernameModalOpen"
      title="Zmiana nazwy urządzenia"
      [footer]="changeUsernameModalFooter"
    >
      <p [className]="'text-lg pb-2'">Nazwa urządzenia</p>
      <input
        [className]="'bg-white text-lg p-2'"
        [defaultValue]="getUsernameQuery.data()"
        [formField]="usernameForm.username"
      />
    </app-modal>
    <app-modal
      [(open)]="createShoppingListModalOpen"
      title="Tworzenie nowej listy zakupów"
      [footer]="newShoppingListModalFooter"
    >
      <p [className]="'text-lg pb-2'">Nazwa listy</p>
      <input
        [className]="'bg-white text-lg p-2'"
        placeholder="podaj nazwę listy"
        [formField]="newShoppingListForm.title"
      />
      @if (createShoppingListMutation.isError()) {
        <p [className]="'text-red-700 pt-2'">Istnieje już lista zakupów o tej nazwie</p>
      }
    </app-modal>
  `,
  styleUrl: './dashboard-view.css'
})
export class DashboardView {
  layoutService = inject(LayoutService)
  shoppingListService = inject(ShoppingListService)
  changelogService = inject(ChangelogService)
  offlineService = inject(OfflineService)

  queryClient = inject(QueryClient)

  getUsernameQuery = injectQuery(() => getUsernameOptions)

  latestChangelogEntriesQuery = injectQuery(() => ({
    queryKey: [getLatestChangelogEntriesMainQueryKey, this.changelogItemsLimit()],
    queryFn: () => {
      return this.changelogService.getLatestEntries(this.changelogItemsLimit())
    },
    placeholderData: keepPreviousData
  }))

  shoppingListsQuery = injectQuery(() => ({
    queryKey: [getAllShoppingListsMainQueryKey],
    queryFn: () => {
      if (this.offlineService.isOfflineMode()) {
        return { items: getLocalShoppingLists() } as AllShoppingListsResponse
      }
      return this.shoppingListService.getAllShoppingLists()
    }
  }))

  createShoppingListMutation = injectMutation(() => ({
    mutationFn: () => {
      return this.shoppingListService.createShoppingList(this.newShoppingListModel())
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({
        queryKey: [getAllShoppingListsMainQueryKey]
      })
      this.createShoppingListModalOpen.set(false)
    }
  }))

  changelogItemsLimitIndex = signal<number>(0)
  shoppingListsSaved = signal<boolean>(false)

  changeUsernameModalOpen = signal<boolean>(false)
  createShoppingListModalOpen = signal<boolean>(false)

  newShoppingListModel = signal<CreateShoppingListFormData>({
    title: ''
  })

  usernameModel = linkedSignal<{ username: string }>(() => ({
    username: this.getUsernameQuery.data() ?? ''
  }))

  usernameForm = form(this.usernameModel)
  newShoppingListForm = form(this.newShoppingListModel)

  changelogItemsLimit = computed(
    () => availableChangelogItemsLimits[this.changelogItemsLimitIndex()]
  )

  changelogEntries = computed(() =>
    this.latestChangelogEntriesQuery
      .data()
      ?.items.map((item) => mapChangelogEntryRecordToChangelogEntry(item))
  )

  shoppingLists = computed(() =>
    this.shoppingListsQuery.data()?.items.map((item) => mapShoppingListRecordToShoppingList(item))
  )

  changeUsernameModalFooter: FooterConfig = {
    rightButtons: [
      {
        text: 'Anuluj',
        customClass: 'bg-red-700',
        click: () => {
          this.changeUsernameModalOpen.set(false)
        }
      },
      {
        text: 'Zapisz',
        customClass: 'bg-green2',
        click: () => {
          localStorage.setItem(LOCAL_STORAGE_USERNAME_KEY_NAME, this.usernameModel().username)
          this.queryClient.invalidateQueries({
            queryKey: [getUsernameQueryKey]
          })
          this.changeUsernameModalOpen.set(false)
        }
      }
    ]
  }

  newShoppingListModalFooter: FooterConfig = {
    rightButtons: [
      {
        text: 'Anuluj',
        customClass: 'bg-red-700',
        disabled: this.createShoppingListMutation.isPending(),
        click: () => {
          this.createShoppingListModalOpen.set(false)
        }
      },
      {
        text: 'Utwórz',
        customClass: 'bg-green2',
        disabled: this.createShoppingListMutation.isPending(),
        click: () => {
          this.createShoppingListMutation.mutate()
        }
      }
    ]
  }

  saveShoppingListsToLocalStorage = () => {
    localStorage.setItem(
      LOCAL_STORAGE_SHOPPING_LISTS_KEY_NAME,
      JSON.stringify(this.shoppingLists())
    )
    this.shoppingListsSaved.set(true)
  }

  handleIncreaseChangelogItemsLimit = (event: Event) => {
    event.preventDefault()
    if (this.changelogItemsLimitIndex() < availableChangelogItemsLimits.length - 1) {
      this.changelogItemsLimitIndex.update((cur) => cur + 1)
    }
  }

  handleDecreaseChangelogItemsLimit = () => {
    if (this.changelogItemsLimitIndex() > 0) {
      this.changelogItemsLimitIndex.update((cur) => cur - 1)
    }
  }

  formatDatetimeHelper = formatDatetime
}
