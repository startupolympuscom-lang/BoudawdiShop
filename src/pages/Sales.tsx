import { useMemo, useState } from 'react'
import { Ban, Printer, Receipt as ReceiptIcon } from 'lucide-react'
import type { Sale } from '../lib/types'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import { useFmt } from '../lib/useFmt'
import { DAY, cx, dayKey, saleItems, saleProfit, startOfDay } from '../lib/utils'
import { Badge, Button, Card, EmptyState, Modal, PageHeader, confirmDialog, toast } from '../components/ui'
import { Receipt } from '../components/Receipt'

interface DaySummary {
  key: string
  ts: number
  sales: Sale[]
  revenue: number
  profit: number
  items: number
  cash: number
  card: number
}

function summarize(key: string, ts: number, sales: Sale[]): DaySummary {
  const ok = sales.filter((s) => !s.voided)
  return {
    key, ts, sales,
    revenue: ok.reduce((a, s) => a + s.total, 0),
    profit: ok.reduce((a, s) => a + saleProfit(s), 0),
    items: ok.reduce((a, s) => a + saleItems(s), 0),
    cash: ok.filter((s) => s.payment === 'cash').reduce((a, s) => a + s.total, 0),
    card: ok.filter((s) => s.payment === 'card').reduce((a, s) => a + s.total, 0),
  }
}

