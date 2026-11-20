// Runs only through scripts/check-health.mjs, which starts the real API in test mode.
// The app's API client and token store against the server's mobile session (server leaf 2.1).
import { apiGet, apiSend } from '../../src/api/client'
import { clearToken, saveToken } from '../../src/auth/tokenStore'
import { nodeFetch } from '../helpers/nodeFetch'

const live = process.env.LIVE_API === '1'
const maybe = live ? describe : describe.skip

interface SessionUser {
  id: string
  email: string
  token?: string
}

maybe('mobile session against the real server', () => {
  beforeAll(() => {
    globalThis.fetch = nodeFetch
  })
  afterEach(async () => {
    await clearToken()
  })

  const email = `phone-${Date.now()}@example.com`
  const password = 'secret123'

  it('register returns a token that signs the app in, and logout ends it', async () => {
    const user = await apiSend<SessionUser>('POST', '/auth/register', { name: 'Phone', email, password, acceptTerms: true })
    expect(user.email).toBe(email)
    expect(typeof user.token).toBe('string')

    await saveToken(user.token!)
    await expect(apiGet<SessionUser | null>('/auth/me')).resolves.toMatchObject({ email })

    await apiSend('POST', '/auth/logout')
    await expect(apiGet<SessionUser | null>('/auth/me')).resolves.toBeNull()
  })

  it('login returns a fresh token; a wrong password is a translated-code error', async () => {
    const user = await apiSend<SessionUser>('POST', '/auth/login', { email, password })
    expect(typeof user.token).toBe('string')
    await saveToken(user.token!)
    await expect(apiGet<SessionUser | null>('/auth/me')).resolves.toMatchObject({ email })
    await clearToken()
    await expect(apiSend('POST', '/auth/login', { email, password: 'wrong-pass1' })).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' })
  })
})
