import { Component, signal } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { TopBar } from './components/navigation/top-bar/top-bar'
import { provideIcons } from '@ng-icons/core'
import {
  bootstrapArrowDown,
  bootstrapArrowDownCircle,
  bootstrapArrowUpCircle,
  bootstrapPencil,
  bootstrapPlusLg,
  bootstrapSave,
  bootstrapSearch,
  bootstrapXLg,
  bootstrapGlobe,
  bootstrapFileMinus
} from '@ng-icons/bootstrap-icons'
import { heroHome, heroMinus } from '@ng-icons/heroicons/outline'
import { ionLogOutOutline } from '@ng-icons/ionicons'
import { TestConnectionView } from './views/test-connection-view/test-connection-view'
import { primeSpinner } from '@ng-icons/primeicons'

@Component({
  selector: 'app-root',
  imports: [TestConnectionView],
  template: ` <app-test-connection-view /> `,
  styleUrl: './app.css',
  viewProviders: [
    provideIcons({
      bootstrapArrowDownCircle,
      bootstrapArrowUpCircle,
      bootstrapSearch,
      bootstrapSave,
      heroHome,
      ionLogOutOutline,
      bootstrapPlusLg,
      bootstrapFileMinus,
      bootstrapPencil,
      heroMinus,
      bootstrapArrowDown,
      bootstrapXLg,
      primeSpinner,
      bootstrapGlobe
    })
  ]
})
export class App {
  protected readonly title = signal('family-app')
}
