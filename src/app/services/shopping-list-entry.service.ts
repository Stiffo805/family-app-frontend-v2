import { HttpClient } from '@angular/common/http'
import { inject, Service } from '@angular/core'
import { LOCAL_STORAGE_USERNAME_KEY_NAME } from '@src/app/util/constants'
import {
  AddProductToListFormData,
  CheckShoppingListEntryFormData,
  EditEntryFormData
} from '@src/app/util/types'
import { lastValueFrom } from 'rxjs'

@Service()
export class ShoppingListEntryService {
  httpClient = inject(HttpClient)

  addShoppingListEntry = (formData: AddProductToListFormData) => {
    return lastValueFrom(this.httpClient.post('/shopping-list-entries', formData))
  }

  checkShoppingListEntry = (formData: CheckShoppingListEntryFormData) => {
    return lastValueFrom(this.httpClient.patch('/shopping-list-entries/check', formData))
  }

  editShoppingListEntry = (formData: EditEntryFormData) => {
    return lastValueFrom(this.httpClient.put(`/shopping-list-entries`, formData))
  }

  deleteShoppingListEntry = (entryId: string) => {
    const username = localStorage.getItem(LOCAL_STORAGE_USERNAME_KEY_NAME) ?? ''

    return lastValueFrom(
      this.httpClient.delete(`/shopping-list-entries/${entryId}`, {
        params: {
          username: username
        }
      })
    )
  }
}
