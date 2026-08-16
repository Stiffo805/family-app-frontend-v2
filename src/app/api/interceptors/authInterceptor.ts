import { HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { LOCAL_STORAGE_PASSWORD_KEY_NAME } from "@src/app/util/constants";

export const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const pass = localStorage.getItem(LOCAL_STORAGE_PASSWORD_KEY_NAME)

  const newReq = req.clone({
    headers: req.headers.append('Authorization', `FamilyPassword: ${pass}`)
  })

  return next(newReq)
}