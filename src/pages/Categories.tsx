import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import type { Category } from '../lib/types'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import { useFmt } from '../lib/useFmt'
import { CATEGORY_COLORS, cx } from '../lib/utils'
import { Button, Card, EmptyState, Field, IconButton, Input, Modal, PageHeader, confirmDialog, toast } from '../components/ui'

export default function Categories() {
  const t = useT()
  const f = useFmt()
  const [params, setParams] = useSearchParams()
  const { categories, products, saveCategory, deleteCategory } = useStore()
  const [editing, setEditing] = useState<Category | null>(null)
  const [open, setOpen] = useState(params.get('new') === '1')
  const [name, setName] = useState('')
  const [color, setColor] = useState(CATEGORY_COLORS[0])

  useEffect(() => {
    if (!open) return
    setName(editing?.name ?? '')
    setColor(editing?.color ?? CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length])
  }, [open, editing])

  const close = () => {
    setOpen(false)
    setEditing(null)
    if (params.get('new')) setParams({}, { replace: true })
  }

  const submit = () => {
    if (!name.trim()) return
    saveCategory({ id: editing?.id, name: name.trim(), color })
    toast(t('saved'))
    close()
  }

  const remove = async (c: Category) => {
    if (!(await confirmDialog(`${t('confirmDelete')} « ${c.name} »`))) return
    if (deleteCategory(c.id)) toast(t('deleted'))
    else toast(t('cat_hasProducts'), 'error')
  }

  return (
    <div>
      <PageHeader
        title={t('cat_title')}
        subtitle={t('cat_subtitle')}
        actions={<Button onClick={() => setOpen(true)} icon={<Plus className="size-4" />}>{t('cat_new')}</Button>}
      />

      {categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Tags className="size-7" />}
            title={t('cat_none')}
            text={t('cat_noneText')}
            action={<Button onClick={() => setOpen(true)} icon={<Plus className="size-4" />}>{t('cat_new')}</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((c) => {
            const list = products.filter((p) => p.categoryId === c.id)
            const units = list.reduce((a, p) => a + p.stock, 0)
            const value = list.reduce((a, p) => a + p.stock * p.cost, 0)
            const low = list.filter((p) => p.stock <= p.minStock).length
            return (
              <Card key={c.id} className="group relative overflow-hidden p-5">
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: c.color }} />
                <div className="flex items-start justify-between">
                  <div className="grid size-11 place-items-center rounded-2xl" style={{ background: `${c.color}18`, color: c.color }}>
                    <Tags className="size-5" />
                  </div>
                  <div className="flex gap-0.5 opacity-50 transition group-hover:opacity-100">
                    <IconButton onClick={() => { setEditing(c); setOpen(true) }}><Pencil className="size-4" /></IconButton>
                    <IconButton onClick={() => remove(c)} className="hover:text-rose-600"><Trash2 className="size-4" /></IconButton>
                  </div>
                </div>
                <h3 className="mt-4 truncate font-semibold text-slate-900">{c.name}</h3>
                <div className="mt-1 text-sm text-slate-500">
                  {f.num(list.length)} {t('cat_products')} · {f.num(units)} {t('cat_units')}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="text-slate-400">
                    {t('cat_value')} <span className="tabular font-medium text-slate-700">{f.money(value)}</span>
                  </span>
                  {low > 0 && <span className="font-medium text-amber-600">⚠ {low}</span>}
                </div>
                <Link to={`/products?cat=${c.id}`} className="mt-3 inline-block text-xs font-medium text-emerald-700 hover:underline">
                  {t('cat_viewProducts')} →
                </Link>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={close}
        title={editing ? t('cat_edit') : t('cat_new')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={close}>{t('cancel')}</Button>
            <Button onClick={submit} disabled={!name.trim()}>{t('save')}</Button>
          </>
        }
      >
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); submit() }}>
          <Field label={t('cat_name')}>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={t('cat_color')}>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((col) => (
                <button
                  type="button"
                  key={col}
                  onClick={() => setColor(col)}
                  className={cx('grid size-9 place-items-center rounded-xl text-white transition', color === col && 'ring-2 ring-offset-2')}
                  style={{ background: col, ['--tw-ring-color' as string]: col }}
                >
                  {color === col && <Check className="size-4" />}
                </button>
              ))}
            </div>
          </Field>
        </form>
      </Modal>
    </div>
  )
}
