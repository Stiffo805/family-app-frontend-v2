import { HttpHandlerFn, HttpRequest } from '@angular/common/http'
import { environment } from '@src/environments/environment.development'

export const baseUrlInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {

  const newReq = req.clone({
    url: `${environment.apiUrl}${req.url}`
  })

  return next(newReq)
}
