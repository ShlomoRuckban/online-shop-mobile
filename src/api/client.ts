import { apiBaseUrl } from './config'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  /** Extra facts from the server, e.g. why an account is blocked. */
  readonly details?: Record<string, unknown>

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const UNREACHABLE_MESSAGE = "Can't reach the server. Check your connection and try again."

/** True when the API could not be reached at all (no network, wrong address, or a gateway without the API). */
export function isUnreachable(err: unknown): boolean {
  return err instanceof ApiError && err.code === 'UNREACHABLE'
}

// 502/503/504 without our error body come from a proxy or gateway, not from the API
const GATEWAY_STATUSES = new Set([502, 503, 504])

/** How long a request may take before it counts as unreachable. */
export const REQUEST_TIMEOUT_MS = 15_000

export type QueryParams = Record<string, string | number | boolean | undefined | null>

/** Builds a query string, dropping empty values. */
export function toQueryString(params: QueryParams = {}): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

// --- session -----------------------------------------------------------------------------------

type TokenGetter = () => string | null
type UnauthorizedListener = () => void

let getToken: TokenGetter = () => null
const unauthorizedListeners = new Set<UnauthorizedListener>()

/** The session layer (src/auth) tells the client where the current token is. */
export function setTokenGetter(getter: TokenGetter): void {
  getToken = getter
}

/** Called when a request that carried a token answers 401: the session has ended on the server. */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}

// --- requests ----------------------------------------------------------------------------------

export interface RequestOptions {
  params?: QueryParams
  body?: unknown
  headers?: Record<string, string>
  /** Statuses that return their body instead of failing, e.g. 503 from /health when the database is down. */
  okStatuses?: number[]
}

export async function request<T>(method: string, path: string, init: RequestOptions = {}): Promise<T> {
  const token = getToken()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(`${apiBaseUrl()}${path}${toQueryString(init.params)}`, {
      method,
      headers: {
        Accept: 'application/json',
        // the server answers sign-in with a token in the body instead of a cookie
        'X-Client': 'mobile',
        ...(init.body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...init.headers,
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      // the app never uses cookies; the bearer token is the session
      credentials: 'omit',
      signal: controller.signal,
    })
  } catch {
    throw new ApiError(0, 'UNREACHABLE', UNREACHABLE_MESSAGE)
  } finally {
    clearTimeout(timer)
  }
  const body = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok && !init.okStatuses?.includes(res.status)) {
    if (GATEWAY_STATUSES.has(res.status) && !body?.error) {
      throw new ApiError(res.status, 'UNREACHABLE', UNREACHABLE_MESSAGE)
    }
    if (res.status === 401 && token) unauthorizedListeners.forEach((listener) => listener())
    throw new ApiError(
      res.status,
      body?.error?.code ?? 'HTTP_ERROR',
      body?.error?.message ?? `Request failed with status ${res.status}`,
      body?.error?.details,
    )
  }
  return body as T
}

/** headers: extra request headers, e.g. a guest order's token. */
export function apiGet<T>(path: string, params?: QueryParams, headers?: Record<string, string>): Promise<T> {
  return request<T>('GET', path, { params, headers })
}

export function apiSend<T>(method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
  return request<T>(method, path, { body, headers })
}
