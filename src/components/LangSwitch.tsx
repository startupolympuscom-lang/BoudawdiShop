import { useStore } from '../lib/store'
import { cx } from '../lib/utils'

export function LangSwitch({ className }: { className?: string }) {
  const lang = useStore((s) => s.settings.lang)
  const setSettings = useStore((s) => s.setSettings)
  return (
    <div className={cx('inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold', className)}>
      {(['fr', 'ar'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setSettings({ lang: l })}
          className={cx('rounded-lg px-3 py-1.5 transition', lang === l ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
        >
          {l === 'fr' ? 'Français' : 'العربية'}
        </button>
      ))}
    </div>
  )
}
