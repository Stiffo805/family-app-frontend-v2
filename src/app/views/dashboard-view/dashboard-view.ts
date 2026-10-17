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
import { ManageShoppingListFormData, FooterConfig, ShoppingList } from '@src/app/util/types'
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
import { Spinner } from '@src/app/components/common/spinner/spinner'

const availableChangelogItemsLimits: number[] = [3, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

@Component({
  selector: 'app-dashboard-view',
  imports: [NgIcon, NgClass, Changelog, RouterLink, PrimaryButton, Modal, FormField, Spinner],
  template: `
    <div [className]="'bg-blue2 pb-6 min-h-screen'">
      @if (
        offlineService.isOfflineMode() ||
        (!getUsernameQuery.isPending() &&
          !latestChangelogEntriesQuery.isPending() &&
          !shoppingListsQuery.isPending())
      ) {
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
        @if (!offlineService.isOfflineMode()) {
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
        } @else {
          <p [className]="'text-center text-lg py-4'">Niedostępne w trybie offline.</p>
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
            (onClick)="manageShoppingListModalOpen.set(true)"
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
              <div [className]="'flex justify-between'">
                <p [className]="'text-2xl text-blue1'">
                  <strong>{{ shoppingList?.title }}</strong>
                </p>
                <ng-icon
                  name="bootstrapPencil"
                  (click)="handleClickShoppingListEditIcon(shoppingList, $event)"
                />
              </div>
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
      } @else {
        <app-spinner />
      }
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
      [(open)]="manageShoppingListModalOpen"
      [title]="editedShoppingListId() ? 'Edytowanie listy zakupów' : 'Tworzenie listy zakupów'"
      [footer]="manageShoppingListModalFooter()"
    >
      <p [className]="'text-lg pb-2'">Nazwa listy</p>
      <input
        [className]="'bg-white text-lg p-2'"
        placeholder="podaj nazwę listy"
        [formField]="manageShoppingListForm.title"
      />
      @if (createShoppingListMutation.isError() || editShoppingListMutation.isError()) {
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
    queryKey: [
      getLatestChangelogEntriesMainQueryKey,
      this.changelogItemsLimit(),
      this.offlineService.isOfflineMode()
    ],
    queryFn: () => {
      return this.changelogService.getLatestEntries(this.changelogItemsLimit())
    },
    placeholderData: keepPreviousData,
    enabled: () => !this.offlineService.isOfflineMode()
  }))

  shoppingListsQuery = injectQuery(() => ({
    queryKey: [getAllShoppingListsMainQueryKey, this.offlineService.isOfflineMode()],
    queryFn: () => {
      return this.shoppingListService.getAllShoppingLists(this.offlineService.isOfflineMode())
    }
  }))

  createShoppingListMutation = injectMutation(() => ({
    mutationFn: () => {
      return this.shoppingListService.createShoppingList(this.manageShoppingListModel())
    },
    onSuccess: async () => {
      this.queryClient.invalidateQueries({
        queryKey: [getAllShoppingListsMainQueryKey]
      })
      this.manageShoppingListModalOpen.set(false)
      await this.shoppingListService.fillMissingEntriesPositions()
    }
  }))

  editShoppingListMutation = injectMutation(() => ({
    mutationFn: () => {
      return this.shoppingListService.editShoppingList(
        this.editedShoppingListId() ?? '',
        this.manageShoppingListModel()
      )
    },
    onSuccess: async () => {
      this.queryClient.invalidateQueries({
        queryKey: [getAllShoppingListsMainQueryKey]
      })
      this.manageShoppingListModalOpen.set(false)
    }
  }))

  changelogItemsLimitIndex = signal<number>(0)
  shoppingListsSaved = signal<boolean>(false)

  changeUsernameModalOpen = signal<boolean>(false)
  manageShoppingListModalOpen = signal<boolean>(false)
  editedShoppingListId = signal<string | undefined>(undefined)

  manageShoppingListModel = signal<ManageShoppingListFormData>({
    title: ''
  })

  usernameModel = linkedSignal<{ username: string }>(() => ({
    username: this.getUsernameQuery.data() ?? ''
  }))

  usernameForm = form(this.usernameModel)
  manageShoppingListForm = form(this.manageShoppingListModel)

  changelogItemsLimit = computed(
    () => availableChangelogItemsLimits[this.changelogItemsLimitIndex()]
  )

  changelogEntries = computed(() =>
    this.latestChangelogEntriesQuery
      .data()
      ?.items.map((item) => mapChangelogEntryRecordToChangelogEntry(item))
  )

  shoppingLists = computed(() =>
    this.shoppingListsQuery
      .data()
      ?.items.map((item) => mapShoppingListRecordToShoppingList(item))
      .sort((list1, list2) => list1?.title.localeCompare(list2?.title ?? '') ?? 1)
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

  manageShoppingListModalFooter = linkedSignal(() => ({
    rightButtons: [
      {
        text: 'Anuluj',
        customClass: 'bg-red-700',
        disabled: this.createShoppingListMutation.isPending(),
        click: () => {
          this.manageShoppingListModalOpen.set(false)
        }
      },
      {
        text: this.editedShoppingListId() ? 'Zapisz' : 'Utwórz',
        customClass: 'bg-green2',
        disabled: this.createShoppingListMutation.isPending(),
        click: () => {
          if (this.editedShoppingListId()) {
            this.editShoppingListMutation.mutate()
          } else {
            this.createShoppingListMutation.mutate()
          }
        }
      }
    ]
  }))

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

  handleClickShoppingListEditIcon = (shoppingList: ShoppingList | undefined, event: Event) => {
    event.stopPropagation()

    if (!shoppingList) return

    this.editedShoppingListId.set(shoppingList.id)

    const theList = this.shoppingLists()?.find((item) => item?.id === shoppingList.id)

    this.manageShoppingListModel.set({
      title: theList?.title ?? ''
    })
    this.manageShoppingListModalOpen.set(true)
  }

  formatDatetimeHelper = formatDatetime

  constructor() {
    this.shoppingListService.fillMissingEntriesPositions()

    effect(() => {
      if (!this.manageShoppingListModalOpen()) {
        this.editedShoppingListId.set(undefined)
        this.manageShoppingListModel.set({
          title: ''
        })
      }
    })
  }
}
