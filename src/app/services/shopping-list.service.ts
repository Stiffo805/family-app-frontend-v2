import { HttpClient } from '@angular/common/http'
import { inject, Service } from '@angular/core'
import { CreateShoppingListFormData, ShoppingListRecord } from '@src/app/util/types'
import { lastValueFrom } from 'rxjs'

export type AllShoppingListsResponse = {
  items: ShoppingListRecord[]
}

@Service()
export class ShoppingListService {
  httpClient = inject(HttpClient)

  getAllShoppingLists = () => {
    return lastValueFrom(this.httpClient.get<AllShoppingListsResponse>('/shopping-lists'))
  }

  getShoppingList = (shoppingListId: string) => {
    return lastValueFrom(
      this.httpClient.get<ShoppingListRecord>(`/shopping-lists/${shoppingListId}`)
    )
  }

  createShoppingList = (formData: CreateShoppingListFormData) => {
    return lastValueFrom(this.httpClient.post('/shopping-lists', formData))
  }
}
