import { NgClass } from '@angular/common'
import { Component, computed, inject, input, model, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NgIcon } from '@ng-icons/core'
import { Modal } from '@src/app/components/core/modal/modal'
import { OfflineService } from '@src/app/services/offline.service'
import { ProductService } from '@src/app/services/product.service'
import { getProductByIdMainQueryKey, getProductsMainQueryKey } from '@src/app/util/constants'
import { capitalize } from '@src/app/util/helpers'
import {
  AddProductToListFormData,
  ShoppingListRecord,
  Product,
  ShoppingList
} from '@src/app/util/types'
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental'

@Component({
  selector: 'app-product-choice-modal',
  imports: [Modal, NgIcon, NgClass, FormsModule],
  template: `
    <app-modal [title]="'Wybieranie produktu'" [(open)]="open">
      <div [className]="'flex items-center'">
        <div [className]="'pr-2 pl-4 rounded-tl-lg bg-white h-12 flex items-center'">
          <ng-icon name="bootstrapSearch" size="14" />
        </div>
        <input
          [(ngModel)]="searchText"
          [className]="'bg-white rounded-tr-lg text-xl h-12 w-full pb-1 focus:outline-none focus:ring-0 focus:border-inherit'"
          placeholder="szukaj produktu lub dodaj nowy"
        />
      </div>
      <div [className]="'overflow-y-auto max-h-[calc(100vh-180px)]'">
        @if (isTypedProductValidAndNew()) {
          <div
            [className]="'px-2 py-4 border-y flex justify-between bg-white'"
            (click)="createNewProductMutation.mutate()"
          >
            <p [className]="'font-bold'">{{ capitalizeHelper(searchText()) }}</p>
            <p>
              <i> Dodaj </i>
            </p>
          </div>
        }

        @for (product of availableProductsFilteredAndSorted(); track product.id) {
          <div
            [ngClass]="{
              'px-2 py-4 border-y flex justify-between': true,
              'bg-white': !isProductOnList(product),
              'opacity-50': isProductOnList(product)
            }"
            (click)="handleProductTileClick(product)"
          >
            <p [className]="'font-bold'">{{ product.name }}</p>
            <p>
              <i>
                @if (isProductOnList(product)) {
                  Już na liście!
                } @else {
                  Dodaj
                }
              </i>
            </p>
          </div>
        }
      </div>
    </app-modal>
  `,
  styleUrl: './product-choice-modal.css'
})
export class ProductChoiceModal {
  productService = inject(ProductService)
  offlineService = inject(OfflineService)
  queryClient = inject(QueryClient)

  getProductsQuery = injectQuery(() => ({
    queryKey: [getProductsMainQueryKey],
    queryFn: () => {
      return this.productService.getAllProducts()
    },
    enabled: () => !this.offlineService.isOfflineMode()
  }))

  createNewProductMutation = injectMutation(() => ({
    mutationFn: () => {
      return this.productService.createNewProduct({
        name: this.searchText()
      })
    },
    onSuccess: (data) => {
      this.queryClient.invalidateQueries({
        queryKey: [getProductsMainQueryKey]
      })
      this.productAdditionModel.update((cur) => ({
        ...cur,
        productId: data.item.id
      }))
      this.open.set(false)
    }
  }))

  open = model.required<boolean>()
  shoppingListData = input<ShoppingList>()
  productAdditionModel = model.required<AddProductToListFormData>()

  searchText = signal<string>('')

  availableProducts = computed(() => this.getProductsQuery.data()?.items ?? [])

  availableProductsFilteredAndSorted = computed(() =>
    this.availableProducts()
      .filter((item) => item.name.toLowerCase().startsWith(this.searchText().toLowerCase()))
      .sort((product1, product2) => {
        if (this.isProductOnList(product1) && this.isProductOnList(product2)) {
          return product1.name.localeCompare(product2.name)
        }
        if (this.isProductOnList(product1)) return 1
        if (this.isProductOnList(product2)) return -1
        return product1.name.localeCompare(product2.name)
      })
  )

  isProductOnList(product: Product) {
    return this.shoppingListData()?.items.some((item) => item.product.id === product.id)
  }

  isTypedProductValidAndNew() {
    return (
      this.searchText().length >= 2 &&
      !this.availableProducts().some(
        (product) => product.name.toUpperCase() === this.searchText().toUpperCase()
      )
    )
  }

  saveProductIdToForm(productId: string) {
    this.productAdditionModel.update((cur) => ({
      ...cur,
      productId
    }))
  }

  handleProductTileClick(product: Product) {
    if (!this.isProductOnList(product)) {
      this.saveProductIdToForm(product.id)
      this.open.set(false)
    }
  }

  capitalizeHelper = capitalize
}
