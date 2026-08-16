import { BreakpointObserver } from '@angular/cdk/layout';
import { inject, Service } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Service()
export class LayoutService {

  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly isMobile = toSignal(
    this.breakpointObserver
      .observe('(max-width: 1000px)')
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );
}
