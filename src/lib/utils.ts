import type { Lang, Sale } from './types'

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

export const locale = (lang: Lang) => (lang === 'ar' ? 'ar-MA' : 'fr-FR')

export function money(n: number, currency: string, lang: Lang) {
  const v = new Intl.NumberFormat(locale(lang), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0)
  return `${v} ${currency}`
}

export function num(n: number, lang: Lang) {
  return new Intl.NumberFormat(locale(lang)).format(n || 0)
}

export function dateLabel(ts: number, lang: Lang, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale(lang), opts ?? { day: '2-digit', month: 'short', year: 'numeric' }).format(ts)
}

export function timeLabel(ts: number, lang: Lang) {
  return new Intl.DateTimeFormat(locale(lang), { hour: '2-digit', minute: '2-digit' }).format(ts)
}

export const startOfDay = (ts: number) => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const dayKey = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const DAY = 86_400_000

export const activeSales = (sales: Sale[]) => sales.filter((s) => !s.voided)

export const saleProfit = (s: Sale) => s.lines.reduce((a, l) => a + (l.price - l.cost) * l.qty, 0)

export const saleItems = (s: Sale) => s.lines.reduce((a, l) => a + l.qty, 0)

/** Internal EAN-13 (prefix 2 = in-store use) with a valid check digit. */
export function generateEan13() {
  let base = '2'
  for (let i = 0; i < 11; i++) base += Math.floor(Math.random() * 10)
  const sum = base.split('').reduce((a, c, i) => a + Number(c) * (i % 2 ? 3 : 1), 0)
  return base + ((10 - (sum % 10)) % 10)
}

export const CATEGORY_COLORS = [
  '#059669', '#0284c7', '#7c3aed', '#db2777', '#ea580c',
  '#ca8a04', '#0d9488', '#4f46e5', '#dc2626', '#65a30d',
]

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}
