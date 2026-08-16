import { NgClass } from '@angular/common'
import { Component, input, output } from '@angular/core'
import { NgIcon } from '@ng-icons/core'

@Component({
  selector: 'app-primary-button',
  imports: [NgClass, NgIcon],
  template: `
    <button
      [disabled]="disabled()"
      [ngClass]="[
        customClass() || '',
        'py-2 px-4 rounded-lg flex items-center gap-2',
        disabled() ? 'opacity-50' : 'cursor-pointer'
      ]"
      (click)="onClick.emit($event)"
    >
      {{ text() }}
      @if (iconName()) {
        <ng-icon [name]="iconName()" />
      }
    </button>
  `,
  styleUrl: './primary-button.css'
})
export class PrimaryButton {
  readonly customClass = input<string>()
  text = input.required<string>()
  iconName = input<string>()
  disabled = input<boolean>()
  readonly onClick = output<MouseEvent>()
}
