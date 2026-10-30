import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Boxes, Coins, PackageOpen, Receipt, ShoppingBasket, Sparkles, TrendingUp, Truck, Wallet } from 'lucide-react'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import { useFmt } from '../lib/useFmt'
import { DAY, activeSales, cx, saleItems, saleProfit, startOfDay } from '../lib/utils'
import { Badge, Button, Card, PageHeader, toast } from '../components/ui'
import { RevenueChart, type Point } from '../components/RevenueChart'

function Kpi({ label, value, icon, tone, delta, hint }: { label: string; value: string; icon: ReactNode; tone: string; delta?: number | null; hint?: string }) {
  const t = useT()
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <span className={cx('grid size-9 place-items-center rounded-xl', tone)}>{icon}</span>
      </div>
      <div className="tabular mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      {delta != null && Number.isFinite(delta) ? (
        <div className={cx('mt-1.5 flex items-center gap-1 text-xs font-medium', delta >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
          {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          <span dir="ltr">{delta >= 0 ? '+' : ''}{delta.toFixed(0)}%</span>
          <span className="font-normal text-slate-400">{t('kpi_vsYesterday')}</span>
        </div>
      ) : (
        hint && <div className="mt-1.5 text-xs text-slate-400">{hint}</div>
      )}
    </Card>
  )
}

