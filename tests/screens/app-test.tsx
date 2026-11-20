import AsyncStorage from '@react-native-async-storage/async-storage'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { renderRouter, testRouter } from 'expo-router/testing-library'
import { DevSettings, I18nManager } from 'react-native'
import { installFakeFetch, type FakeFetch } from '../helpers/fetch'

// relative to the repo root, where jest runs
const appDir = 'src/app'

// renderRouter turns on fake timers, and RNTL's async findBy/waitFor overlap with them, so these
// tests wrap every change in act() and flush timers and promises explicitly
async function settle() {
  for (let i = 0; i < 3; i++) {
    await act(async () => {
      await jest.runOnlyPendingTimersAsync()
    })
  }
}

/** Opens the app at a path once the saved preferences are read (the boot cover is gone). */
async function openApp(url = '/') {
  await renderRouter(appDir, { initialUrl: url })
  await settle()
  expect(screen.queryByTestId('booting')).toBeNull()
}

async function press(element: Parameters<typeof fireEvent.press>[0]) {
  await act(async () => {
    fireEvent.press(element)
  })
  await settle()
}

let fetchMock: FakeFetch
let reload: jest.SpyInstance
let forceRTL: jest.SpyInstance
beforeEach(async () => {
  fetchMock = installFakeFetch()
  await AsyncStorage.clear()
  reload = jest.spyOn(DevSettings, 'reload').mockImplementation(() => {})
  forceRTL = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {})
})
afterEach(() => {
  reload.mockRestore()
  forceRTL.mockRestore()
})

describe('tabs', () => {
  it('opens on Home with the four tabs', async () => {
    await openApp()
    expect(screen).toHavePathname('/')
    expect(screen.getByText('Welcome to the Online Shop')).toBeTruthy()
    for (const tab of ['Home', 'Shop', 'Cart', 'Account']) expect(screen.getAllByText(tab).length).toBeGreaterThan(0)
  })

  it('moves between tabs', async () => {
    await openApp()
    await testRouter.navigate('/cart')
    await settle()
    expect(screen.getByText('Your cart is empty.')).toBeTruthy()
    await testRouter.navigate('/shop')
    await settle()
    expect(screen.getByText('The catalog is on its way.')).toBeTruthy()
  })
})

describe('preferences on the Account tab', () => {
  it('switches to Spanish and remembers it', async () => {
    await openApp('/account')
    await press(screen.getByTestId('lang-es'))
    expect(screen.getByText('Preferencias')).toBeTruthy()
    expect(screen.getAllByText('Cuenta').length).toBeGreaterThan(0)
    expect(await AsyncStorage.getItem('online-shop:lang')).toBe('es')
    expect(forceRTL).not.toHaveBeenCalled()
  })

  it('switching to Hebrew flips the native direction', async () => {
    await openApp('/account')
    await press(screen.getByTestId('lang-he'))
    expect(screen.getByText('העדפות')).toBeTruthy()
    expect(forceRTL).toHaveBeenCalledWith(true)
    expect(reload).toHaveBeenCalled()
  })

  it('starts in the saved language and theme, and saves a new theme', async () => {
    await AsyncStorage.multiSet([
      ['online-shop:lang', 'es'],
      ['online-shop:theme', 'dark'],
    ])
    await openApp('/account')
    expect(screen.getByText('Preferencias')).toBeTruthy()
    expect(screen.getByTestId('theme-dark').props.accessibilityState).toMatchObject({ checked: true })
    await press(screen.getByTestId('theme-light'))
    expect(await AsyncStorage.getItem('online-shop:theme')).toBe('light')
  })
})

describe('server status', () => {
  it('opens from the Account tab and shows a running server', async () => {
    fetchMock.answer({ body: { status: 'ok', db: 'up' } })
    await openApp('/account')
    await press(screen.getByTestId('server-status-link'))
    expect(screen).toHavePathname('/health')
    expect(screen.getByText('The server is running.')).toBeTruthy()
    expect(fetchMock.lastRequest().url).toMatch(/\/api\/health$/)
  })

  it('shows a server whose database is down', async () => {
    fetchMock.answer({ status: 503, body: { status: 'degraded', db: 'down' } })
    await openApp('/health')
    expect(screen.getByText('The server is running, but its database is down.')).toBeTruthy()
  })

  it('explains an unreachable server and checks again', async () => {
    fetchMock.answer({ fail: true }, { body: { status: 'ok', db: 'up' } })
    await openApp('/health')
    expect(screen.getByText("Can't reach the server. Check your connection and try again.")).toBeTruthy()
    await press(screen.getByText('Check again'))
    expect(screen.getByText('The server is running.')).toBeTruthy()
  })

  it('shows the server answer in Hebrew', async () => {
    await AsyncStorage.setItem('online-shop:lang', 'he')
    fetchMock.answer({ body: { status: 'ok', db: 'up' } })
    await openApp('/health')
    expect(screen.getByText('השרת פועל.')).toBeTruthy()
  })
})
