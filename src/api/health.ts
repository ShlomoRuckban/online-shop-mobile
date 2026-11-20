import { useQuery } from '@tanstack/react-query'
import { request } from './client'

export interface Health {
  status: 'ok' | 'degraded'
  db: 'up' | 'down'
}

/** 503 is still an answer from the API: it is running but its database is down. */
export function getHealth(): Promise<Health> {
  return request<Health>('GET', '/health', { okStatuses: [503] })
}

export function useHealth() {
  return useQuery({ queryKey: ['health'], queryFn: getHealth, retry: false })
}
