import { HttpClient } from '@angular/common/http'
import { inject, Service } from '@angular/core'
import { lastValueFrom } from 'rxjs'

@Service()
export class HealthService {
  httpClient = inject(HttpClient)

  health = () => {
    return lastValueFrom(this.httpClient.get('/health'))
  }
}
