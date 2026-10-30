import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Barcode, Package, Pencil, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import type { Product } from '../lib/types'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import { useFmt } from '../lib/useFmt'
import { cx } from '../lib/utils'
import { Badge, Button, Card, EmptyState, Field, IconButton, Input, Modal, PageHeader, Select, confirmDialog, toast } from '../components/ui'
import { ProductForm } from '../components/ProductForm'

export function StockBadge({ p }: { p: Product }) {
  const t = useT()
  if (p.stock <= 0) return <Badge tone="red">{t('st_out')}</Badge>
  if (p.stock <= p.minStock) return <Badge tone="amber">{t('st_low')}</Badge>
  return <Badge tone="green">{t('st_ok')}</Badge>
}

export default function Products() {
  const t = useT()
  const f = useFmt()
  const [params, setParams] = useSearchParams()
  const { products, categories, suppliers, deleteProduct, adjustStock } = useStore()
  const [q, setQ] = useState('')
  const cat = params.get('cat') ?? 'all'
  const lowOnly = params.get('low') === '1'
  const [editing, setEditing] = useState<Product | undefined>()
  const [formOpen, setFormOpen] = useState(params.get('new') === '1')
  const [adjusting, setAdjusting] = useState<Product | null>(null)
  const [delta, setDelta] = useState('')

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const supById = useMemo(() => new Map(suppliers.map((s) => [s.id, s])), [suppliers])

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return products
      .filter((p) => (cat === 'all' || p.categoryId === cat) && (!lowOnly || p.stock <= p.minStock) && (!s || p.name.toLowerCase().includes(s) || p.barcode.includes(s)))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products, q, cat, lowOnly])

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params)
    if (v == null) next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }

  const openNew = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  const remove = async (p: Product) => {
    if (await confirmDialog(`${t('confirmDelete')} « ${p.name} »`)) {
      deleteProduct(p.id)
      toast(t('deleted'))
    }
  }

  const applyAdjust = () => {
    const d = parseInt(delta)
    if (adjusting && d) {
      adjustStock(adjusting.id, d)
      toast(t('saved'))
    }
    setAdjusting(null)
    setDelta('')
  }

  return (
    <div>
      <PageHeader
        title={t('prod_title')}
        subtitle={t('prod_subtitle')}
        actions={<Button onClick={openNew} icon={<Plus className="size-4" />}>{t('prod_new')}</Button>}
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} className="ps-9" />
          </div>
          <div className="w-full sm:w-56">
            <Select value={cat} onChange={(e) => setParam('cat', e.target.value === 'all' ? null : e.target.value)}>
              <option value="all">{t('prod_category')} · {t('all')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <button
            onClick={() => setParam('low', lowOnly ? null : '1')}
            className={cx('h-10 rounded-xl border px-3 text-sm font-medium transition', lowOnly ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}
          >
            {t('prod_lowOnly')}
          </button>
          <span className="ms-auto text-xs text-slate-400">{t('prod_count', { n: f.num(list.length) })}</span>
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={<Package className="size-7" />}
            title={t('prod_none')}
            text={products.length === 0 ? t('prod_noneText') : undefined}
            action={products.length === 0 && <Button onClick={openNew} icon={<Plus className="size-4" />}>{t('prod_new')}</Button>}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3 text-start font-medium">{t('name')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('prod_category')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('prod_supplier')}</th>
                    <th className="px-4 py-3 text-end font-medium">{t('prod_price')}</th>
                    <th className="px-4 py-3 text-end font-medium">{t('prod_margin')}</th>
                    <th className="px-4 py-3 text-end font-medium">{t('qty')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('prod_status')}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((p) => {
                    const c = catById.get(p.categoryId)
                    return (
                      <tr key={p.id} className="group hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{p.name}</div>
                          <div className="tabular mt-0.5 flex items-center gap-1 font-mono text-xs text-slate-400" dir="ltr">
                            <Barcode className="size-3" /> {p.barcode || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {c && (
                            <span className="inline-flex items-center gap-1.5 text-slate-600">
                              <span className="size-2 rounded-full" style={{ background: c.color }} />
                              {c.name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{supById.get(p.supplierId ?? '')?.name ?? '—'}</td>
                        <td className="tabular px-4 py-3 text-end font-medium text-slate-800">{f.money(p.price)}</td>
                        <td className="tabular px-4 py-3 text-end text-slate-500">{p.cost ? f.money(p.price - p.cost) : '—'}</td>
                        <td className="tabular px-4 py-3 text-end font-semibold text-slate-800">{f.num(p.stock)}</td>
                        <td className="px-4 py-3"><StockBadge p={p} /></td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-0.5 opacity-60 transition group-hover:opacity-100">
                            <IconButton title={t('prod_adjust')} onClick={() => setAdjusting(p)}><SlidersHorizontal className="size-4" /></IconButton>
                            <IconButton title={t('edit')} onClick={() => { setEditing(p); setFormOpen(true) }}><Pencil className="size-4" /></IconButton>
                            <IconButton title={t('delete')} onClick={() => remove(p)} className="hover:text-rose-600"><Trash2 className="size-4" /></IconButton>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {list.map((p) => {
                const c = catById.get(p.categoryId)
                return (
                  <li key={p.id} className="flex items-center gap-3 p-4">
                    <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: c?.color }} />
                    <button className="min-w-0 flex-1 text-start" onClick={() => { setEditing(p); setFormOpen(true) }}>
                      <div className="truncate font-medium text-slate-800">{p.name}</div>
                      <div className="mt-0.5 text-xs text-slate-400">{c?.name} · {f.money(p.price)}</div>
                    </button>
                    <div className="flex flex-col items-end gap-1">
                      <span className="tabular text-sm font-semibold">{f.num(p.stock)}</span>
                      <StockBadge p={p} />
                    </div>
                    <IconButton onClick={() => setAdjusting(p)}><SlidersHorizontal className="size-4" /></IconButton>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </Card>

      <ProductForm
        open={formOpen}
        onClose={() => { setFormOpen(false); if (params.get('new')) setParam('new', null) }}
        product={editing}
        defaults={cat !== 'all' ? { categoryId: cat } : undefined}
      />

      <Modal
        open={!!adjusting}
        onClose={() => setAdjusting(null)}
        title={t('prod_adjust')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjusting(null)}>{t('cancel')}</Button>
            <Button onClick={applyAdjust}>{t('save')}</Button>
          </>
        }
      >
        {adjusting && (
          <form onSubmit={(e) => { e.preventDefault(); applyAdjust() }} className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="font-medium text-slate-700">{adjusting.name}</span>
              <span className="tabular text-sm text-slate-500">
                {f.num(adjusting.stock)}
                {parseInt(delta) ? <span className="font-semibold text-emerald-700" dir="ltr"> → {f.num(Math.max(0, adjusting.stock + parseInt(delta)))}</span> : null}
              </span>
            </div>
            <div className="flex gap-2">
              {[-10, -1, 1, 10, 24].map((d) => (
                <button type="button" key={d} onClick={() => setDelta(String((parseInt(delta) || 0) + d))} className="tabular h-9 flex-1 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:border-emerald-400 hover:text-emerald-700" dir="ltr">
                  {d > 0 ? `+${d}` : d}
                </button>
              ))}
            </div>
            <Field label={t('qty')}>
              <Input autoFocus value={delta} onChange={(e) => setDelta(e.target.value)} inputMode="numeric" placeholder="+12 / -3" dir="ltr" className="tabular" />
            </Field>
            <p className="text-xs text-slate-500">{t('prod_adjustHint')}</p>
          </form>
        )}
      </Modal>
    </div>
  )
}
