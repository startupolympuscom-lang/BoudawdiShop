import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ClipboardList, Mail, MapPin, PackageCheck, Pencil, Phone, Plus, Sparkles, Trash2, Truck, User, X } from 'lucide-react'
import type { OrderLine, OrderStatus, PurchaseOrder, Supplier } from '../lib/types'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import { useFmt } from '../lib/useFmt'
import { cx } from '../lib/utils'
import { Badge, Button, Card, EmptyState, Field, IconButton, Input, Modal, PageHeader, Select, confirmDialog, toast } from '../components/ui'

const orderTotal = (o: PurchaseOrder) => o.lines.reduce((a, l) => a + l.qty * l.unitCost, 0)

export function StatusBadge({ s }: { s: OrderStatus }) {
  const t = useT()
  if (s === 'received') return <Badge tone="green">{t('ord_received')}</Badge>
  if (s === 'cancelled') return <Badge tone="slate">{t('ord_cancelled')}</Badge>
  return <Badge tone="blue">{t('ord_ordered')}</Badge>
}

export default function Suppliers() {
  const t = useT()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'orders' ? 'orders' : 'suppliers'
  const [supForm, setSupForm] = useState<{ open: boolean; s?: Supplier }>({ open: false })
  const [orderForm, setOrderForm] = useState<{ open: boolean; supplierId?: string }>({ open: false })

  return (
    <div>
      <PageHeader
        title={t('sup_title')}
        subtitle={t('sup_subtitle')}
        actions={
          <>
            <Button variant="secondary" onClick={() => setSupForm({ open: true })} icon={<Plus className="size-4" />}>{t('sup_new')}</Button>
            <Button onClick={() => setOrderForm({ open: true })} icon={<ClipboardList className="size-4" />}>{t('ord_new')}</Button>
          </>
        }
      />

      <div className="mb-5 inline-flex rounded-xl bg-slate-200/60 p-1 text-sm font-medium">
        {(['suppliers', 'orders'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setParams(k === 'orders' ? { tab: 'orders' } : {}, { replace: true })}
            className={cx('rounded-lg px-4 py-1.5 transition', tab === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
          >
            {t(k === 'orders' ? 'sup_tabOrders' : 'sup_tabSuppliers')}
          </button>
        ))}
      </div>

      {tab === 'suppliers' ? (
        <SupplierList onEdit={(s) => setSupForm({ open: true, s })} onNew={() => setSupForm({ open: true })} onOrder={(id) => setOrderForm({ open: true, supplierId: id })} />
      ) : (
        <OrderList onNew={() => setOrderForm({ open: true })} />
      )}

      <SupplierForm open={supForm.open} supplier={supForm.s} onClose={() => setSupForm({ open: false })} />
      <OrderForm
        open={orderForm.open}
        supplierId={orderForm.supplierId}
        onClose={() => setOrderForm({ open: false })}
        onCreated={() => setParams({ tab: 'orders' }, { replace: true })}
      />
    </div>
  )
}

function SupplierList({ onEdit, onNew, onOrder }: { onEdit: (s: Supplier) => void; onNew: () => void; onOrder: (id: string) => void }) {
  const t = useT()
  const f = useFmt()
  const { suppliers, products, orders, deleteSupplier } = useStore()

  const remove = async (s: Supplier) => {
    if (!(await confirmDialog(`${t('confirmDelete')} « ${s.name} »`))) return
    if (deleteSupplier(s.id)) toast(t('deleted'))
    else toast(t('sup_hasRefs'), 'error')
  }

  if (!suppliers.length)
    return (
      <Card>
        <EmptyState icon={<Truck className="size-7" />} title={t('sup_none')} text={t('sup_noneText')} action={<Button onClick={onNew} icon={<Plus className="size-4" />}>{t('sup_new')}</Button>} />
      </Card>
    )

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {suppliers.map((s) => {
        const prods = products.filter((p) => p.supplierId === s.id)
        const ords = orders.filter((o) => o.supplierId === s.id && o.status !== 'cancelled')
        const spent = ords.reduce((a, o) => a + orderTotal(o), 0)
        const low = prods.filter((p) => p.stock <= p.minStock).length
        return (
          <Card key={s.id} className="group flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-50 text-lg font-semibold text-sky-700">{s.name.charAt(0)}</div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900">{s.name}</h3>
                  <div className="text-xs text-slate-500">{f.num(prods.length)} {t('sup_products')} · {f.num(ords.length)} {t('sup_orders')}</div>
                </div>
              </div>
              <div className="flex gap-0.5 opacity-50 transition group-hover:opacity-100">
                <IconButton onClick={() => onEdit(s)}><Pencil className="size-4" /></IconButton>
                <IconButton onClick={() => remove(s)} className="hover:text-rose-600"><Trash2 className="size-4" /></IconButton>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              {s.contact && <li className="flex items-center gap-2"><User className="size-3.5 text-slate-400" />{s.contact}</li>}
              {s.phone && <li className="flex items-center gap-2"><Phone className="size-3.5 text-slate-400" /><span dir="ltr">{s.phone}</span></li>}
              {s.email && <li className="flex items-center gap-2"><Mail className="size-3.5 text-slate-400" />{s.email}</li>}
              {s.address && <li className="flex items-center gap-2"><MapPin className="size-3.5 text-slate-400" />{s.address}</li>}
            </ul>
            <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-4 mt-5">
              <div className="text-xs text-slate-400">
                {t('sup_spent')}
                <div className="tabular text-sm font-semibold text-slate-800">{f.money(spent)}</div>
              </div>
              <Button size="sm" variant={low ? 'primary' : 'soft'} onClick={() => onOrder(s.id)} icon={<ClipboardList className="size-3.5" />}>
                {t('ord_new')}{low ? ` · ⚠ ${low}` : ''}
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

function OrderList({ onNew }: { onNew: () => void }) {
  const t = useT()
  const f = useFmt()
  const { orders, suppliers } = useStore()
  const [viewing, setViewing] = useState<string | null>(null)
  const supName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? '—'
  const sorted = [...orders].sort((a, b) => (a.status === 'ordered' ? 0 : 1) - (b.status === 'ordered' ? 0 : 1) || b.createdAt - a.createdAt)

  if (!orders.length)
    return (
      <Card>
        <EmptyState icon={<ClipboardList className="size-7" />} title={t('ord_none')} text={t('ord_noneText')} action={<Button onClick={onNew} icon={<Plus className="size-4" />}>{t('ord_new')}</Button>} />
      </Card>
    )

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-slate-100">
        {sorted.map((o) => (
          <li key={o.id}>
            <button onClick={() => setViewing(o.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 text-start hover:bg-slate-50">
              <div className="tabular w-16 text-sm font-semibold text-slate-900">#{o.number}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-slate-800">{supName(o.supplierId)}</div>
                <div className="text-xs text-slate-400">{f.date(o.createdAt)} · {f.num(o.lines.length)} {t('items')}</div>
              </div>
              <div className="tabular text-sm font-semibold text-slate-800">{f.money(orderTotal(o))}</div>
              <StatusBadge s={o.status} />
            </button>
          </li>
        ))}
      </ul>
      <OrderDetail id={viewing} onClose={() => setViewing(null)} />
    </Card>
  )
}

function OrderDetail({ id, onClose }: { id: string | null; onClose: () => void }) {
  const t = useT()
  const f = useFmt()
  const { orders, suppliers, products, receiveOrder, cancelOrder } = useStore()
  const o = orders.find((x) => x.id === id)
  const pName = (pid: string) => products.find((p) => p.id === pid)?.name ?? '—'
  return (
    <Modal
      open={!!o}
      onClose={onClose}
      title={o ? `${t('ord_details')} #${o.number}` : ''}
      footer={
        o?.status === 'ordered' && (
          <>
            <Button variant="ghost" className="me-auto text-rose-600 hover:bg-rose-50" onClick={async () => { if (await confirmDialog(t('ord_cancel') + ' ?')) { cancelOrder(o.id); onClose() } }}>
              {t('ord_cancel')}
            </Button>
            <Button icon={<PackageCheck className="size-4" />} onClick={async () => { if (await confirmDialog(t('ord_receiveConfirm'), false)) { receiveOrder(o.id); toast(t('ord_receivedToast')); onClose() } }}>
              {t('ord_receive')}
            </Button>
          </>
        )
      }
    >
      {o && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <span className="font-medium text-slate-800">{suppliers.find((s) => s.id === o.supplierId)?.name}</span>
            <span className="text-slate-500">{f.date(o.createdAt)}{o.receivedAt ? ` → ${f.date(o.receivedAt)}` : ''}</span>
            <StatusBadge s={o.status} />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="py-2 text-start font-medium">{t('name')}</th>
                <th className="py-2 text-end font-medium">{t('qty')}</th>
                <th className="py-2 text-end font-medium">{t('ord_unitCost')}</th>
                <th className="py-2 text-end font-medium">{t('total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {o.lines.map((l) => (
                <tr key={l.productId}>
                  <td className="py-2.5 text-slate-700">{pName(l.productId)}</td>
                  <td className="tabular py-2.5 text-end">{f.num(l.qty)}</td>
                  <td className="tabular py-2.5 text-end text-slate-500">{f.money(l.unitCost)}</td>
                  <td className="tabular py-2.5 text-end font-medium">{f.money(l.qty * l.unitCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between border-t border-slate-200 pt-3 font-semibold">
            <span>{t('total')}</span>
            <span className="tabular">{f.money(orderTotal(o))}</span>
          </div>
          {o.note && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{o.note}</p>}
        </div>
      )}
    </Modal>
  )
}

function SupplierForm({ open, supplier, onClose }: { open: boolean; supplier?: Supplier; onClose: () => void }) {
  const t = useT()
  const saveSupplier = useStore((s) => s.saveSupplier)
  const blank = { name: '', contact: '', phone: '', email: '', address: '' }
  const [f, setF] = useState(blank)
  useEffect(() => {
    if (open) setF(supplier ? { name: supplier.name, contact: supplier.contact, phone: supplier.phone, email: supplier.email, address: supplier.address } : blank)
  }, [open, supplier])
  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }))
  const submit = () => {
    if (!f.name.trim()) return
    saveSupplier({ id: supplier?.id, ...f, name: f.name.trim() })
    toast(t('saved'))
    onClose()
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={supplier ? t('sup_edit') : t('sup_new')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
          <Button onClick={submit} disabled={!f.name.trim()}>{t('save')}</Button>
        </>
      }
    >
      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <Field label={t('sup_name')} className="sm:col-span-2"><Input autoFocus value={f.name} onChange={set('name')} /></Field>
        <Field label={t('sup_contact')}><Input value={f.contact} onChange={set('contact')} /></Field>
        <Field label={t('sup_phone')}><Input value={f.phone} onChange={set('phone')} dir="ltr" inputMode="tel" /></Field>
        <Field label={t('sup_email')}><Input value={f.email} onChange={set('email')} dir="ltr" type="email" /></Field>
        <Field label={t('sup_address')}><Input value={f.address} onChange={set('address')} /></Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}

function OrderForm({ open, supplierId, onClose, onCreated }: { open: boolean; supplierId?: string; onClose: () => void; onCreated: () => void }) {
  const t = useT()
  const fmt = useFmt()
  const { suppliers, products, createOrder } = useStore()
  const [sup, setSup] = useState('')
  const [lines, setLines] = useState<OrderLine[]>([])
  const [note, setNote] = useState('')
  const [pick, setPick] = useState('')

  const suggestFor = (sid: string) =>
    products
      .filter((p) => p.supplierId === sid && p.stock <= p.minStock)
      .map((p) => ({ productId: p.id, qty: Math.max(p.minStock * 2 - p.stock, 1), unitCost: p.cost }))

  useEffect(() => {
    if (!open) return
    setSup(supplierId ?? '')
    setLines(supplierId ? suggestFor(supplierId) : [])
    setNote('')
    setPick('')
  }, [open, supplierId])

  // Products from this supplier first, then the rest.
  const options = useMemo(
    () => [...products].sort((a, b) => Number(b.supplierId === sup) - Number(a.supplierId === sup) || a.name.localeCompare(b.name)),
    [products, sup],
  )

  const addLine = (pid: string) => {
    const p = products.find((x) => x.id === pid)
    if (!p || lines.some((l) => l.productId === pid)) return
    setLines((ls) => [...ls, { productId: pid, qty: Math.max(p.minStock, 1), unitCost: p.cost }])
    setPick('')
  }
  const update = (pid: string, patch: Partial<OrderLine>) => setLines((ls) => ls.map((l) => (l.productId === pid ? { ...l, ...patch } : l)))

  const total = lines.reduce((a, l) => a + l.qty * l.unitCost, 0)
  const valid = sup && lines.length && lines.every((l) => l.qty > 0)

  const submit = () => {
    if (!sup) return toast(t('ord_pickSupplier'), 'error')
    if (!lines.length) return toast(t('ord_empty'), 'error')
    createOrder(sup, lines.filter((l) => l.qty > 0), note.trim())
    toast(t('saved'))
    onCreated()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t('ord_new')}
      footer={
        <>
          <span className="tabular me-auto self-center text-sm text-slate-500">
            {t('total')} <span className="font-semibold text-slate-900">{fmt.money(total)}</span>
          </span>
          <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
          <Button onClick={submit} disabled={!valid}>{t('save')}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t('ord_supplier')} className="min-w-[220px] flex-1">
            <Select value={sup} onChange={(e) => setSup(e.target.value)}>
              <option value="">{t('ord_pickSupplier')}</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          {sup && suggestFor(sup).some((x) => !lines.some((l) => l.productId === x.productId)) && (
            <Button
              variant="soft"
              icon={<Sparkles className="size-4" />}
              onClick={() => setLines((ls) => [...ls, ...suggestFor(sup).filter((s) => !ls.some((l) => l.productId === s.productId))])}
            >
              {t('ord_suggest')}
            </Button>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          {lines.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">{t('name')}</th>
                  <th className="w-24 px-3 py-2 text-start font-medium">{t('qty')}</th>
                  <th className="w-28 px-3 py-2 text-start font-medium">{t('ord_unitCost')}</th>
                  <th className="w-28 px-3 py-2 text-end font-medium">{t('total')}</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((l) => {
                  const p = products.find((x) => x.id === l.productId)
                  return (
                    <tr key={l.productId}>
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-800">{p?.name}</div>
                        <div className="text-xs text-slate-400">{t('pos_inStock')}: {fmt.num(p?.stock ?? 0)}</div>
                      </td>
                      <td className="px-3 py-2"><Input value={l.qty || ''} onChange={(e) => update(l.productId, { qty: parseInt(e.target.value) || 0 })} inputMode="numeric" className="tabular h-9" /></td>
                      <td className="px-3 py-2"><Input value={l.unitCost} onChange={(e) => update(l.productId, { unitCost: parseFloat(e.target.value.replace(',', '.')) || 0 })} inputMode="decimal" className="tabular h-9" /></td>
                      <td className="tabular px-3 py-2 text-end font-medium">{fmt.money(l.qty * l.unitCost)}</td>
                      <td className="px-1"><IconButton onClick={() => setLines((ls) => ls.filter((x) => x.productId !== l.productId))}><X className="size-4" /></IconButton></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          <div className={cx('flex gap-2 p-3', lines.length > 0 && 'border-t border-slate-100 bg-slate-50/50')}>
            <Select value={pick} onChange={(e) => addLine(e.target.value)}>
              <option value="">{t('ord_pickProduct')}</option>
              {options.filter((p) => !lines.some((l) => l.productId === p.id)).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({fmt.num(p.stock)}){p.supplierId === sup && sup ? ' ★' : ''}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <Field label={t('ord_note')}>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
