import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
  viewChild,
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
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
          <div [className]="'flex flex-col gap-4 p-4'">
            <app-primary-button
              text="Dodaj produkt"
              iconName="bootstrapPlusLg"
              (onClick)="setProductAdditionModalOpen(true)"
              customClass="bg-green2"
              [disabled]="offlineService.isOfflineMode()"
            />
            <app-primary-button
              text="Pobierz PDF"
              iconName="primeDownload"
              customClass="border-2 border-gray-300"
              (onClick)="generatePdf()"
              [disabled]="isGeneratingPdf()"
            />

            <app-primary-button
              text="Przełącz sortowanie"
              customClass="bg-amber-300"
              (onClick)="changeCurrentSorting()"
            />

            <i>Obecne sortowanie: {{ currentSorting().label }}</i>
          </div>
          <hr />
          <div
            cdkDropList
            (cdkDropListDropped)="drop($event)"
            [cdkDropListAutoScrollStep]="10"
            #pdfContent
          >
            @for (entry of entriesSorted(); track entry.id; let isLast = $last) {
              <div
                cdkDrag
                [cdkDragDisabled]="currentSorting().value !== 'custom'"
                [cdkDragStartDelay]="{ touch: 500, mouse: 0 }"
              >
                <div
                  [ngClass]="{
                    'p-4 flex items-center justify-between bg-[#ffffff] border-b border-[#e5e7eb]': true,
                    'opacity-50': entry.isChecked
                  }"
                >
                  <div [className]="'max-w-[calc(100%-50px)]'">
                    <p [className]="'text-xl wrap-break-word'">
                      <span [className]="'text-[#4d7c0f] font-bold'">{{ entry.product.name }}</span>
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
                    <p [className]="'italic text-[#b91c1c]'">{{ entry.extraNotes }}</p>
                    <p [className]="'italic text-[#374151]'">
                      {{ formatDatetimeHelper(entry.lastUpdatedAt) }}
                    </p>
                  </div>
                  <div [className]="'flex items-center gap-8'">
                    <div
                      cdkDragHandle
                      class="group relative cursor-grab active:cursor-grabbing items-center justify-center p-2 -m-2"
                      [ngClass]="currentSorting().value === 'custom' ? 'flex' : 'hidden'"
                    >
                      <div
                        class="absolute inset-0 bg-[#bfdbfe] rounded-full scale-0 opacity-0 transition-all duration-500 ease-linear group-active:scale-100 group-active:opacity-100"
                      ></div>
                      <ng-icon
                        name="heroHandRaised"
                        class="relative z-10 transition-colors duration-500 group-active:text-[#1d4ed8]"
                      />
                    </div>

                    <ng-icon
                      name="bootstrapPencil"
                      [className]="'cursor-pointer'"
                      (click)="handleEditEntryClick(entry)"
                    />
                    <div
                      [ngClass]="[
                        'rounded-full w-10 h-10 relative flex items-center justify-center opacity-75 overflow-hidden',
                        entry.isChecked ? 'bg-[#dcfce3]' : 'bg-[#f3f4f6]',
                        animatedEntriesIds().includes(entry.id)
                          ? entry.isChecked
                            ? 'uncheck-anim'
                            : 'check-anim'
                          : ''
                      ]"
                      (click)="handleClickCheck(entry)"
                    >
                      <ng-icon
                        name="heroCheck"
                        [ngClass]="[entry.isChecked ? 'text-[#22c55e]!' : 'text-[#9ca3af]!', 'z-5']"
                        strokeWidth="3"
                      />
                    </div>
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

  animatedEntries = signal<{ entryId: string; timeoutId: number }[]>([])

  animatedEntriesIds = computed(() => this.animatedEntries().map((item) => item.entryId))

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

  handleClickCheck(entry: ShoppingListEntry) {
    if (!this.offlineService.isOfflineMode()) {
      if (!this.animatedEntriesIds().includes(entry.id)) {
        const timeoutId = setTimeout(() => {
          this.animatedEntries.update((cur) => cur.filter((item) => item.entryId !== entry.id))
          this.checkEntryMutation.mutate({ entryId: entry.id, checked: !entry.isChecked })
        }, 1000)
        this.animatedEntries.update((cur) => [
          ...cur,
          {
            entryId: entry.id,
            timeoutId
          }
        ])
      } else {
        clearTimeout(this.animatedEntries().find((item) => item.entryId === entry.id)?.timeoutId)
        this.animatedEntries.update((cur) => cur.filter((item) => item.entryId !== entry.id))
      }
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

  isGeneratingPdf = signal<boolean>(false)
  pdfContent = viewChild<ElementRef<HTMLDivElement>>('pdfContent')

  generatePdf = async () => {
    this.isGeneratingPdf.set(true)
    const element = this.pdfContent()?.nativeElement

    if (!element) {
      this.isGeneratingPdf.set(false)
      return
    }

    try {
      // 1. Generate canvas from the HTML element
      const canvas = await html2canvas(element, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')

      // 2. Set constant width (210mm is standard A4 width)
      const pdfWidth = 210

      // 3. Calculate dynamic height based on the canvas proportions
      const calculatedHeight = (canvas.height * pdfWidth) / canvas.width

      // 4. Ensure minimum height matches standard A4 height (297mm)
      // This prevents the PDF from looking like a horizontal strip for short lists
      const pdfHeight = Math.max(calculatedHeight, 297)

      // 5. Create jsPDF instance with custom dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      })

      // 6. Add the image starting from top-left (0,0)
      // Note: We use calculatedHeight for the image drawing to avoid vertical stretching!
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, calculatedHeight)

      // 7. Save the file
      pdf.save(`zakupy-${this.shoppingList()?.title || 'lista'}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      this.isGeneratingPdf.set(false)
    }
  }
}