export default function Dashboard() {
  const t = useT()
  const f = useFmt()
  const nav = useNavigate()
  const { products, sales: allSales, orders, categories, loadDemo } = useStore()
  const [range, setRange] = useState<7 | 30>(7)

  const stats = useMemo(() => {
    const sales = activeSales(allSales)
    const today = startOfDay(Date.now())
    const inDay = (d: number) => sales.filter((s) => s.createdAt >= d && s.createdAt < d + DAY)
    const td = inDay(today)
    const yd = inDay(today - DAY)
    const sum = (l: typeof sales) => l.reduce((a, s) => a + s.total, 0)
    const rev = sum(td)
    const yRev = sum(yd)
    const series = (n: number): Point[] =>
      Array.from({ length: n }, (_, i) => {
        const d = today - (n - 1 - i) * DAY
        const l = inDay(d)
        return { ts: d, value: sum(l), count: l.length }
      })

    const since = today - 29 * DAY
    const top = new Map<string, { name: string; qty: number; revenue: number }>()
    for (const s of sales) {
      if (s.createdAt < since) continue
      for (const l of s.lines) {
        const e = top.get(l.productId) ?? { name: l.name, qty: 0, revenue: 0 }
        e.qty += l.qty
        e.revenue += l.qty * l.price
        top.set(l.productId, e)
      }
    }

    return {
      rev,
      revDelta: yRev ? ((rev - yRev) / yRev) * 100 : null,
      count: td.length,
      countDelta: yd.length ? ((td.length - yd.length) / yd.length) * 100 : null,
      avg: td.length ? rev / td.length : 0,
      margin: td.reduce((a, s) => a + saleProfit(s), 0),
      s7: series(7),
      s30: series(30),
      top: [...top.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 5),
      recent: [...sales].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6),
    }
  }, [allSales])

  const low = products.filter((p) => p.stock <= p.minStock).sort((a, b) => a.stock - b.stock)
  const stockValue = products.reduce((a, p) => a + p.cost * p.stock, 0)
  const pending = orders.filter((o) => o.status === 'ordered').length
  const topMax = Math.max(1, ...stats.top.map(([, v]) => v.qty))

  const isEmpty = products.length === 0 && categories.length === 0

  return (
    <div>
      <PageHeader
        title={t('dash_title')}
        subtitle={`${t('dash_subtitle')} · ${f.date(Date.now(), { weekday: 'long', day: 'numeric', month: 'long' })}`}
        actions={
          <Button onClick={() => nav('/pos')} icon={<ShoppingBasket className="size-4" />} size="lg">
            {t('nav_pos')}
          </Button>
        }
      />

      {isEmpty && (
        <Card className="mb-6 overflow-hidden">
          <div className="flex flex-col items-start gap-4 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 sm:flex-row sm:items-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-emerald-600 text-white">
              <Sparkles className="size-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900">{t('welcome_title')}</h2>
              <p className="mt-1 text-sm text-slate-600">{t('welcome_text')}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => nav('/categories?new=1')}>{t('startEmpty')}</Button>
              <Button onClick={() => { loadDemo(); toast(t('set_demoLoaded')) }}>{t('loadDemo')}</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={t('kpi_revenueToday')} value={f.money(stats.rev)} icon={<Wallet className="size-[18px]" />} tone="bg-emerald-50 text-emerald-600" delta={stats.revDelta} />
        <Kpi label={t('kpi_salesToday')} value={f.num(stats.count)} icon={<Receipt className="size-[18px]" />} tone="bg-sky-50 text-sky-600" delta={stats.countDelta} />
        <Kpi label={t('kpi_avgBasket')} value={f.money(stats.avg)} icon={<ShoppingBasket className="size-[18px]" />} tone="bg-violet-50 text-violet-600" hint="—" />
        <Kpi label={t('kpi_marginToday')} value={f.money(stats.margin)} icon={<TrendingUp className="size-[18px]" />} tone="bg-amber-50 text-amber-600" hint="—" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">{t('chart_revenue')}</h2>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-medium">
              {([7, 30] as const).map((r) => (
                <button key={r} onClick={() => setRange(r)} className={cx('rounded-lg px-3 py-1', range === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>
                  {t(r === 7 ? 'chart_7d' : 'chart_30d')}
                </button>
              ))}
            </div>
          </div>
          <RevenueChart data={range === 7 ? stats.s7 : stats.s30} />
        </Card>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-1">
          <MiniStat icon={<Coins className="size-4" />} label={t('kpi_stockValue')} value={f.money(stockValue)} />
          <MiniStat icon={<Boxes className="size-4" />} label={t('kpi_products')} value={f.num(products.length)} to="/products" />
          <MiniStat icon={<AlertTriangle className="size-4" />} label={t('kpi_lowStock')} value={f.num(low.length)} to="/products?low=1" warn={low.length > 0} />
          <MiniStat icon={<Truck className="size-4" />} label={t('kpi_pendingOrders')} value={f.num(pending)} to="/suppliers?tab=orders" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-900">{t('topProducts')}</h2>
          {stats.top.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">{t('noSalesYet')}</p>
          ) : (
            <ul className="space-y-3.5">
              {stats.top.map(([id, v], i) => (
                <li key={id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="tabular grid size-5 shrink-0 place-items-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-500">{i + 1}</span>
                      <span className="truncate text-slate-700">{v.name}</span>
                    </span>
                    <span className="tabular shrink-0 text-xs text-slate-500">{f.num(v.qty)} {t('sold')}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(v.qty / topMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">{t('lowStockAlerts')}</h2>
            {low.length > 0 && <Badge tone="amber">{low.length}</Badge>}
          </div>
          {low.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">{t('allGood')}</p>
          ) : (
            <ul className="-mx-2 max-h-72 space-y-1 overflow-y-auto">
              {low.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 hover:bg-slate-50">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <PackageOpen className={cx('size-4 shrink-0', p.stock === 0 ? 'text-rose-500' : 'text-amber-500')} />
                    <span className="truncate text-sm text-slate-700">{p.name}</span>
                  </span>
                  <Badge tone={p.stock === 0 ? 'red' : 'amber'}>
                    {p.stock === 0 ? t('st_out') : `${f.num(p.stock)} ${t('left')}`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">{t('recentSales')}</h2>
            <Link to="/sales" className="text-xs font-medium text-emerald-700 hover:underline">{t('nav_sales')} →</Link>
          </div>
          {stats.recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">{t('noSalesYet')}</p>
          ) : (
            <ul className="-mx-2 space-y-1">
              {stats.recent.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-slate-50">
                  <div>
                    <div className="text-sm font-medium text-slate-700">#{s.number}</div>
                    <div className="text-xs text-slate-400">
                      {f.date(s.createdAt, { day: 'numeric', month: 'short' })} · {f.time(s.createdAt)} · {f.num(saleItems(s))} {t('items')}
                    </div>
                  </div>
                  <span className="tabular text-sm font-semibold text-slate-900">{f.money(s.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

function MiniStat({ icon, label, value, to, warn }: { icon: ReactNode; label: string; value: string; to?: string; warn?: boolean }) {
  const body = (
    <Card className={cx('h-full p-4 transition', to && 'hover:border-emerald-200 hover:shadow-md')}>
      <div className={cx('flex items-center gap-2 text-xs', warn ? 'text-amber-600' : 'text-slate-500')}>
        {icon}
        {label}
      </div>
      <div className="tabular mt-2 text-lg font-semibold text-slate-900">{value}</div>
    </Card>
  )
  return to ? <Link to={to}>{body}</Link> : body
}
