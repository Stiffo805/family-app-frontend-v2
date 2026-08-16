import { ComponentFixture, TestBed } from '@angular/core/testing'

import { TestConnectionView } from './test-connection-view'

describe('TestConnectionView', () => {
  let component: TestConnectionView
  let fixture: ComponentFixture<TestConnectionView>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestConnectionView]
    }).compileComponents()

    fixture = TestBed.createComponent(TestConnectionView)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
