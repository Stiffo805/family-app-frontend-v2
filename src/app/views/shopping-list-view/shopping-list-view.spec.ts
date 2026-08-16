import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ShoppingListView } from './shopping-list-view'

describe('ShoppingListView', () => {
  let component: ShoppingListView
  let fixture: ComponentFixture<ShoppingListView>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShoppingListView],
    }).compileComponents()

    fixture = TestBed.createComponent(ShoppingListView)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
