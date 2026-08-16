import { HttpHandlerFn, HttpRequest } from '@angular/common/http'

export const usernameInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const currentBody = (req.body || {}) as Record<string, unknown>

    const newReq = req.clone({
      body: {
        ...currentBody,
        username: localStorage.getItem('username') ?? ''
      }
    })

    return next(newReq)
  }
  
  return next(req)
}
