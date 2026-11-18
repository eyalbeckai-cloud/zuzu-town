export type Lang = 'he' | 'en';

const STR: Record<string, { en: string; he: string }> = {
  'app.name': { en: 'Zuzu Town', he: 'זוזו טאון' },
  'loc.home': { en: 'Home', he: 'הבית' },
  'loc.bedroom': { en: 'Bedroom', he: 'חדר השינה' },
  'loc.park': { en: 'Park', he: 'הפארק' },
  'loc.bakery': { en: 'Bakery', he: 'המאפייה' },
  'loc.vet': { en: 'Vet Clinic', he: 'מרפאת החיות' },
  'loc.studio': { en: 'Style Studio', he: 'סטודיו סטייל' },
  'studio.skin': { en: 'Skin', he: 'גוון עור' },
  'studio.hair': { en: 'Hair', he: 'תסרוקת' },
  'studio.hairColor': { en: 'Hair color', he: 'צבע שיער' },
  'studio.top': { en: 'Top', he: 'חולצה' },
  'studio.topColor': { en: 'Top color', he: 'צבע חולצה' },
  'studio.pattern': { en: 'Pattern', he: 'דוגמה' },
  'studio.bottom': { en: 'Bottom', he: 'מכנסיים' },
  'studio.bottomColor': { en: 'Bottom color', he: 'צבע מכנסיים' },
  'studio.shoes': { en: 'Shoes', he: 'נעליים' },
  'studio.acc': { en: 'Accessory', he: 'אקססוריז' },
  'gate.title': { en: 'Ask a grown-up', he: 'שאלה להורים' },
  'gate.q': { en: 'What is {a} × {b}?', he: 'כמה זה {a} × {b}?' },
  'gate.wrong': { en: 'Not quite - try again', he: 'לא בדיוק, נסו שוב' },
  'parents.title': { en: 'For grown-ups', he: 'להורים' },
  'parents.music': { en: 'Music', he: 'מוזיקה' },
  'parents.sfx': { en: 'Sounds', he: 'צלילים' },
  'parents.lang': { en: 'Language', he: 'שפה' },
  'parents.on': { en: 'On', he: 'פועל' },
  'parents.off': { en: 'Off', he: 'כבוי' },
  'parents.restore': { en: 'Restore purchases', he: 'שחזור רכישות' },
  'parents.unlock': { en: 'Unlock the whole town', he: 'לפתוח את כל העיר' },
  'parents.owned': { en: 'Whole town unlocked - thank you!', he: 'כל העיר פתוחה - תודה!' },
  'parents.reset': { en: 'Start over (reset the town)', he: 'להתחיל מחדש (איפוס העיר)' },
  'parents.resetConfirm': { en: 'Tap again to confirm reset', he: 'לחצו שוב לאישור האיפוס' },
  'parents.privacy': { en: 'Privacy policy', he: 'מדיניות פרטיות' },
  'parents.about': { en: 'No ads. No data collected. No internet needed.', he: 'בלי פרסומות. בלי איסוף מידע. בלי צורך באינטרנט.' },
  'parents.close': { en: 'Close', he: 'סגירה' },
  'store.title': { en: 'Unlock the whole town!', he: 'פותחים את כל העיר!' },
  'store.body': { en: 'The Bakery and the Vet Clinic, with new friends, pets and treats. One-time purchase. No ads, no subscription.', he: 'המאפייה ומרפאת החיות, עם חברים, חיות ומטעמים חדשים. תשלום חד-פעמי. בלי פרסומות ובלי מנוי.' },
  'store.buy': { en: 'Unlock {price}', he: 'לפתוח {price}' },
  'store.preview': { en: 'Preview: unlocks for free', he: 'גרסת תצוגה: נפתח בחינם' },
  'store.busy': { en: 'One moment...', he: 'רגע אחד...' },
  'store.thanks': { en: 'Unlocked! Have fun', he: 'נפתח! שיהיה כיף' },
  'store.error': { en: 'The purchase did not go through', he: 'הרכישה לא הושלמה' },
  'store.parentNote': { en: 'Payment is handled by the App Store / Google Play.', he: 'התשלום מתבצע דרך App Store / Google Play.' },
};

let lang: Lang = 'en';

export function detectLang(): Lang {
  const n = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase();
  return n.startsWith('he') || n.startsWith('iw') ? 'he' : 'en';
}

export function setLang(l: Lang) {
  lang = l;
  document.documentElement.lang = l;
  document.documentElement.dir = l === 'he' ? 'rtl' : 'ltr';
}

export function getLang() { return lang; }

export function t(key: string, vars: Record<string, string | number> = {}) {
  const s = STR[key];
  let out = s ? s[lang] : key;
  for (const [k, v] of Object.entries(vars)) out = out.replace('{' + k + '}', String(v));
  return out;
}

export function allKeys() { return Object.keys(STR); }
export function rawStrings() { return STR; }
