import type { Shape } from '../translate'
import type { mobileEn } from './mobile.en'

export const mobileEs: Shape<typeof mobileEn> = {
  tabs: {
    home: 'Inicio',
    shop: 'Tienda',
    cart: 'Carrito',
    account: 'Cuenta',
  },
  home: {
    welcome: 'Te damos la bienvenida a la tienda',
    intro: 'Artículos de uso diario, gadgets y regalos a precios justos, entregados en tu puerta.',
  },
  shop: {
    empty: 'El catálogo está en camino.',
  },
  cart: {
    empty: 'Tu carrito está vacío.',
  },
  accountTab: {
    title: 'Cuenta',
    preferences: 'Preferencias',
    serverStatus: 'Estado del servidor',
  },
  prefs: {
    system: 'Igual que el teléfono',
    restartTitle: 'Hay que reiniciar',
    restartText: 'Cierra y vuelve a abrir la app para cambiar la dirección del texto.',
    ok: 'Aceptar',
  },
  health: {
    title: 'Estado del servidor',
    checking: 'Comprobando el servidor…',
    ok: 'El servidor funciona.',
    degraded: 'El servidor funciona, pero su base de datos no está disponible.',
    address: 'Dirección: {url}',
    check: 'Comprobar de nuevo',
  },
}
