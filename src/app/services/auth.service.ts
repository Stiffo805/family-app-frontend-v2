import { HttpClient } from '@angular/common/http'
import { inject, Service } from '@angular/core'
import { AuthResponse } from '@src/app/util/types'
import { lastValueFrom } from 'rxjs'

@Service()
export class AuthService {
  httpClient = inject(HttpClient)

  tryLogin = (): Promise<{}> => {
    return lastValueFrom(this.httpClient.post<AuthResponse>('/auth/check-pass', {}))
  }

}
