import { Routes } from '@angular/router'
import { MainLayout } from '@src/app/layouts/main-layout/main-layout'
import { DashboardView } from '@src/app/views/dashboard-view/dashboard-view'
import { LoginView } from '@src/app/views/login-view/login-view'
import { ShoppingListView } from '@src/app/views/shopping-list-view/shopping-list-view'

export const routes: Routes = [
  {
    path: 'login',
    component: LoginView
  },
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: 'shopping-list/:id',
        component: ShoppingListView
      },
      {
        path: '',
        component: DashboardView
      }
    ]
  }
]
