import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './client'

/** One client for the app: no retries on answers the server meant (4xx), a few on network trouble. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && failureCount < 2,
      },
    },
  })
}
