import { useStore } from './store'
import { dateLabel, money, num, timeLabel } from './utils'

export function useFmt() {
  const { lang, currency } = useStore((s) => s.settings)
  return {
    lang,
    money: (n: number) => money(n, currency, lang),
    num: (n: number) => num(n, lang),
    date: (ts: number, o?: Intl.DateTimeFormatOptions) => dateLabel(ts, lang, o),
    time: (ts: number) => timeLabel(ts, lang),
  }
}
