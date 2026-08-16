import { AddProductToListFormData, EditEntryFormData } from '@src/app/util/types'

export const defaultAddProductToListFormData: AddProductToListFormData = {
  productId: null,
  quantity: 0,
  unit: '',
  extraNotes: '',
  shoppingListId: null
}
