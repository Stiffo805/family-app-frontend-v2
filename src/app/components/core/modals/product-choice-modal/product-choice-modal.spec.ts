import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ProductChoiceModal } from './product-choice-modal'

describe('ProductChoiceModal', () => {
  let component: ProductChoiceModal
  let fixture: ComponentFixture<ProductChoiceModal>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductChoiceModal]
    }).compileComponents()

    fixture = TestBed.createComponent(ProductChoiceModal)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
