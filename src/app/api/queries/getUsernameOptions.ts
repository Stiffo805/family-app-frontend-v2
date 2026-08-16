import { getUsernameQueryKey, LOCAL_STORAGE_USERNAME_KEY_NAME } from '@src/app/util/constants'
import { queryOptions } from '@tanstack/angular-query-experimental'

export const getUsernameOptions = queryOptions({
  queryKey: [getUsernameQueryKey],
  queryFn: () => {
    return localStorage.getItem(LOCAL_STORAGE_USERNAME_KEY_NAME) ?? ''
  }
})
