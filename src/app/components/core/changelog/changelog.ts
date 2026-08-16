import { Component, inject, input } from '@angular/core'
import { NgIcon } from '@ng-icons/core'
import { LayoutService } from '@src/app/services/layout.service'
import { formatDatetime } from '@src/app/util/helpers'
import { ChangelogEntry, ChangelogEntryRecord } from '@src/app/util/types'

@Component({
  selector: 'app-changelog',
  imports: [NgIcon],
  template: `
    @if (this.layoutService.isMobile()) {
      <div [className]="'flex flex-col items-center gap-6'">
        @for (entry of data(); track entry.id) {
          <div [className]="'bg-blue3 w-6/7 px-6 py-4 rounded-lg text-lg flex flex-col gap-1'">
            <p>
              Lista zakupów:
              <strong [className]="'text-blue1'">{{ entry.shoppingList.title }}</strong>
            </p>
            <p>
              Produkt:
              <strong [className]="'text-green1 font-bold'">{{
                entry.product?.name ?? 'Nie dotyczy'
              }}</strong>
            </p>
            <p>
              Zmiana: <strong>{{ entry.changeTitle }}</strong>
            </p>
            <p>
              Data wydarzenia:
              <strong [className]="'text-purple1'">{{
                formatDatetimeHelper(entry.createdAt)
              }}</strong>
            </p>
            <p>
              Użytkownik:
              <strong>
                @if (entry.author && entry.author !== '') {
                  {{ entry.author }}
                } @else {
                  -
                }
              </strong>
            </p>
          </div>
        } @empty {
          <p [className]="'text-center text-lg py-4'">
            Nie wykonano jeszcze akcji, które można by tu wyświetlić.
          </p>
        }
      </div>
    } @else {
      @if (data()?.length) {
        <table [className]="'w-full text-xl'">
          <thead>
            <tr>
              <th [className]="'py-2'">Lista zakupów</th>
              <th [className]="'py-2'">Produkt</th>
              <th [className]="'py-2'">Zmiana</th>
              <th [className]="'py-2'">Data wydarzenia</th>
              <th [className]="'py-2'">Użytkownik</th>
            </tr>
          </thead>
          <tbody>
            @for (entry of data(); track entry.shoppingList.id) {
              <tr [className]="'border-y'">
                <td [className]="'text-center py-2 text-blue1'">{{ entry.shoppingList.title }}</td>
                <td [className]="'text-center py-2 text-green1 font-semibold'">
                  {{ entry.product?.name ?? 'Nie dotyczy' }}
                </td>
                <td [className]="'text-center py-2'">{{ entry.changeTitle }}</td>
                <td [className]="'text-center py-2 text-purple1'">
                  {{ formatDatetimeHelper(entry.createdAt) }}
                </td>
                <td [className]="'text-center py-2'">
                  @if (entry.author && entry.author !== '') {
                    {{ entry.author }}
                  } @else {
                    -
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <p [className]="'text-center text-lg py-4'">
          Nie wykonano jeszcze akcji, które można by tu wyświetlić.
        </p>
      }
    }
  `,
  styleUrl: './changelog.css'
})
export class Changelog {
  protected layoutService = inject(LayoutService)

  data = input<ChangelogEntry[]>()

  formatDatetimeHelper = formatDatetime
}
