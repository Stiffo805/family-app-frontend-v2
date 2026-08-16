export type AuthResponse = {
  auth?: boolean
}

export type CustomUnit = 'szt.' | 'opakowania' | 'kg' | 'g' | 'l' | 'ml' | ''

export type ChangelogEntryRecord = {
  id: string
  shoppingList: ShoppingListRecord
  product?: Product
  changeTitle: string
  createdAt: string
  author?: string
}

export type ChangelogEntry = {
  id: string
  shoppingList: ShoppingListRecord
  product?: Product
  changeTitle: string
  createdAt: Date
  author?: string
}

export type ShoppingList = {
  id: string
  title: string
  lastUpdatedAt: Date
  items: ShoppingListEntryRecord[]
}

export type ShoppingListRecord = {
  id: string
  title: string
  lastUpdatedAt: string
  items: ShoppingListEntryRecord[]
}

export type Product = {
  id: string
  name: string
}

export type ShoppingListEntryRecord = {
  id: string
  product: Product
  quantity: number
  unit: CustomUnit
  extraNotes: string
  lastUpdatedAt: string
  isChecked: boolean
}

export type ShoppingListEntry = {
  id: string
  product: Product
  quantity: number
  unit: CustomUnit
  extraNotes: string
  lastUpdatedAt: Date
  isChecked: boolean
}

export type ButtonConfig = {
  text: string
  iconName?: string
  customClass?: string
  click?: () => any
  disabled?: boolean
}

export type FooterConfig = {
  leftButtons?: ButtonConfig[]
  rightButtons?: ButtonConfig[]
}

export type DirectlyEditableListEntryField = Extract<
  keyof ShoppingListEntryRecord,
  'quantity' | 'unit' | 'extraNotes'
>

export type AddProductToListFormData = {
  shoppingListId: string | null
  productId: string | null
  quantity: number
  unit: CustomUnit | ''
  extraNotes: string
}

export type EditEntryFormData = {
  entryId: string | null
  productId: string | null
  quantity: number
  unit: CustomUnit | ''
  extraNotes: string
}

export type CreateShoppingListFormData = {
  title: string
}

export type CreateNewProductFormData = {
  name: string
}

export type CheckShoppingListEntryFormData = {
  entryId: string
  checked: boolean
}
