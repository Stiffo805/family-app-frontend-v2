import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  model,
  Signal,
  signal,
  viewChild
} from '@angular/core'
import { form, FormField } from '@angular/forms/signals'
import { NgIcon } from '@ng-icons/core'
import { Modal } from '@src/app/components/core/modal/modal'
import { OfflineService } from '@src/app/services/offline.service'
import { ProductService } from '@src/app/services/product.service'
import { ShoppingListEntryService } from '@src/app/services/shopping-list-entry.service'
import { UnitsService } from '@src/app/services/units.service'
import {
  getAllUnitsQueryKey,
  getProductByIdMainQueryKey,
  getShoppingListMainQueryKey
} from '@src/app/util/constants'
import {
  CustomUnit,
  DirectlyEditableListEntryField,
  EditEntryFormData,
  FooterConfig,
  ShoppingListEntry,
  ShoppingListEntryRecord
} from '@src/app/util/types'
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental'

@Component({
  selector: 'app-entry-edition-modal',
  imports: [Modal, NgIcon, FormField],
  template: `
    <app-modal [title]="'Edytowanie produktu na liście'" [(open)]="open" [footer]="footer">
      <div [className]="'flex flex-col gap-2'">
        <!-- PRODUCT INPUT  -->
        <div [className]="'flex justify-between items-center bg-white p-2 rounded-lg'">
          <p>
            Wybrany produkt:
            @if (chosenProductName()) {
              <strong [className]="'text-green1'">{{ chosenProductName() }}</strong>
            } @else {
              <i [className]="'text-red-700 font-bold'">nie wybrano produktu</i>
            }
          </p>
        </div>

        <!-- QUANTITY INPUT  -->
        <div [className]="'flex justify-between items-center bg-white p-2 rounded-lg'">
          <p>
            Ilość (liczba):
            @if (currentlyEditedField() === 'quantity') {
              <input
                #quantityInput
                [className]="'bg-blue-100 py-1 px-2 w-20'"
                type="number"
                [formField]="entryEditionForm.quantity"
              />
            } @else {
              <i [className]="'text-gray-700 font-bold'">
                @if (entryEditionModel().quantity) {
                  {{ entryEditionModel().quantity }}
                } @else {
                  nie dodano
                }
              </i>
            }
          </p>
          @if (currentlyEditedField() === 'quantity') {
            <ng-icon
              name="bootstrapSave"
              [className]="'cursor-pointer'"
              size="20"
              (click)="currentlyEditedField.set(null)"
            />
          } @else {
            <ng-icon
              name="bootstrapPencil"
              [className]="'cursor-pointer'"
              size="20"
              (click)="handleClickPencilOnDirectlyEditableField('quantity')"
            />
          }
        </div>

        <!-- UNIT INPUT  -->
        <div [className]="'flex justify-between items-center bg-white p-2 rounded-lg'">
          <p>
            Jednostka:
            @if (currentlyEditedField() === 'unit') {
              <select
                #unitInput
                [className]="'bg-blue-100 py-1 px-2'"
                [formField]="entryEditionForm.unit"
              >
                <option value="" [selected]="!entryEditionModel().unit">-</option>
                @for (unit of allUnitsQuery.data()?.items; track unit) {
                  <option [value]="unit" [selected]="entryEditionModel().unit === unit">
                    {{ unit }}
                  </option>
                }
              </select>
            } @else {
              <i [className]="'text-gray-700 font-bold'">
                @if (entryEditionModel().unit) {
                  {{ entryEditionModel().unit }}
                } @else {
                  nie dodano
                }
              </i>
            }
          </p>
          @if (currentlyEditedField() === 'unit') {
            <ng-icon
              name="bootstrapSave"
              [className]="'cursor-pointer'"
              size="20"
              (click)="currentlyEditedField.set(null)"
            />
          } @else {
            <ng-icon
              name="bootstrapPencil"
              [className]="'cursor-pointer'"
              size="20"
              (click)="handleClickPencilOnDirectlyEditableField('unit')"
            />
          }
        </div>

        <!-- EXTRA NOTES INPUT  -->
        <div [className]="'flex justify-between items-center bg-white p-2 rounded-lg'">
          <p>
            Dodatkowe uwagi:
            @if (currentlyEditedField() === 'extraNotes') {
              <input
                #extraNotesInput
                [className]="'bg-blue-100 py-1 px-2'"
                [formField]="entryEditionForm.extraNotes"
              />
            } @else {
              <i [className]="'text-gray-700 font-bold'">
                @if (entryEditionModel().extraNotes) {
                  {{ entryEditionModel().extraNotes }}
                } @else {
                  nie dodano
                }
              </i>
            }
          </p>
          @if (currentlyEditedField() === 'extraNotes') {
            <ng-icon
              name="bootstrapSave"
              [className]="'cursor-pointer'"
              size="20"
              (click)="currentlyEditedField.set(null)"
            />
          } @else {
            <ng-icon
              name="bootstrapPencil"
              [className]="'cursor-pointer'"
              size="20"
              (click)="handleClickPencilOnDirectlyEditableField('extraNotes')"
            />
          }
        </div>
      </div>
    </app-modal>
  `
})
export class EntryEditionModal {
  productService = inject(ProductService)
  shoppingListEntryService = inject(ShoppingListEntryService)
  offlineService = inject(OfflineService)
  unitsService = inject(UnitsService)
  queryClient = inject(QueryClient)

