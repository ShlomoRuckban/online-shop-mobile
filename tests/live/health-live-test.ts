// Runs only through scripts/check-health.mjs, which starts the real API in test mode.
import { apiGet } from '../../src/api/client'
import { getHealth } from '../../src/api/health'
import { nodeFetch } from '../helpers/nodeFetch'

const live = process.env.LIVE_API === '1'
const maybe = live ? describe : describe.skip

maybe('the app API client against the real server', () => {
  beforeAll(() => {
    globalThis.fetch = nodeFetch
  })

  it('reads the health of the running server', async () => {
    await expect(getHealth()).resolves.toEqual({ status: 'ok', db: 'up' })
  })

  it('reads the seeded catalog and maps a real 404 to an ApiError', async () => {
    const list = await apiGet<{ items: unknown[]; total: number }>('/items', { pageSize: 5 })
    expect(list.items.length).toBeGreaterThan(0)
    expect(list.total).toBeGreaterThanOrEqual(list.items.length)
    await expect(apiGet('/items/000000000000000000000000')).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })
})
