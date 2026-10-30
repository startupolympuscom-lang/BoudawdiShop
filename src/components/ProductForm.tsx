import { useEffect, useState } from 'react'
import { Camera, Check, Plus, Wand2 } from 'lucide-react'
import type { Product } from '../lib/types'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import { useFmt } from '../lib/useFmt'
import { CATEGORY_COLORS, generateEan13 } from '../lib/utils'
import { Button, Field, Input, Modal, Select, toast } from './ui'
import { BarcodeScanner } from './BarcodeScanner'

type Form = { name: string; categoryId: string; barcode: string; price: string; cost: string; stock: string; minStock: string; supplierId: string }

const toForm = (p?: Partial<Product>): Form => ({
  name: p?.name ?? '',
  categoryId: p?.categoryId ?? '',
  barcode: p?.barcode ?? '',
  price: p?.price != null ? String(p.price) : '',
  cost: p?.cost != null ? String(p.cost) : '',
  stock: p?.stock != null ? String(p.stock) : '',
  minStock: p?.minStock != null ? String(p.minStock) : '5',
  supplierId: p?.supplierId ?? '',
})

const n = (v: string) => {
  const x = parseFloat(v.replace(',', '.'))
  return isNaN(x) ? 0 : x
}

export function ProductForm({ open, onClose, product, defaults }: { open: boolean; onClose: () => void; product?: Product; defaults?: Partial<Product> }) {
  const t = useT()
  const fmt = useFmt()
  const { categories, suppliers, products, saveProduct, saveCategory } = useStore()
  const [f, setF] = useState<Form>(toForm())
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [scan, setScan] = useState(false)
  const [newCat, setNewCat] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setF(toForm(product ?? { categoryId: categories.length === 1 ? categories[0].id : '', ...defaults }))
      setErrors({})
      setNewCat(categories.length === 0 ? '' : null)
    }
  }, [open, product])

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }))

  const createCategory = () => {
    const name = newCat?.trim()
    if (!name) return
    const c = saveCategory({ name, color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length] })
    setF((s) => ({ ...s, categoryId: c.id }))
    setNewCat(null)
  }

  const submit = () => {
    const e: typeof errors = {}
    if (!f.name.trim()) e.name = t('required')
    if (!f.categoryId) e.categoryId = t('required')
    if (!f.price) e.price = t('required')
    const dup = f.barcode.trim() && products.find((p) => p.barcode === f.barcode.trim() && p.id !== product?.id)
    if (dup) e.barcode = t('prod_barcodeExists', { name: dup.name })
    setErrors(e)
    if (Object.keys(e).length) return
    saveProduct({
      id: product?.id,
      name: f.name.trim(),
      categoryId: f.categoryId,
      barcode: f.barcode.trim(),
      price: n(f.price),
      cost: n(f.cost),
      stock: Math.max(0, Math.round(n(f.stock))),
      minStock: Math.max(0, Math.round(n(f.minStock))),
      supplierId: f.supplierId || undefined,
    })
    toast(t('saved'))
    onClose()
  }

  const margin = n(f.price) - n(f.cost)
  const marginPct = n(f.price) ? (margin / n(f.price)) * 100 : 0

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={product ? t('prod_edit') : t('prod_new')}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
            <Button onClick={submit}>{t('save')}</Button>
          </>
        }
      >
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); submit() }}>
          <Field label={t('prod_barcode')} error={errors.barcode} className="sm:col-span-2">
            <div className="flex gap-2">
              <Input value={f.barcode} onChange={set('barcode')} placeholder="6111234567890" dir="ltr" className="tabular font-mono" autoFocus={!product} />
              <Button variant="soft" onClick={() => setScan(true)} icon={<Camera className="size-4" />}>{t('prod_scan')}</Button>
              <Button variant="secondary" onClick={() => setF((s) => ({ ...s, barcode: generateEan13() }))} title={t('prod_generate')}>
                <Wand2 className="size-4" />
              </Button>
            </div>
          </Field>

          <Field label={t('prod_name')} error={errors.name} className="sm:col-span-2">
            <Input value={f.name} onChange={set('name')} />
          </Field>

          <Field label={t('prod_category')} error={errors.categoryId}>
            {newCat === null ? (
              <div className="flex gap-2">
                <Select value={f.categoryId} onChange={set('categoryId')}>
                  <option value="">—</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Button variant="secondary" onClick={() => setNewCat('')} title={t('prod_newCategory')}><Plus className="size-4" /></Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createCategory() } }}
                  placeholder={t('prod_newCategory')}
                />
                <Button variant="soft" onClick={createCategory}><Check className="size-4" /></Button>
              </div>
            )}
          </Field>

          <Field label={t('prod_supplier')}>
            <Select value={f.supplierId} onChange={set('supplierId')}>
              <option value="">{t('none')}</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>

          <Field label={`${t('prod_price')} (${useStore.getState().settings.currency})`} error={errors.price}>
            <Input value={f.price} onChange={set('price')} inputMode="decimal" className="tabular" />
          </Field>
          <Field label={`${t('prod_cost')} (${useStore.getState().settings.currency})`}>
            <Input value={f.cost} onChange={set('cost')} inputMode="decimal" className="tabular" />
          </Field>

          <Field label={t('prod_stock')}>
            <Input value={f.stock} onChange={set('stock')} inputMode="numeric" className="tabular" />
          </Field>
          <Field label={t('prod_minStock')}>
            <Input value={f.minStock} onChange={set('minStock')} inputMode="numeric" className="tabular" />
          </Field>

          {n(f.price) > 0 && n(f.cost) > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm sm:col-span-2">
              <span className="text-slate-500">{t('prod_margin')}</span>
              <span className={margin >= 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-600'}>
                {fmt.money(margin)} · <span dir="ltr">{marginPct.toFixed(0)}%</span>
              </span>
            </div>
          )}
          <button type="submit" hidden />
        </form>
      </Modal>
      <BarcodeScanner
        open={scan}
        onClose={() => setScan(false)}
        onDetected={(code) => {
          setScan(false)
          setF((s) => ({ ...s, barcode: code }))
        }}
      />
    </>
  )
}
