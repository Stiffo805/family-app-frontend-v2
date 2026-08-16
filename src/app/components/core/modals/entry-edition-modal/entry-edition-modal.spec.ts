import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ProductEditionModal } from './entry-edition-modal'

describe('ProductEditionModal', () => {
  let component: ProductEditionModal
  let fixture: ComponentFixture<ProductEditionModal>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductEditionModal]
    }).compileComponents()

    fixture = TestBed.createComponent(ProductEditionModal)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
