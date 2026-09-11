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

  fillMissingEntriesPositions = async () => {
    const allShoppingLists = await this.getAllShoppingLists(this.offlineService.isOfflineMode())
    // 1. Fallback do pustej tablicy gwarantuje, że nie będziemy operować na undefined
    const allEntriesPositions = (await this.getAllEntriesPositions()) ?? []

    // 2. Tworzymy słownik O(1) obecnych pozycji: Map<shoppingListId, idsInOrder>
    const positionsMap = new Map<string, string[]>()
    allEntriesPositions.forEach((pos) => positionsMap.set(pos.shoppingListId, pos.idsInOrder))

    // 3. Budujemy nową, czystą tablicę na podstawie aktualnych list zakupów
    const newEntriesPositions = allShoppingLists.items.map((shoppingList) => {
      // Pobieramy stare ID dla tej listy (lub pustą tablicę, jeśli lista jest nowa)
      const existingIds = positionsMap.get(shoppingList.id) ?? []

      // Set pozwala błyskawicznie sprawdzić (O(1)), czy ID już tam jest
      const existingIdsSet = new Set(existingIds)

      // Znajdujemy tylko te produkty, których jeszcze nie ma w zapisanych pozycjach
      const missingIds = shoppingList.items
        .map((entry) => entry.id)
        .filter((id) => !existingIdsSet.has(id))

      return {
        shoppingListId: shoppingList.id,
        // Łączymy stare pozycje z nowymi (nowe spadają na sam dół)
        idsInOrder: [...existingIds, ...missingIds]
      }
    })

    localStorage.setItem(LOCAL_STORAGE_ENTRIES_POSITIONS_KEY, JSON.stringify(newEntriesPositions))
  }

  moveEntryPositions = async (
    shoppingListId: string | undefined,
    currentIndex: number,
    previousIndex: number
  ) => {
    const entriesPositions = await this.getAllEntriesPositions()

    const newEntriesPositions = entriesPositions?.map((item) => {
      if (item.shoppingListId !== shoppingListId) {
        return item
      } else {
        let currentIdsInOrder = [...item.idsInOrder]

        const [movedElement] = currentIdsInOrder.splice(previousIndex, 1)

        currentIdsInOrder.splice(currentIndex, 0, movedElement)

        return {
          ...item,
          idsInOrder: currentIdsInOrder
        }
      }
    })

    localStorage.setItem(LOCAL_STORAGE_ENTRIES_POSITIONS_KEY, JSON.stringify(newEntriesPositions))
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

  getAllEntriesPositions = async () => {
    try {
      const entriesPositionsData = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_ENTRIES_POSITIONS_KEY) ?? '[]'
      ) as EntriesPositions[]
      return entriesPositionsData
    } catch (err) {
      return undefined
    }
  }

  getEntriesPositions = async (shoppingListId: string | undefined) => {
    if (shoppingListId) {
      const entriesPositionsData = await this.getAllEntriesPositions()
      return entriesPositionsData?.find((item) => item.shoppingListId === shoppingListId)
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
