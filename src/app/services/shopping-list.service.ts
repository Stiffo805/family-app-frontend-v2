import { HttpClient } from '@angular/common/http'
import { inject, Service } from '@angular/core'
import { OfflineService } from '@src/app/services/offline.service'
import { LOCAL_STORAGE_ENTRIES_POSITIONS_KEY } from '@src/app/util/constants'
import { getLocalShoppingLists } from '@src/app/util/helpers'
import {
  CreateShoppingListFormData,
  EntriesPositions,
  ShoppingListRecord
} from '@src/app/util/types'
import { lastValueFrom } from 'rxjs'

export type AllShoppingListsResponse = {
  items: ShoppingListRecord[]
}

@Service()
export class ShoppingListService {
  httpClient = inject(HttpClient)
  offlineService = inject(OfflineService)

  getAllShoppingLists = async (isOfflineMode: boolean) => {
    if (isOfflineMode) {
      return { items: getLocalShoppingLists() } as AllShoppingListsResponse
    }
    return lastValueFrom(this.httpClient.get<AllShoppingListsResponse>('/shopping-lists'))
  }

  getShoppingList = async (shoppingListId: string, isOfflineMode: boolean) => {
    if (isOfflineMode) {
      return getLocalShoppingLists().find((item) => item.id === shoppingListId)
    }
    return lastValueFrom(
      this.httpClient.get<ShoppingListRecord>(`/shopping-lists/${shoppingListId}`)
    )
  }

  createShoppingList = (formData: CreateShoppingListFormData) => {
    return lastValueFrom(this.httpClient.post('/shopping-lists', formData))
  }

  getEntriesPositions = (shoppingListId: string | undefined) => {
    if (shoppingListId) {
      try {
        const entriesPositionsData = JSON.parse(
          localStorage.getItem(LOCAL_STORAGE_ENTRIES_POSITIONS_KEY) ?? '[]'
        ) as EntriesPositions[]
        return entriesPositionsData.find((item) => item.shoppingListId === shoppingListId)
      } catch (err) {
        return undefined
      }
    }
    return undefined
  }

  moveEntryToTopPosition = async (shoppingListId: string | undefined, entryId: string) => {
    if (shoppingListId) {
      try {
        const entriesPositionsData = JSON.parse(
          localStorage.getItem(LOCAL_STORAGE_ENTRIES_POSITIONS_KEY) ?? '[]'
        ) as EntriesPositions[]

        let newPositionsData: EntriesPositions[]

        if (entriesPositionsData.map((item) => item.shoppingListId).includes(shoppingListId)) {
          newPositionsData = entriesPositionsData.map((item) => {
            if (item.shoppingListId !== shoppingListId) return item
            else {
              return {
                ...item,
                idsInOrder: [entryId, ...item.idsInOrder.filter((id) => id !== entryId)]
              }
            }
          })
        } else {
          newPositionsData = [
            ...entriesPositionsData,
            {
              shoppingListId,
              idsInOrder: [entryId]
            }
          ]
        }
        if (!this.offlineService.isOfflineMode()) {
          const shoppingListOnline = await this.getShoppingList(shoppingListId, true)
          const shoppingListOffline = await this.getShoppingList(shoppingListId, false)

          if (shoppingListOnline && shoppingListOffline) {
            newPositionsData = newPositionsData.map((item) => {
              if (item.shoppingListId !== shoppingListId) return item
              else {
                return {
                  ...item,
                  idsInOrder: item.idsInOrder.filter(
                    (id) =>
                      shoppingListOnline.items.map((it) => it.id).includes(id) ||
                      shoppingListOffline.items.map((it) => it.id).includes(id)
                  )
                }
              }
            })
          }
        }
        localStorage.setItem(LOCAL_STORAGE_ENTRIES_POSITIONS_KEY, JSON.stringify(newPositionsData))
      } catch (err) {
        return false
      }
    }
    return false
  }
}
