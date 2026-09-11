import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  signal,
  viewChildren
} from '@angular/core'
import { NgIcon } from '@ng-icons/core'
import { Modal } from '@src/app/components/core/modal/modal'
import { PrimaryButton } from '@src/app/components/common/primary-button/primary-button'
import {
  AddProductToListFormData,
  DirectlyEditableListEntryField,
  EditEntryFormData,
  FooterConfig,
  ShoppingListEntry,
  ShoppingListEntryRecord
} from '@src/app/util/types'
import { ProductChoiceModal } from '@src/app/components/core/modals/product-choice-modal/product-choice-modal'
import { defaultAddProductToListFormData } from '@src/app/util/defaults'
import { EntryAdditionModal } from '@src/app/components/core/modals/entry-addition-modal/entry-addition-modal'
import { EntryEditionModal } from '@src/app/components/core/modals/entry-edition-modal/entry-edition-modal'
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental'
import {
  getEntriesPositionsMainQueryKey,
  getShoppingListMainQueryKey
} from '@src/app/util/constants'
import { ShoppingListService } from '@src/app/services/shopping-list.service'
import {
  formatDatetime,
  getLocalShoppingLists,
  mapShoppingListEntryRecordToShoppingListEntry,
  mapShoppingListRecordToShoppingList
} from '@src/app/util/helpers'
import { ShoppingListEntryService } from '@src/app/services/shopping-list-entry.service'
import { NgClass } from '@angular/common'
import { OfflineService } from '@src/app/services/offline.service'
import { Spinner } from '@src/app/components/common/spinner/spinner'
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray
} from '@angular/cdk/drag-drop'

type AvailableSorting = {
  label: string
  value: 'alphabetically' | 'timestamp' | 'custom'
}

const availableSorting: AvailableSorting[] = [
  {
    label: 'własne',
    value: 'custom'
  },
  {
    label: 'alfabetycznie',
    value: 'alphabetically'
  },
  {
    label: 'wg daty ostatniej aktualizacji',
    value: 'timestamp'
  }
]

