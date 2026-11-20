// Texts only the app has. Texts shared with the web shop come from web.<lang>.json
// (copied by scripts/import-messages.mjs). mobile.he.ts and mobile.es.ts must have the same keys.

export const mobileEn = {
  tabs: {
    home: 'Home',
    shop: 'Shop',
    cart: 'Cart',
    account: 'Account',
  },
  home: {
    welcome: 'Welcome to the Online Shop',
    intro: 'Everyday essentials, gadgets and gifts at fair prices, delivered to your door.',
  },
  shop: {
    empty: 'The catalog is on its way.',
  },
  cart: {
    empty: 'Your cart is empty.',
  },
  accountTab: {
    title: 'Account',
    preferences: 'Preferences',
    serverStatus: 'Server status',
  },
  prefs: {
    system: 'Match phone',
    restartTitle: 'Restart needed',
    restartText: 'Close and reopen the app to switch the text direction.',
    ok: 'OK',
  },
  health: {
    title: 'Server status',
    checking: 'Checking the server…',
    ok: 'The server is running.',
    degraded: 'The server is running, but its database is down.',
    address: 'Address: {url}',
    check: 'Check again',
  },
}
