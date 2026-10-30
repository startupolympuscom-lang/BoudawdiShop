import { useState } from 'react'
import { useFmt } from '../lib/useFmt'
import { cx } from '../lib/utils'

export interface Point {
  ts: number
  value: number
  count: number
}

export function RevenueChart({ data }: { data: Point[] }) {
  const f = useFmt()
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.value))
  const nice = niceMax(max)
  const dense = data.length > 14
  const active = hover ?? data.length - 1
  const a = data[active]

  return (
    <div>
      <div className="mb-4 flex items-baseline gap-3">
        <span className="tabular text-2xl font-semibold text-slate-900">{f.money(a?.value ?? 0)}</span>
        <span className="text-sm text-slate-500">
          {a && f.date(a.ts, { weekday: 'short', day: 'numeric', month: 'short' })} · {f.num(a?.count ?? 0)} 🧾
        </span>
      </div>
      <div className="relative flex h-52 gap-2">
        <div className="tabular flex flex-col justify-between pb-6 text-end text-[11px] text-slate-400" dir="ltr">
          {[nice, nice / 2, 0].map((v) => (
            <span key={v}>{f.num(Math.round(v))}</span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-t border-dashed border-slate-200" />
            ))}
          </div>
          <div className={cx('absolute inset-x-0 top-0 bottom-0 flex items-end', dense ? 'gap-1' : 'gap-2 sm:gap-3')} onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => (
              <div key={d.ts} className="group flex h-full flex-1 cursor-pointer flex-col items-center justify-end" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
                <div className="flex w-full flex-1 items-end pb-0">
                  <div
                    className={cx(
                      'w-full rounded-t-md transition-all duration-300',
                      i === active ? 'bg-emerald-500' : 'bg-emerald-200 group-hover:bg-emerald-300',
                    )}
                    style={{ height: `${(d.value / nice) * 100}%`, minHeight: d.value > 0 ? 3 : 0 }}
                  />
                </div>
                <div className={cx('h-6 pt-1.5 text-[10px] text-slate-400', dense && i % 5 !== 4 && i !== data.length - 1 && 'invisible')}>
                  {f.date(d.ts, dense ? { day: 'numeric' } : { weekday: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function niceMax(v: number) {
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}
