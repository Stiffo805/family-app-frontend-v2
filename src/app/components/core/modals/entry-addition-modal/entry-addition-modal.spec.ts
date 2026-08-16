import { ComponentFixture, TestBed } from '@angular/core/testing'

import { EntryAdditionModal } from './entry-addition-modal'

describe('EntryAdditionModal', () => {
  let component: EntryAdditionModal
  let fixture: ComponentFixture<EntryAdditionModal>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntryAdditionModal]
    }).compileComponents()

    fixture = TestBed.createComponent(EntryAdditionModal)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
