import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
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
  getProductsMainQueryKey,
  getShoppingListMainQueryKey
} from '@src/app/util/constants'
import {
  AddProductToListFormData,
  DirectlyEditableListEntryField,
  FooterConfig
} from '@src/app/util/types'
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental'

@Component({
  selector: 'app-entry-addition-modal',
  imports: [Modal, NgIcon, FormField],
  template: `
    <app-modal
      [title]="'Dodawanie produktu do listy'"
      [(open)]="open"
      [extraOpenCondition]="extraOpenCondition()"
      [footer]="footer"
    >
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
          <ng-icon
            name="bootstrapPencil"
            [className]="'cursor-pointer'"
            size="20"
            (click)="handleClickPencilOnChooseProduct()"
          />
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
                [formField]="entryAdditionForm.quantity"
              />
            } @else {
              <i [className]="'text-gray-700 font-bold'">
                @if (entryAdditionModel().quantity) {
                  {{ entryAdditionModel().quantity }}
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
                [formField]="entryAdditionForm.unit"
              >
                <option value="" [selected]="!entryAdditionModel().unit">-</option>
                @for (unit of allUnitsQuery.data()?.items; track unit) {
                  <option [value]="unit" [selected]="entryAdditionModel().unit === unit">
                    {{ unit }}
                  </option>
                }
              </select>
            } @else {
              <i [className]="'text-gray-700 font-bold'">
                @if (entryAdditionModel().unit) {
                  {{ entryAdditionModel().unit }}
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
                [formField]="entryAdditionForm.extraNotes"
              />
            } @else {
              <i [className]="'text-gray-700 font-bold'">
                @if (entryAdditionModel().extraNotes) {
                  {{ entryAdditionModel().extraNotes }}
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
export class EntryAdditionModal {
  shoppingListEntryService = inject(ShoppingListEntryService)
  productService = inject(ProductService)
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
    queryKey: [getProductByIdMainQueryKey, this.entryAdditionModel().productId],
    queryFn: () => {
      return this.productService.getProductById(this.entryAdditionModel().productId ?? undefined)
    },
    enabled: !!this.entryAdditionModel().productId && !this.offlineService.isOfflineMode()
  }))

  addShoppingListEntryMutation = injectMutation(() => ({
    mutationFn: () => {
      return this.shoppingListEntryService.addShoppingListEntry(this.entryAdditionModel())
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
  extraOpenCondition = input<boolean>()
  openChooseProductModal = output<void>()

  currentlyEditedField = signal<DirectlyEditableListEntryField | null>(null)

  entryAdditionModel = model.required<AddProductToListFormData>()
  entryAdditionForm = form(this.entryAdditionModel)

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
    rightButtons: [
      {
        text: 'Anuluj',
        customClass: 'bg-red-700',
        click: () => this.open.set(false)
      },
      {
        text: 'Dodaj',
        customClass: 'bg-green2',
        click: () => {
          this.addShoppingListEntryMutation.mutate()
        }
      }
    ]
  }

  constructor() {
    effect(() => {
      if (!this.open()) {
        this.currentlyEditedField.set(null)
      }
    })
  }

  handleClickPencilOnChooseProduct() {
    this.openChooseProductModal.emit()
    this.currentlyEditedField.set(null)
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
}
