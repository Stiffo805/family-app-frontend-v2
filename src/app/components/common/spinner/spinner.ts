import { Component } from '@angular/core'
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-spinner',
  imports: [NgIcon],
  template: ` <ng-icon name="primeSpinner" size="32" [className]="'animate-spin absolute top-1/2 left-1/2 -translate-1/2'" /> `,
  styleUrl: './spinner.css'
})
export class Spinner {}