@Component({
  selector: 'app-shopping-list-view',
  imports: [
    NgIcon,
    PrimaryButton,
    EntryAdditionModal,
    ProductChoiceModal,
    EntryEditionModal,
    NgClass,
    Spinner,
    CdkDrag,
    CdkDragHandle,
    CdkDropList
  ],
  template: `
    <div [className]="'bg-blue2 pt-12 pb-6 flex flex-col items-center min-h-screen'">
      @if (offlineService.isOfflineMode() || !getShoppingListQuery.isPending()) {
        <h1 [className]="'text-3xl font-bold pb-6'">{{ shoppingList()?.title }}</h1>
        <div [className]="'bg-white w-[90vw] max-w-220 rounded-lg'">
          <div [className]="'flex p-4'">
            <app-primary-button
              text="Dodaj produkt"
              iconName="bootstrapPlusLg"
              (onClick)="setProductAdditionModalOpen(true)"
              customClass="bg-green2"
              [disabled]="offlineService.isOfflineMode()"
            />
          </div>
          <div [className]="'p-4 pt-2'">
            <div [className]="'flex flex-wrap gap-4 items-center'">
              <app-primary-button
                text="Przełącz sortowanie"
                customClass="bg-amber-300"
                (onClick)="changeCurrentSorting()"
              />
            </div>
            <div [className]="'flex items-center pt-4'">
              <i>Obecne sortowanie: {{ currentSorting().label }}</i>
            </div>
          </div>
          <hr />
          <div cdkDropList (cdkDropListDropped)="drop($event)" [cdkDropListAutoScrollStep]="10">
            @for (entry of entriesSorted(); track entry.id; let isLast = $last) {
              <div cdkDrag [cdkDragDisabled]="currentSorting().value !== 'custom'">
                <div
                  [ngClass]="{
                    'p-4 flex items-center justify-between bg-white border-b': true,
                    'opacity-50': entry.isChecked
                  }"
                >
                  <div [className]="'max-w-[calc(100%-50px)]'">
                    <p [className]="'flex flex-wrap text-xl'">
                      <span [className]="'text-green1 font-bold'">{{ entry.product.name }}</span>
                      @if (entry.quantity) {
                        &nbsp;-&nbsp;
                        <span
                          >{{ entry.quantity }}
                          @if (entry.unit) {
                            {{ entry.unit }}
                          }
                        </span>
                      }
                    </p>
                    <p [className]="'italic text-red-700'">{{ entry.extraNotes }}</p>
                    <p [className]="'italic text-gray-700'">
                      {{ formatDatetimeHelper(entry.lastUpdatedAt) }}
                    </p>
                  </div>
                  <div [className]="'flex items-center gap-8'">
                    <div
                      cdkDragHandle
                      class="cursor-grab active:cursor-grabbing items-center justify-center p-2 -m-2"
                      [ngClass]="currentSorting().value === 'custom' ? 'flex' : 'hidden'"
                    >
                      <ng-icon name="heroHandRaised" />
                    </div>

                    <ng-icon
                      name="bootstrapPencil"
                      [className]="'cursor-pointer'"
                      (click)="handleEditEntryClick(entry)"
                    />
                    <input
                      [type]="'checkbox'"
                      [className]="'size-6'"
                      [checked]="entry.isChecked"
                      (click)="handleClickCheck($event, entry)"
                    />
                  </div>
                </div>
              </div>
            } @empty {
              <p [className]="'text-center text-lg py-4'">
                Nie dodano jeszcze produktów do tej listy.
              </p>
            }
          </div>
        </div>
      } @else {
        <app-spinner />
      }
    </div>
    <app-entry-addition-modal
      [(open)]="entryAdditionModalOpen"
      [extraOpenCondition]="!productChoiceModalOpen()"
      (openChooseProductModal)="productChoiceModalOpen.set(true)"
      [(entryAdditionModel)]="entryAdditionModel"
    />
    <app-product-choice-modal
      [(open)]="productChoiceModalOpen"
      [shoppingListData]="shoppingList()"
      [(productAdditionModel)]="entryAdditionModel"
    />
    <app-entry-edition-modal
      [(open)]="entryEditionModalOpen"
      [shoppingListId]="shoppingList()?.id"
      [entry]="editedEntry()"
    />
  `,
  styleUrl: './shopping-list-view.css'
})
export class ShoppingListView {
  readonly id = input<string>()

  shoppingListService = inject(ShoppingListService)
  shoppingListEntryService = inject(ShoppingListEntryService)
  offlineService = inject(OfflineService)

  queryClient = inject(QueryClient)

  getShoppingListQuery = injectQuery(() => ({
    queryKey: [getShoppingListMainQueryKey, this.id(), this.offlineService.isOfflineMode()],
    queryFn: () => {
      return this.shoppingListService.getShoppingList(
        this.id() ?? '',
        this.offlineService.isOfflineMode()
      )
    }
  }))

  checkEntryMutation = injectMutation(() => ({
    mutationFn: ({ entryId, checked }: { entryId: string; checked: boolean }) => {
      return this.shoppingListEntryService.checkShoppingListEntry({
        entryId: entryId,
        checked: checked
      })
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({
        queryKey: [getShoppingListMainQueryKey]
      })
    }
  }))

  entriesPositions = injectQuery(() => ({
    queryKey: [getEntriesPositionsMainQueryKey, this.id()],
    queryFn: async () => {
      return this.shoppingListService
        .getEntriesPositions(this.id())
        ?.then((result) => result?.idsInOrder)
    }
  }))

  moveEntryToTopMutation = injectMutation(() => ({
    mutationFn: ({ entryId }: { entryId: string }) => {
      return this.shoppingListService.moveEntryToTopPosition(this.id() ?? '', entryId)
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({
        queryKey: [getEntriesPositionsMainQueryKey, this.id()]
      })
    }
  }))

  moveEntryPositionsMutation = injectMutation(() => ({
    mutationFn: ({
      currentIndex,
      previousIndex
    }: {
      currentIndex: number
      previousIndex: number
    }) => {
      return this.shoppingListService.moveEntryPositions(this.id(), currentIndex, previousIndex)
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({
        queryKey: [getEntriesPositionsMainQueryKey]
      })
    }
  }))

  currentSortingIndex = signal<number>(0)

