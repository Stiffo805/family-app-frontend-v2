import { ComponentFixture, TestBed } from '@angular/core/testing'

import { Changelog } from './changelog'

describe('Changelog', () => {
  let component: Changelog
  let fixture: ComponentFixture<Changelog>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Changelog],
    }).compileComponents()

    fixture = TestBed.createComponent(Changelog)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
