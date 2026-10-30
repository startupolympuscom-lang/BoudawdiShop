import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { create } from 'zustand'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cx } from '../lib/utils'
import { useT } from '../lib/i18n'

/* ---------- Button ---------- */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'
const variants: Record<Variant, string> = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  soft: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
}

export function Button({
  variant = 'primary', size = 'md', className, icon, children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: ReactNode }) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
        size === 'sm' && 'h-8 px-3 text-sm',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-5 text-base',
        variants[variant],
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

export function IconButton({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={cx('inline-grid place-items-center size-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition disabled:opacity-40', className)}
    />
  )
}

/* ---------- Form ---------- */
export const inputCls =
  'w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cx(inputCls, className)} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cx(inputCls, 'pe-8 cursor-pointer', className)}>
      {children}
    </select>
  )
}

export function Field({ label, error, children, className }: { label: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  )
}

/* ---------- Layout bits ---------- */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04)]', className)}>{children}</div>
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Badge({ tone = 'slate', children }: { tone?: 'slate' | 'green' | 'amber' | 'red' | 'blue'; children: ReactNode }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/10',
    red: 'bg-rose-50 text-rose-700 ring-rose-600/10',
    blue: 'bg-sky-50 text-sky-700 ring-sky-600/10',
  }
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-transparent', tones[tone])}>{children}</span>
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">{icon}</div>
      <h3 className="font-semibold text-slate-800">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ---------- Modal ---------- */
export function Modal({
  open, onClose, title, children, footer, size = 'md',
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-fade" onClick={onClose} />
      <div
        className={cx(
          'relative flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl animate-pop sm:rounded-3xl',
          size === 'sm' && 'sm:max-w-md',
          size === 'md' && 'sm:max-w-xl',
          size === 'lg' && 'sm:max-w-3xl',
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <IconButton onClick={onClose} aria-label="close"><X className="size-5" /></IconButton>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------- Toasts & confirm ---------- */
type Toast = { id: number; text: string; tone: 'success' | 'error' | 'info' }
type ConfirmReq = { text: string; danger?: boolean; resolve: (ok: boolean) => void }

const useFeedback = create<{ toasts: Toast[]; confirm: ConfirmReq | null }>(() => ({ toasts: [], confirm: null }))

export function toast(text: string, tone: Toast['tone'] = 'success') {
  const id = Date.now() + Math.random()
  useFeedback.setState((s) => ({ toasts: [...s.toasts, { id, text, tone }] }))
  setTimeout(() => useFeedback.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2800)
}

export function confirmDialog(text: string, danger = true) {
  return new Promise<boolean>((resolve) => useFeedback.setState({ confirm: { text, danger, resolve } }))
}

export function FeedbackHost() {
  const { toasts, confirm } = useFeedback()
  const t = useT()
  const answer = (ok: boolean) => {
    confirm?.resolve(ok)
    useFeedback.setState({ confirm: null })
  }
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((x) => (
          <div key={x.id} className="pointer-events-auto flex items-center gap-2.5 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl animate-pop">
            {x.tone === 'success' && <CheckCircle2 className="size-4 text-emerald-400" />}
            {x.tone === 'error' && <AlertTriangle className="size-4 text-rose-400" />}
            {x.tone === 'info' && <Info className="size-4 text-sky-400" />}
            {x.text}
          </div>
        ))}
      </div>
      <Modal
        open={!!confirm}
        onClose={() => answer(false)}
        title={t('confirmTitle')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => answer(false)}>{t('cancel')}</Button>
            <Button variant={confirm?.danger ? 'danger' : 'primary'} onClick={() => answer(true)} autoFocus>OK</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">{confirm?.text}</p>
      </Modal>
    </>
  )
}