  entryAdditionModalOpen = signal<boolean>(false)
  productChoiceModalOpen = signal<boolean>(false)
  entryEditionModalOpen = signal<boolean>(false)
  editedEntry = signal<ShoppingListEntry | undefined>(undefined)

  entryAdditionModel = linkedSignal<AddProductToListFormData>(() => ({
    ...defaultAddProductToListFormData,
    shoppingListId: this.id() ?? null
  }))

  shoppingList = computed(() =>
    mapShoppingListRecordToShoppingList(this.getShoppingListQuery.data())
  )

  entriesSorted = computed(() => {
    const sorting = this.currentSorting()
    const items = this.shoppingList()?.items ?? []
    const positions = this.entriesPositions.data() ?? []

    const positionsMap = new Map<string, number>()
    positions.forEach((id, index) => positionsMap.set(id, index))

    return items
      .map((item) => mapShoppingListEntryRecordToShoppingListEntry(item))
      .sort((entry1, entry2) => this.sortingFunction(entry1, entry2, sorting, positionsMap))
  })

  currentSorting = computed(() => availableSorting[this.currentSortingIndex()])

  sortingFunction = (
    entry1: ShoppingListEntry,
    entry2: ShoppingListEntry,
    sorting: AvailableSorting,
    positionsMap: Map<string, number>
  ) => {
    if (entry1.isChecked && !entry2.isChecked) return 1
    if (entry2.isChecked && !entry1.isChecked) return -1

    if (sorting.value === 'alphabetically') {
      return entry1.product.name.localeCompare(entry2.product.name)
    }

    if (sorting.value === 'timestamp') {
      return entry2.lastUpdatedAt.getTime() - entry1.lastUpdatedAt.getTime()
    }

    if (sorting.value === 'custom') {
      const hasEntry1 = positionsMap.has(entry1.id)
      const hasEntry2 = positionsMap.has(entry2.id)

      if (hasEntry1 && !hasEntry2) return -1
      if (hasEntry2 && !hasEntry1) return 1
      if (hasEntry1 && hasEntry2) {
        return (positionsMap.get(entry1.id) as number) - (positionsMap.get(entry2.id) as number)
      }
    }

    return 1
  }

  setProductAdditionModalOpen(open: boolean) {
    this.entryAdditionModalOpen.set(open)
  }

  handleEditEntryClick(entry: ShoppingListEntry) {
    if (!this.offlineService.isOfflineMode()) {
      this.editedEntry.set(entry)
      this.entryEditionModalOpen.set(true)
    }
  }

  handleClickCheck(event: Event, entry: ShoppingListEntry) {
    event.preventDefault()
    if (!this.offlineService.isOfflineMode()) {
      this.checkEntryMutation.mutate({ entryId: entry.id, checked: !entry.isChecked })
    }
  }

  changeCurrentSorting = () => {
    if (this.currentSortingIndex() >= availableSorting.length - 1) {
      this.currentSortingIndex.set(0)
    } else {
      this.currentSortingIndex.update((cur) => cur + 1)
    }
  }

  drop = (event: CdkDragDrop<string[]>) => {
    if (event.previousIndex === event.currentIndex) return

    const currentSortedList = this.entriesSorted()
    const draggedEntryId = currentSortedList[event.previousIndex].id
    const targetEntryId = currentSortedList[event.currentIndex].id

    const rawPositions = this.entriesPositions.data() ?? []
    const realPreviousIndex = rawPositions.indexOf(draggedEntryId)
    const realCurrentIndex = rawPositions.indexOf(targetEntryId)

    if (realPreviousIndex !== -1 && realCurrentIndex !== -1) {
      this.moveEntryPositionsMutation.mutate({
        currentIndex: realCurrentIndex,
        previousIndex: realPreviousIndex
      })
    }
  }
  formatDatetimeHelper = formatDatetime

  constructor() {
    effect(() => {
      if (!this.entryAdditionModalOpen()) {
        this.entryAdditionModel.set({
          ...defaultAddProductToListFormData,
          shoppingListId: this.id() ?? null
        })
      }
    })
    this.shoppingListService.fillMissingEntriesPositions()
  }
}
