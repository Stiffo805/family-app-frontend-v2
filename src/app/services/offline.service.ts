import { Service, signal } from '@angular/core'

@Service()
export class OfflineService {
  isOfflineMode = signal<boolean>(false)
}
