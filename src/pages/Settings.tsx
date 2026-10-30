import { useRef } from 'react'
import { Database, Download, RotateCcw, Sparkles, Store, Upload } from 'lucide-react'
import { useStore, type Data } from '../lib/store'
import { useT } from '../lib/i18n'
import { Button, Card, Field, Input, PageHeader, confirmDialog, toast } from '../components/ui'
import { LangSwitch } from '../components/LangSwitch'

export default function Settings() {
  const t = useT()
  const store = useStore()
  const { settings, setSettings } = store
  const file = useRef<HTMLInputElement>(null)

  const exportData = () => {
    const { categories, products, suppliers, orders, sales } = useStore.getState()
    const data: Data = { categories, products, suppliers, orders, sales, settings }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `boudawdi-shop-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importData = async (f?: File) => {
    if (!f) return
    try {
      const d = JSON.parse(await f.text()) as Data
      if (!Array.isArray(d.products) || !Array.isArray(d.categories)) throw new Error()
      store.importData(d)
      toast(t('set_imported'))
    } catch {
      toast(t('set_importError'), 'error')
    }
    if (file.current) file.current.value = ''
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title={t('set_title')} subtitle={t('set_subtitle')} />

      <Card className="p-6">
        <h2 className="mb-5 flex items-center gap-2 font-semibold text-slate-900"><Store className="size-5 text-emerald-600" />{t('set_shop')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('set_shopName')}>
            <Input value={settings.shopName} onChange={(e) => setSettings({ shopName: e.target.value })} />
          </Field>
          <Field label={t('set_currency')}>
            <Input value={settings.currency} onChange={(e) => setSettings({ currency: e.target.value })} placeholder="DH" />
          </Field>
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">{t('set_language')}</span>
            <LangSwitch />
          </div>
        </div>
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><Database className="size-5 text-emerald-600" />{t('set_data')}</h2>
        <p className="mb-5 text-sm text-slate-500">{t('set_dataText')}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="soft"
            icon={<Sparkles className="size-4" />}
            onClick={async () => {
              if (await confirmDialog(t('set_loadDemoConfirm'), false)) {
                store.loadDemo()
                toast(t('set_demoLoaded'))
              }
            }}
          >
            {t('set_loadDemo')}
          </Button>
          <Button variant="secondary" icon={<Download className="size-4" />} onClick={exportData}>{t('set_export')}</Button>
          <Button variant="secondary" icon={<Upload className="size-4" />} onClick={() => file.current?.click()}>{t('set_import')}</Button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => importData(e.target.files?.[0])} />
          <Button
            variant="ghost"
            className="text-rose-600 hover:bg-rose-50"
            icon={<RotateCcw className="size-4" />}
            onClick={async () => {
              if (await confirmDialog(t('set_resetConfirm'))) {
                store.resetAll()
                toast(t('set_cleared'))
              }
            }}
          >
            {t('set_reset')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
