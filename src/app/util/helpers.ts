import { LOCAL_STORAGE_SHOPPING_LISTS_KEY_NAME } from '@src/app/util/constants'
import {
  ChangelogEntry,
  ChangelogEntryRecord,
  ShoppingList,
  ShoppingListEntry,
  ShoppingListEntryRecord,
  ShoppingListRecord
} from '@src/app/util/types'

export const capitalize = (word: string) => {
  if (word.length >= 2) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  else return ''
}

export const formatDatetime = (date: Date | undefined): string => {
  return date?.toLocaleString().slice(0, date?.toLocaleString().length - 3) ?? ''
}

export const mapShoppingListRecordToShoppingList = (
  shoppingListRecord: ShoppingListRecord | undefined
): ShoppingList | undefined => {
  if (!shoppingListRecord) return undefined
  return {
    id: shoppingListRecord.id,
    title: shoppingListRecord.title,
    lastUpdatedAt: new Date(shoppingListRecord.lastUpdatedAt),
    items: shoppingListRecord.items
  }
}

export const mapShoppingListEntryRecordToShoppingListEntry = (
  shoppingListEntryRecord: ShoppingListEntryRecord
): ShoppingListEntry => {
  return {
    id: shoppingListEntryRecord.id,
    product: shoppingListEntryRecord.product,
    quantity: shoppingListEntryRecord.quantity,
    unit: shoppingListEntryRecord.unit,
    extraNotes: shoppingListEntryRecord.extraNotes,
    isChecked: shoppingListEntryRecord.isChecked,
    lastUpdatedAt: new Date(shoppingListEntryRecord.lastUpdatedAt)
  }
}

export const mapChangelogEntryRecordToChangelogEntry = (changelogEntryRecord: ChangelogEntryRecord): ChangelogEntry => {
  return {
    id: changelogEntryRecord.id,
    shoppingList: changelogEntryRecord.shoppingList,
    product: changelogEntryRecord.product,
    changeTitle: changelogEntryRecord.changeTitle,
    author: changelogEntryRecord.author,
    createdAt: new Date(changelogEntryRecord.createdAt)
  }
}

export const getLocalShoppingLists = (): ShoppingListRecord[] => {
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_SHOPPING_LISTS_KEY_NAME) ?? '[]') as ShoppingListRecord[]
}

