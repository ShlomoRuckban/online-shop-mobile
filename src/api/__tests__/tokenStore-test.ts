import * as SecureStore from 'expo-secure-store'
import { installFakeFetch } from '../../../tests/helpers/fetch'
import { clearToken, currentToken, loadToken, saveToken } from '../../auth/tokenStore'
import { apiGet } from '../client'

describe('session token store', () => {
  it('keeps the token in the secure store and sends it with requests', async () => {
    const fetchMock = installFakeFetch()
    await saveToken('t-1')
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('online-shop.session', 't-1')
    fetchMock.answer({ body: {} })
    await apiGet('/auth/me')
    expect(fetchMock.lastRequest().init.headers.Authorization).toBe('Bearer t-1')
  })

  it('loads the saved token at startup and forgets it on clear', async () => {
    await saveToken('t-2')
    await expect(loadToken()).resolves.toBe('t-2')
    await clearToken()
    expect(currentToken()).toBeNull()
    await expect(loadToken()).resolves.toBeNull()
  })
})
