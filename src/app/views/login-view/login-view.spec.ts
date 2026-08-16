import { ComponentFixture, TestBed } from '@angular/core/testing'

import { LoginView } from './login-view'

describe('LoginView', () => {
  let component: LoginView
  let fixture: ComponentFixture<LoginView>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginView]
    }).compileComponents()

    fixture = TestBed.createComponent(LoginView)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
