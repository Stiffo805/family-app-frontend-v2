import { HttpClient } from '@angular/common/http'
import { inject, Service } from '@angular/core'
import { lastValueFrom } from 'rxjs'

export type AllUnitsResponse = {
  items: string[]
}

@Service()
export class UnitsService {
  httpClient = inject(HttpClient)

  getAllUnits = () => {
    return lastValueFrom(this.httpClient.get<AllUnitsResponse>('/units'))
  }
}
