import { HttpClient } from '@angular/common/http'
import { inject, Service } from '@angular/core'
import { ChangelogEntryRecord } from '@src/app/util/types'
import { lastValueFrom } from 'rxjs'

export type GetChangelogEntriesResponse = {
  items: ChangelogEntryRecord[]
}

@Service()
export class ChangelogService {
  httpClient = inject(HttpClient)

  getLatestEntries = (limit: number) => {
    return lastValueFrom(
      this.httpClient.get<GetChangelogEntriesResponse>(`/changelog/latest/limit/${limit}`)
    )
  }
}
