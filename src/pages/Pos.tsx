import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Banknote, Camera, CreditCard, Minus, PackageSearch, Plus, Printer, ScanBarcode, ShoppingCart, Trash2, X } from 'lucide-react'
import { useStore, type CartLine } from '../lib/store'
import { useT } from '../lib/i18n'
import { useFmt } from '../lib/useFmt'
import type { PaymentMethod, Product, Sale } from '../lib/types'
import { cx } from '../lib/utils'
import { Button, Card, IconButton, Modal, toast } from '../components/ui'
import { BarcodeScanner } from '../components/BarcodeScanner'
import { Receipt } from '../components/Receipt'

export default function Pos() {
  const t = useT()
  const f = useFmt()
  const { products, categories, checkout } = useStore()
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<string>('all')
  const [cart, setCart] = useState<CartLine[]>([])
  const [payment, setPayment] = useState<PaymentMethod>('cash')
  const [cash, setCash] = useState('')
  const [scanOpen, setScanOpen] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const search = useRef<HTMLInputElement>(null)

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products
      .filter((p) => (cat === 'all' || p.categoryId === cat) && (!q || p.name.toLowerCase().includes(q) || p.barcode.includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products, query, cat])

  const lines = cart.map((c) => ({ ...c, product: byId.get(c.productId)! })).filter((l) => l.product)
  const total = Math.round(lines.reduce((a, l) => a + l.product.price * l.qty, 0) * 100) / 100
  const count = lines.reduce((a, l) => a + l.qty, 0)
  const cashNum = parseFloat(cash.replace(',', '.'))
  const change = payment === 'cash' && !isNaN(cashNum) ? cashNum - total : null

  const cartRef = useRef(cart)
  cartRef.current = cart

  const add = useCallback(
    (p: Product, qty = 1) => {
      const prev = cartRef.current
      const inCart = prev.find((c) => c.productId === p.id)?.qty ?? 0
      if (inCart + qty > p.stock) return toast(t('pos_outOfStock', { name: p.name }), 'error')
      const next = inCart ? prev.map((c) => (c.productId === p.id ? { ...c, qty: c.qty + qty } : c)) : [...prev, { productId: p.id, qty }]
      cartRef.current = next
      setCart(next)
      setFlash(p.id)
      setTimeout(() => setFlash(null), 450)
    },
    [t],
  )

  const setQty = (id: string, qty: number) => {
    const p = byId.get(id)
    if (!p) return
    if (qty > p.stock) return toast(t('pos_outOfStock', { name: p.name }), 'error')
    setCart((prev) => (qty <= 0 ? prev.filter((c) => c.productId !== id) : prev.map((c) => (c.productId === id ? { ...c, qty } : c))))
  }

  const lookup = useCallback(
    (code: string) => {
      const c = code.trim()
      if (!c) return
      const exact = products.find((p) => p.barcode === c)
      if (exact) return add(exact)
      const matches = products.filter((p) => p.name.toLowerCase().includes(c.toLowerCase()))
      if (matches.length === 1) return add(matches[0])
      if (matches.length === 0) toast(t('pos_notFound', { code: c }), 'error')
    },
    [products, add, t],
  )

  // Barcode scanners type like a keyboard: route stray keystrokes to the search field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (lastSale || scanOpen || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) search.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lastSale, scanOpen])

  const pay = () => {
    if (!lines.length) return
    if (payment === 'cash' && cash && change != null && change < 0) return toast(t('pos_insufficient'), 'error')
    const sale = checkout(cart, payment, payment === 'cash' ? (isNaN(cashNum) ? total : cashNum) : undefined)
    setLastSale(sale)
    setCart([])
    setCash('')
    setPayment('cash')
    toast(t('pos_done'))
  }

  const quickCash = [...new Set([Math.ceil(total), Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100, 200])]
    .filter((v) => v >= total && v > 0)
    .slice(0, 4)

  const onScan = useCallback(
    (code: string) => {
      setScanOpen(false)
      lookup(code)
    },
    [lookup],
  )

  return (
    <div className="grid gap-4 lg:h-[calc(100vh-2.5rem)] lg:grid-cols-[minmax(0,1fr)_400px]">
      {/* Catalogue */}
      <div className="flex min-h-0 flex-col gap-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            lookup(query)
            setQuery('')
          }}
        >
          <div className="relative flex-1">
            <ScanBarcode className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-emerald-600" />
            <input
              ref={search}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('pos_scanPlaceholder')}
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white ps-12 pe-4 text-base shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>
          <Button size="lg" variant="secondary" className="h-14 rounded-2xl" onClick={() => setScanOpen(true)} title={t('pos_scanCamera')}>
            <Camera className="size-5" />
          </Button>
        </form>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {[{ id: 'all', name: t('all'), color: '#0f172a' }, ...categories].map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cx(
                'flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
                cat === c.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
              )}
            >
              {c.id !== 'all' && <span className="size-2 rounded-full" style={{ background: c.color }} />}
              {c.name}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 py-16 text-center text-sm text-slate-500">
              <PackageSearch className="size-10 text-slate-300" />
              {products.length ? t('prod_none') : t('pos_noProducts')}
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {visible.map((p) => {
                const c = catById.get(p.categoryId)
                const out = p.stock <= 0
                return (
                  <button
                    key={p.id}
                    disabled={out}
                    onClick={() => add(p)}
                    className={cx(
                      'group relative flex flex-col items-start rounded-2xl border bg-white p-3.5 text-start shadow-[0_1px_2px_rgba(15,23,42,.04)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0',
                      flash === p.id ? 'border-emerald-500 ring-4 ring-emerald-500/15' : 'border-slate-200/80',
                    )}
                  >
                    <span className="mb-3 h-1 w-8 rounded-full" style={{ background: c?.color ?? '#cbd5e1' }} />
                    <span className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-slate-800">{p.name}</span>
                    <span className="mt-2 flex w-full items-end justify-between gap-1">
                      <span className="tabular font-semibold text-slate-900">{f.money(p.price)}</span>
                      <span className={cx('tabular text-[11px]', p.stock <= p.minStock ? 'text-amber-600' : 'text-slate-400')}>
                        {out ? t('st_out') : `${f.num(p.stock)}`}
                      </span>
                    </span>
                    <span className="absolute end-3 top-3 grid size-7 place-items-center rounded-full bg-emerald-600 text-white opacity-0 transition group-hover:opacity-100">
                      <Plus className="size-4" />
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ticket */}
      <Card className="flex min-h-[28rem] flex-col overflow-hidden lg:min-h-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-900">{t('pos_ticket')}</h2>
            {count > 0 && <span className="tabular rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">{count}</span>}
          </div>
          {lines.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setCart([])} icon={<Trash2 className="size-4" />}>
              {t('pos_clear')}
            </Button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center text-sm text-slate-400">
              <div className="grid size-16 place-items-center rounded-full bg-slate-50">
                <ScanBarcode className="size-7 text-slate-300" />
              </div>
              {t('pos_empty')}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lines.map((l) => (
                <li key={l.productId} className="flex items-center gap-3 px-2 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-medium leading-5 text-slate-800">{l.product.name}</div>
                    <div className="tabular text-xs text-slate-400">{f.money(l.product.price)}</div>
                  </div>
                  <div className="flex items-center rounded-xl border border-slate-200">
                    <IconButton onClick={() => setQty(l.productId, l.qty - 1)}><Minus className="size-3.5" /></IconButton>
                    <input
                      value={l.qty}
                      onChange={(e) => setQty(l.productId, parseInt(e.target.value) || 0)}
                      className="tabular w-9 bg-transparent text-center text-sm font-semibold outline-none"
                      inputMode="numeric"
                    />
                    <IconButton onClick={() => setQty(l.productId, l.qty + 1)}><Plus className="size-3.5" /></IconButton>
                  </div>
                  <div className="tabular w-20 text-end text-sm font-semibold text-slate-900">{f.money(l.product.price * l.qty)}</div>
                  <IconButton onClick={() => setQty(l.productId, 0)} className="hover:text-rose-600"><X className="size-4" /></IconButton>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-500">{t('total')}</span>
            <span className="tabular text-3xl font-bold tracking-tight text-slate-900">{f.money(total)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(['cash', 'card'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPayment(m)}
                className={cx(
                  'flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition',
                  payment === m ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                {m === 'cash' ? <Banknote className="size-4" /> : <CreditCard className="size-4" />}
                {t(m === 'cash' ? 'pos_cash' : 'pos_card')}
              </button>
            ))}
          </div>

          {payment === 'cash' && lines.length > 0 && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  placeholder={t('pos_cashGiven')}
                  inputMode="decimal"
                  className="tabular h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
                {quickCash.map((v) => (
                  <button key={v} onClick={() => setCash(String(v))} className="tabular h-10 shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:border-emerald-400 hover:text-emerald-700">
                    {v}
                  </button>
                ))}
              </div>
              {change != null && (
                <div className={cx('flex items-center justify-between rounded-xl px-3 py-2 text-sm', change >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700')}>
                  <span>{change >= 0 ? t('pos_change') : t('pos_insufficient')}</span>
                  <span className="tabular font-semibold">{f.money(Math.abs(change))}</span>
                </div>
              )}
            </div>
          )}

          <Button size="lg" className="h-14 w-full rounded-2xl text-base" disabled={!lines.length} onClick={pay}>
            {t('pos_checkout')} · {f.money(total)}
          </Button>
        </div>
      </Card>

      <BarcodeScanner open={scanOpen} onClose={() => setScanOpen(false)} onDetected={onScan} />

      <Modal
        open={!!lastSale}
        onClose={() => setLastSale(null)}
        title={t('pos_done')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" icon={<Printer className="size-4" />} onClick={() => window.print()}>{t('print')}</Button>
            <Button onClick={() => { setLastSale(null); setTimeout(() => search.current?.focus(), 0) }}>{t('pos_newSale')}</Button>
          </>
        }
      >
        {lastSale && <Receipt sale={lastSale} />}
      </Modal>
    </div>
  )
}
