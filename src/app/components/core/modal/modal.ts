import { Component, input, model } from '@angular/core'
import { FooterConfig } from '@src/app/util/types'
import { PrimaryButton } from '@src/app/components/common/primary-button/primary-button'
import { NgIcon } from '@ng-icons/core'

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    @if (open() && extraOpenCondition() !== false) {
      <div
        [className]="'fixed top-4 bg-blue2 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg'"
        [style.width]="width()"
      >
        <header [className]="'text-xl font-bold flex justify-between items-center'">
          <p>{{ title() }}</p>
          <ng-icon name="bootstrapXLg" [className]="'cursor-pointer'" (click)="open.set(false)" />
        </header>
        <main [className]="'pt-4'"><ng-content></ng-content></main>
        <footer [className]="'flex justify-between pt-4'">
          <div [className]="'flex gap-4'">
            @for (buttonConfig of footer()?.leftButtons; track $index) {
              <app-primary-button
                [text]="buttonConfig.text"
                [iconName]="buttonConfig.iconName"
                (click)="buttonConfig?.click()"
                [customClass]="buttonConfig.customClass"
                [disabled]="buttonConfig.disabled"
              />
            }
          </div>
          <div [className]="'flex gap-4'">
            @for (buttonConfig of footer()?.rightButtons; track $index) {
              <app-primary-button
                [text]="buttonConfig.text"
                [iconName]="buttonConfig.iconName"
                (click)="buttonConfig?.click()"
                [customClass]="buttonConfig.customClass"
                [disabled]="buttonConfig.disabled"
              />
            }
          </div>
        </footer>
      </div>
      <div
        [className]="'z-10 fixed top-0 left-0 w-full h-screen bg-gray-100 opacity-75'"
        (click)="open.set(false)"
      ></div>
    }
  `,
  styleUrl: './modal.css',
  imports: [PrimaryButton, NgIcon]
})
export class Modal {
  open = model.required<boolean>()
  extraOpenCondition = input<boolean>()
  width = input<number | string>('min(90vw,480px)')
  title = input.required<string>()
  footer = input<FooterConfig>()
}
