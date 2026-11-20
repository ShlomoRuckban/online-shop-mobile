import { installFakeFetch, type FakeFetch } from '../../../tests/helpers/fetch'
import { ApiError, REQUEST_TIMEOUT_MS, apiGet, apiSend, isUnreachable, onUnauthorized, request, setTokenGetter, toQueryString } from '../client'
import { apiBaseUrl } from '../config'
import { getHealth } from '../health'

let fetchMock: FakeFetch

beforeEach(() => {
  fetchMock = installFakeFetch()
  setTokenGetter(() => null)
  process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.20:4000/api/'
})

afterEach(() => {
  delete process.env.EXPO_PUBLIC_API_URL
  jest.useRealTimers()
})

describe('base URL', () => {
  it('uses EXPO_PUBLIC_API_URL without a trailing slash', () => {
    expect(apiBaseUrl()).toBe('http://192.168.1.20:4000/api')
  })

  it('falls back to a local address when the variable is not set', () => {
    delete process.env.EXPO_PUBLIC_API_URL
    expect(apiBaseUrl()).toMatch(/^http:\/\/(10\.0\.2\.2|localhost):4000\/api$/)
  })

  it('builds the request URL from the base, path and query', async () => {
    fetchMock.answer({ body: { items: [] } })
    await apiGet('/items', { search: 'lamp', page: 2, category: '', inStock: undefined })
    expect(fetchMock.lastRequest().url).toBe('http://192.168.1.20:4000/api/items?search=lamp&page=2')
  })
})

describe('toQueryString', () => {
  it('drops empty values and returns nothing for no params', () => {
    expect(toQueryString({ a: '', b: null, c: undefined })).toBe('')
    expect(toQueryString({ inStock: true, minPrice: 0 })).toBe('?inStock=true&minPrice=0')
  })
})

describe('requests', () => {
  it('sends JSON with the mobile client header and no cookies', async () => {
    fetchMock.answer({ status: 201, body: { id: '1' } })
    const result = await apiSend<{ id: string }>('POST', '/orders', { lines: [] })
    const { init } = fetchMock.lastRequest()
    expect(result).toEqual({ id: '1' })
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"lines":[]}')
    expect(init.credentials).toBe('omit')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.headers['X-Client']).toBe('mobile')
    expect(init.headers.Authorization).toBeUndefined()
  })

  it('adds the bearer token when signed in, and extra headers', async () => {
    setTokenGetter(() => 'abc.def.ghi')
    fetchMock.answer({ body: {} })
    await apiGet('/orders/1', undefined, { 'X-Guest-Token': 'g1' })
    const { init } = fetchMock.lastRequest()
    expect(init.headers.Authorization).toBe('Bearer abc.def.ghi')
    expect(init.headers['X-Guest-Token']).toBe('g1')
    expect(init.headers['Content-Type']).toBeUndefined()
  })

  it('returns null for 204', async () => {
    fetchMock.answer({ status: 204 })
    await expect(apiSend('DELETE', '/wishlist/1')).resolves.toBeNull()
  })
})

describe('errors', () => {
  it('turns the server error body into an ApiError with code and details', async () => {
    fetchMock.answer({ status: 403, body: { error: { code: 'ACCOUNT_BLOCKED', message: 'This account is blocked', details: { reason: 'spam' } } } })
    const err = await apiGet('/auth/me').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ status: 403, code: 'ACCOUNT_BLOCKED', message: 'This account is blocked', details: { reason: 'spam' } })
    expect(isUnreachable(err)).toBe(false)
  })

  it('uses HTTP_ERROR when the body is not ours', async () => {
    fetchMock.answer({ status: 500 })
    await expect(apiGet('/items')).rejects.toMatchObject({ status: 500, code: 'HTTP_ERROR' })
  })

  it('counts a network failure as unreachable', async () => {
    fetchMock.answer({ fail: true })
    const err = await apiGet('/items').catch((e: unknown) => e)
    expect(isUnreachable(err)).toBe(true)
  })

  it('counts a gateway error without our body as unreachable, but not one with it', async () => {
    fetchMock.answer({ status: 502 }, { status: 503, body: { error: { code: 'MAINTENANCE', message: 'Back soon' } } })
    expect(isUnreachable(await apiGet('/items').catch((e: unknown) => e))).toBe(true)
    await expect(apiGet('/items')).rejects.toMatchObject({ code: 'MAINTENANCE' })
  })

  it('aborts a request that takes too long and reports it as unreachable', async () => {
    jest.useFakeTimers()
    fetchMock.mockImplementationOnce((_url: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('Aborted')))
      }),
    )
    const pending = apiGet('/items').catch((e: unknown) => e)
    jest.advanceTimersByTime(REQUEST_TIMEOUT_MS)
    expect(isUnreachable(await pending)).toBe(true)
  })
})

describe('401 handling', () => {
  it('tells the session layer when a request with a token answers 401', async () => {
    const listener = jest.fn()
    const stop = onUnauthorized(listener)
    setTokenGetter(() => 'old-token')
    fetchMock.answer({ status: 401, body: { error: { code: 'UNAUTHENTICATED', message: 'Please log in' } } })
    await expect(apiGet('/auth/me')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
    expect(listener).toHaveBeenCalledTimes(1)
    stop()
  })

  it('stays quiet for a 401 without a token (wrong password while signed out)', async () => {
    const listener = jest.fn()
    const stop = onUnauthorized(listener)
    fetchMock.answer({ status: 401, body: { error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' } } })
    await expect(apiSend('POST', '/auth/login', {})).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
    expect(listener).not.toHaveBeenCalled()
    stop()
  })
})

describe('health', () => {
  it('reads 503 from /health as a degraded server, not as unreachable', async () => {
    fetchMock.answer({ status: 503, body: { status: 'degraded', db: 'down' } })
    await expect(getHealth()).resolves.toEqual({ status: 'degraded', db: 'down' })
  })

  it('reads the ok answer', async () => {
    fetchMock.answer({ body: { status: 'ok', db: 'up' } })
    await expect(getHealth()).resolves.toEqual({ status: 'ok', db: 'up' })
    expect(fetchMock.lastRequest().url).toBe('http://192.168.1.20:4000/api/health')
  })

  it('passes other statuses through request() options untouched', async () => {
    fetchMock.answer({ status: 404, body: { error: { code: 'NOT_FOUND', message: 'Not found' } } })
    await expect(request('GET', '/health', { okStatuses: [503] })).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})
