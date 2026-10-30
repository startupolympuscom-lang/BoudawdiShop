import { useEffect, useRef, useState } from 'react'
import type { IScannerControls } from '@zxing/browser'
import { CameraOff, ScanBarcode } from 'lucide-react'
import { Button, Input, Modal } from './ui'
import { useT } from '../lib/i18n'

export function BarcodeScanner({ open, onClose, onDetected }: { open: boolean; onClose: () => void; onDetected: (code: string) => void }) {
  const t = useT()
  const video = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState(false)
  const [manual, setManual] = useState('')
  const detected = useRef(onDetected)
  detected.current = onDetected

  useEffect(() => {
    if (!open) return
    setError(false)
    setManual('')
    let controls: IScannerControls | undefined
    let stopped = false
    import('@zxing/browser')
      .then(({ BrowserMultiFormatReader }) =>
        new BrowserMultiFormatReader().decodeFromConstraints({ video: { facingMode: 'environment' } }, video.current!, (result, _err, c) => {
          if (result && !stopped) {
            stopped = true
            c.stop()
            navigator.vibrate?.(80)
            detected.current(result.getText())
          }
        }),
      )
      .then((c) => {
        controls = c
        if (stopped) c.stop()
      })
      .catch(() => setError(true))
    return () => {
      stopped = true
      controls?.stop()
    }
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title={t('scan_title')} size="sm">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900">
        <video ref={video} className="size-full object-cover" muted playsInline />
        {!error && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="relative h-28 w-4/5 rounded-xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(15,23,42,.45)]">
              <div className="absolute inset-x-3 top-1/2 h-0.5 bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,.8)] animate-scan" />
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-slate-200">
            <CameraOff className="size-8 text-slate-400" />
            {t('scan_error')}
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">{t('scan_hint')}</p>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (manual.trim()) onDetected(manual.trim())
        }}
      >
        <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder={t('scan_manual')} inputMode="numeric" dir="ltr" />
        <Button type="submit" icon={<ScanBarcode className="size-4" />}>OK</Button>
      </form>
    </Modal>
  )
}
