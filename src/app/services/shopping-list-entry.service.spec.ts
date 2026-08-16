import { TestBed } from '@angular/core/testing'

import { ShoppingListEntryService } from './shopping-list-entry.service'

describe('ShoppingListEntryService', () => {
  let service: ShoppingListEntryService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(ShoppingListEntryService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
