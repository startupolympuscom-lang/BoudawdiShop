import type { Sale } from '../lib/types'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import { useFmt } from '../lib/useFmt'

export function Receipt({ sale }: { sale: Sale }) {
  const t = useT()
  const f = useFmt()
  const shopName = useStore((s) => s.settings.shopName)
  const change = sale.payment === 'cash' && sale.cashGiven != null ? sale.cashGiven - sale.total : null
  return (
    <div className="print-area mx-auto max-w-xs rounded-2xl border border-dashed border-slate-300 bg-white p-5 font-mono text-[13px] text-slate-700">
      <div className="text-center">
        <div className="font-sans text-base font-bold text-slate-900">{shopName}</div>
        <div className="mt-0.5 text-xs text-slate-500">{t('pos_receipt')} #{sale.number}</div>
        <div className="text-xs text-slate-500">{f.date(sale.createdAt)} · {f.time(sale.createdAt)}</div>
      </div>
      <div className="my-3 border-t border-dashed border-slate-300" />
      <ul className="space-y-1.5">
        {sale.lines.map((l) => (
          <li key={l.productId}>
            <div className="flex justify-between gap-2">
              <span className="truncate font-sans">{l.name}</span>
              <span className="tabular shrink-0">{f.money(l.price * l.qty)}</span>
            </div>
            <div className="tabular text-xs text-slate-400">{f.num(l.qty)} × {f.money(l.price)}</div>
          </li>
        ))}
      </ul>
      <div className="my-3 border-t border-dashed border-slate-300" />
      <div className="flex justify-between text-base font-bold text-slate-900">
        <span className="font-sans">{t('total')}</span>
        <span className="tabular">{f.money(sale.total)}</span>
      </div>
      <div className="mt-1 flex justify-between text-xs">
        <span className="font-sans">{t(sale.payment === 'cash' ? 'pos_cash' : 'pos_card')}</span>
        <span className="tabular">{f.money(sale.cashGiven ?? sale.total)}</span>
      </div>
      {change != null && change > 0 && (
        <div className="flex justify-between text-xs">
          <span className="font-sans">{t('pos_change')}</span>
          <span className="tabular">{f.money(change)}</span>
        </div>
      )}
      <div className="mt-4 text-center font-sans text-xs text-slate-500">{t('pos_thanks')}</div>
    </div>
  )
}