export default function Sales() {
  const t = useT()
  const f = useFmt()
  const { sales, voidSale } = useStore()
  const [selected, setSelected] = useState(dayKey(Date.now()))
  const [viewing, setViewing] = useState<Sale | null>(null)
  const [zOpen, setZOpen] = useState(false)

  const days = useMemo(() => {
    const groups = new Map<string, Sale[]>()
    for (const s of sales) {
      const k = dayKey(s.createdAt)
      groups.set(k, [...(groups.get(k) ?? []), s])
    }
    const todayKey = dayKey(Date.now())
    if (!groups.has(todayKey)) groups.set(todayKey, [])
    return [...groups.entries()]
      .map(([k, l]) => summarize(k, l[0] ? startOfDay(l[0].createdAt) : startOfDay(Date.now()), l.sort((a, b) => b.createdAt - a.createdAt)))
      .sort((a, b) => b.ts - a.ts)
  }, [sales])

  const day = days.find((d) => d.key === selected) ?? days[0]
  const maxRev = Math.max(1, ...days.map((d) => d.revenue))
  const today = startOfDay(Date.now())
  const dayName = (ts: number) => (ts === today ? t('today') : ts === today - DAY ? t('yesterday') : f.date(ts, { weekday: 'short', day: 'numeric', month: 'short' }))
  const okCount = day.sales.filter((s) => !s.voided).length

  const doVoid = async (s: Sale) => {
    if (await confirmDialog(t('sales_voidConfirm'))) {
      voidSale(s.id)
      setViewing(null)
      toast(t('saved'))
    }
  }

  return (
    <div>
      <PageHeader
        title={t('sales_title')}
        subtitle={t('sales_subtitle')}
        actions={<Button variant="secondary" icon={<Printer className="size-4" />} onClick={() => setZOpen(true)}>{t('sales_zReport')}</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="h-fit overflow-hidden lg:sticky lg:top-8">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">{t('sales_days')}</div>
          <ul className="max-h-[70vh] overflow-y-auto p-2">
            {days.map((d) => (
              <li key={d.key}>
                <button
                  onClick={() => setSelected(d.key)}
                  className={cx('w-full rounded-xl px-3 py-2.5 text-start transition', d.key === day.key ? 'bg-emerald-50' : 'hover:bg-slate-50')}
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className={cx('font-medium', d.key === day.key ? 'text-emerald-800' : 'text-slate-700')}>{dayName(d.ts)}</span>
                    <span className="tabular font-semibold text-slate-900">{f.money(d.revenue)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(d.revenue / maxRev) * 100}%` }} />
                    </div>
                    <span className="tabular text-[11px] text-slate-400">{f.num(d.sales.filter((s) => !s.voided).length)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              [t('sales_revenue'), f.money(day.revenue), 'text-emerald-700'],
              [t('sales_count'), f.num(okCount), ''],
              [t('sales_profit'), f.money(day.profit), ''],
              [t('sales_items'), f.num(day.items), ''],
              [t('sales_cash'), f.money(day.cash), ''],
              [t('sales_card'), f.money(day.card), ''],
            ].map(([label, value, cls]) => (
              <Card key={label} className="p-4">
                <div className="text-xs text-slate-500">{label}</div>
                <div className={cx('tabular mt-1.5 text-lg font-semibold text-slate-900', cls)}>{value}</div>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">
              {t('sales_of', { date: f.date(day.ts, { weekday: 'long', day: 'numeric', month: 'long' }) })}
            </div>
            {day.sales.length === 0 ? (
              <EmptyState icon={<ReceiptIcon className="size-7" />} title={t('sales_none')} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-400">
                    <tr>
                      <th className="px-5 py-2.5 text-start font-medium">{t('sales_ticket')}</th>
                      <th className="px-5 py-2.5 text-start font-medium">{t('sales_time')}</th>
                      <th className="px-5 py-2.5 text-start font-medium">{t('ord_lines')}</th>
                      <th className="px-5 py-2.5 text-start font-medium">{t('pos_payment')}</th>
                      <th className="px-5 py-2.5 text-end font-medium">{t('total')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {day.sales.map((s) => (
                      <tr key={s.id} onClick={() => setViewing(s)} className={cx('cursor-pointer hover:bg-slate-50', s.voided && 'opacity-50')}>
                        <td className="tabular px-5 py-3 font-medium text-slate-800">#{s.number}</td>
                        <td className="tabular px-5 py-3 text-slate-500">{f.time(s.createdAt)}</td>
                        <td className="max-w-xs truncate px-5 py-3 text-slate-500">
                          {s.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}
                        </td>
                        <td className="px-5 py-3">
                          {s.voided ? <Badge tone="red">{t('sales_voided')}</Badge> : <Badge tone={s.payment === 'cash' ? 'green' : 'blue'}>{t(s.payment === 'cash' ? 'pos_cash' : 'pos_card')}</Badge>}
                        </td>
                        <td className={cx('tabular px-5 py-3 text-end font-semibold text-slate-900', s.voided && 'line-through')}>{f.money(s.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `${t('sales_ticket')} #${viewing.number}` : ''}
        size="sm"
        footer={
          viewing && (
            <>
              {!viewing.voided && (
                <Button variant="ghost" className="me-auto text-rose-600 hover:bg-rose-50" icon={<Ban className="size-4" />} onClick={() => doVoid(viewing)}>
                  {t('sales_void')}
                </Button>
              )}
              <Button variant="secondary" icon={<Printer className="size-4" />} onClick={() => window.print()}>{t('print')}</Button>
            </>
          )
        }
      >
        {viewing && (
          <>
            {viewing.voided && <div className="mb-3 rounded-xl bg-rose-50 px-4 py-2 text-center text-sm font-medium text-rose-700">{t('sales_voided')}</div>}
            <Receipt sale={viewing} />
          </>
        )}
      </Modal>

      <Modal
        open={zOpen}
        onClose={() => setZOpen(false)}
        title={t('sales_zReport')}
        size="sm"
        footer={<Button icon={<Printer className="size-4" />} onClick={() => window.print()}>{t('print')}</Button>}
      >
        <ZReport day={day} />
      </Modal>
    </div>
  )
}

function ZReport({ day }: { day: DaySummary }) {
  const t = useT()
  const f = useFmt()
  const shopName = useStore((s) => s.settings.shopName)
  const voided = day.sales.filter((s) => s.voided)
  const rows: [string, string][] = [
    [t('sales_count'), f.num(day.sales.length - voided.length)],
    [t('sales_items'), f.num(day.items)],
    [t('sales_cash'), f.money(day.cash)],
    [t('sales_card'), f.money(day.card)],
    [t('sales_profit'), f.money(day.profit)],
    [t('sales_voided'), f.num(voided.length)],
  ]
  return (
    <div className="print-area mx-auto max-w-xs rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm">
      <div className="text-center">
        <div className="text-base font-bold text-slate-900">{shopName}</div>
        <div className="text-xs text-slate-500">{t('sales_zReport')}</div>
        <div className="text-xs text-slate-500">{f.date(day.ts, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>
      <div className="my-3 border-t border-dashed border-slate-300" />
      <ul className="space-y-1.5">
        {rows.map(([k, v]) => (
          <li key={k} className="flex justify-between"><span className="text-slate-500">{k}</span><span className="tabular font-medium">{v}</span></li>
        ))}
      </ul>
      <div className="my-3 border-t border-dashed border-slate-300" />
      <div className="flex justify-between text-base font-bold">
        <span>{t('sales_revenue')}</span>
        <span className="tabular">{f.money(day.revenue)}</span>
      </div>
    </div>
  )
}