  allUnitsQuery = injectQuery(() => ({
    queryKey: [getAllUnitsQueryKey],
    queryFn: () => {
      return this.unitsService.getAllUnits()
    }
  }))

  getProductByIdQuery = injectQuery(() => ({
    queryKey: [getProductByIdMainQueryKey, this.entry()?.product.id],
    queryFn: () => {
      return this.productService.getProductById(this.entry()?.product.id)
    },
    enabled: !!this.entry()?.product.id && !this.offlineService.isOfflineMode()
  }))

  editEntryMutation = injectMutation(() => ({
    mutationFn: () => {
      return this.shoppingListEntryService.editShoppingListEntry(this.entryEditionModel())
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({
        queryKey: [getShoppingListMainQueryKey]
      })
      this.open.set(false)
    }
  }))

  deleteEntryMutation = injectMutation(() => ({
    mutationFn: () => {
      return this.shoppingListEntryService.deleteShoppingListEntry(this.entry()?.id ?? '')
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({
        queryKey: [getShoppingListMainQueryKey]
      })
      this.open.set(false)
    }
  }))

  chosenProductName = computed(() => this.getProductByIdQuery.data()?.item.name)

  open = model.required<boolean>()
  shoppingListId = input<string>()
  entry = input<ShoppingListEntry>()

  currentlyEditedField = signal<DirectlyEditableListEntryField | null>(null)

  defaultEntryEditionModel: Signal<EditEntryFormData> = computed(() => ({
    entryId: this.entry()?.id ?? null,
    productId: this.entry()?.product.id ?? null,
    quantity: this.entry()?.quantity ?? 0,
    unit: this.entry()?.unit ?? '',
    extraNotes: this.entry()?.extraNotes ?? ''
  }))

  entryEditionModel = linkedSignal<EditEntryFormData>(() => ({
    entryId: this.entry()?.id ?? null,
    productId: this.entry()?.product.id ?? null,
    quantity: this.entry()?.quantity ?? 0,
    unit: this.entry()?.unit ?? ('' as CustomUnit),
    extraNotes: this.entry()?.extraNotes ?? ''
  }))

  entryEditionForm = form(this.entryEditionModel)

  readonly quantityInputElement = viewChild<ElementRef<HTMLInputElement>>('quantityInput')
  readonly unitInputElement = viewChild<ElementRef<HTMLInputElement>>('unitInput')
  readonly extraNotesInputElement = viewChild<ElementRef<HTMLInputElement>>('extraNotesInput')

  fieldNameToInput: Record<
    DirectlyEditableListEntryField,
    Signal<ElementRef<HTMLInputElement> | undefined>
  > = {
    quantity: this.quantityInputElement,
    unit: this.unitInputElement,
    extraNotes: this.extraNotesInputElement
  }

  footer: FooterConfig = {
    leftButtons: [
      {
        text: 'Usuń',
        customClass: 'bg-red-300',
        click: () => this.deleteEntryMutation.mutate()
      }
    ],
    rightButtons: [
      {
        text: 'Anuluj',
        customClass: 'bg-red-700',
        click: () => this.open.set(false)
      },
      {
        text: 'Zapisz',
        customClass: 'bg-green2',
        click: () => {
          this.editEntryMutation.mutate()
        }
      }
    ]
  }

  handleClickPencilOnDirectlyEditableField(fieldName: DirectlyEditableListEntryField): void {
    this.currentlyEditedField.set(fieldName)
    if (fieldName !== 'unit')
      setTimeout(() => {
        const nativeElement = this.fieldNameToInput[fieldName]()?.nativeElement
        nativeElement?.focus()
        nativeElement?.select()
      }, 10)
  }

  constructor() {
    effect(() => {
      if (!this.open()) {
        this.currentlyEditedField.set(null)
        this.entryEditionModel.set(this.defaultEntryEditionModel())
      }
    })
  }
}
