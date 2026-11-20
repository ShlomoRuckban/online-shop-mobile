import type { Shape } from '../translate'
import type { mobileEn } from './mobile.en'

export const mobileHe: Shape<typeof mobileEn> = {
  tabs: {
    home: 'בית',
    shop: 'חנות',
    cart: 'עגלה',
    account: 'חשבון',
  },
  home: {
    welcome: 'ברוכים הבאים לחנות',
    intro: 'מוצרים יומיומיים, גאדג׳טים ומתנות במחירים הוגנים, עד הבית.',
  },
  shop: {
    empty: 'הקטלוג בדרך.',
  },
  cart: {
    empty: 'העגלה ריקה.',
  },
  accountTab: {
    title: 'חשבון',
    preferences: 'העדפות',
    serverStatus: 'מצב השרת',
  },
  prefs: {
    system: 'לפי הטלפון',
    restartTitle: 'נדרשת הפעלה מחדש',
    restartText: 'סגרו ופתחו את האפליקציה כדי להחליף את כיוון הטקסט.',
    ok: 'אישור',
  },
  health: {
    title: 'מצב השרת',
    checking: 'בודקים את השרת…',
    ok: 'השרת פועל.',
    degraded: 'השרת פועל, אבל מסד הנתונים שלו לא זמין.',
    address: 'כתובת: {url}',
    check: 'בדיקה חוזרת',
  },
}
