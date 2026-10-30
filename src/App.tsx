import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BarChart3, LayoutDashboard, Menu, Package, Settings as SettingsIcon, ShoppingCart, Tags, Truck, X } from 'lucide-react'
import { useStore } from './lib/store'
import { useT, type TKey } from './lib/i18n'
import { cx } from './lib/utils'
import { FeedbackHost } from './components/ui'
import { LangSwitch } from './components/LangSwitch'
import Dashboard from './pages/Dashboard'
import Pos from './pages/Pos'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Suppliers from './pages/Suppliers'
import Sales from './pages/Sales'
import Settings from './pages/Settings'

const NAV: { to: string; key: TKey; icon: typeof LayoutDashboard }[] = [
  { to: '/', key: 'nav_dashboard', icon: LayoutDashboard },
  { to: '/pos', key: 'nav_pos', icon: ShoppingCart },
  { to: '/products', key: 'nav_products', icon: Package },
  { to: '/categories', key: 'nav_categories', icon: Tags },
  { to: '/suppliers', key: 'nav_suppliers', icon: Truck },
  { to: '/sales', key: 'nav_sales', icon: BarChart3 },
  { to: '/settings', key: 'nav_settings', icon: SettingsIcon },
]

function Brand() {
  const t = useT()
  const shopName = useStore((s) => s.settings.shopName)
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/25">
        <ShoppingCart className="size-5" />
      </div>
      <div className="min-w-0">
        <div className="truncate font-semibold text-slate-900">{shopName}</div>
        <div className="truncate text-xs text-slate-500">{t('appTagline')}</div>
      </div>
    </div>
  )
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT()
  const lowCount = useStore((s) => s.products.filter((p) => p.stock <= p.minStock).length)
  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <Brand />
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )
            }
          >
            <Icon className="size-[18px]" />
            <span className="flex-1">{t(key)}</span>
            {to === '/products' && lowCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">{lowCount}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-3">
        <LangSwitch className="w-full [&>button]:flex-1" />
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span className="size-1.5 rounded-full bg-amber-500" />
          {t('demoMode')}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const lang = useStore((s) => s.settings.lang)
  const shopName = useStore((s) => s.settings.shopName)
  const [drawer, setDrawer] = useState(false)
  const location = useLocation()
  const isPos = location.pathname === '/pos'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  useEffect(() => {
    document.title = shopName
  }, [shopName])

  return (
    <div className="min-h-screen lg:flex">
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 border-e border-slate-200/80 bg-white lg:block">
        <Sidebar />
      </aside>

      {/* Mobile top bar */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <button onClick={() => setDrawer(true)} className="grid size-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100">
          <Menu className="size-5" />
        </button>
      </header>
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 animate-fade" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 start-0 w-72 bg-white shadow-2xl animate-fade">
            <button onClick={() => setDrawer(false)} className="absolute end-3 top-3 grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
              <X className="size-5" />
            </button>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <main className={cx('min-w-0 flex-1', isPos ? 'p-3 sm:p-4 lg:p-5' : 'p-4 sm:p-6 lg:p-8')}>
        <div className={cx('mx-auto', !isPos && 'max-w-7xl')}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<Pos />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <FeedbackHost />
    </div>
  )
}
