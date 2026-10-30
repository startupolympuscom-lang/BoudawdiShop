import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Category, OrderLine, PaymentMethod, Product, PurchaseOrder, Sale, Settings, Supplier } from './types'
import { uid } from './utils'
import { buildDemo } from './demo'

export interface Data {
  categories: Category[]
  products: Product[]
  suppliers: Supplier[]
  orders: PurchaseOrder[]
  sales: Sale[]
  settings: Settings
}

export interface CartLine {
  productId: string
  qty: number
}

interface Actions {
  setSettings: (s: Partial<Settings>) => void

  saveCategory: (c: Omit<Category, 'id' | 'createdAt'> & { id?: string }) => Category
  deleteCategory: (id: string) => boolean

  saveProduct: (p: Omit<Product, 'id' | 'createdAt'> & { id?: string }) => Product
  deleteProduct: (id: string) => void
  adjustStock: (id: string, delta: number) => void

  saveSupplier: (s: Omit<Supplier, 'id' | 'createdAt'> & { id?: string }) => Supplier
  deleteSupplier: (id: string) => boolean

  createOrder: (supplierId: string, lines: OrderLine[], note: string) => PurchaseOrder
  receiveOrder: (id: string) => void
  cancelOrder: (id: string) => void

  checkout: (cart: CartLine[], payment: PaymentMethod, cashGiven?: number) => Sale
  voidSale: (id: string) => void

  loadDemo: () => void
  resetAll: () => void
  importData: (d: Data) => void
}

const empty = (lang: Settings['lang'] = 'fr'): Data => ({
  categories: [],
  products: [],
  suppliers: [],
  orders: [],
  sales: [],
  settings: { shopName: 'Boudawdi Shop', currency: 'DH', lang },
})

const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]

export const useStore = create<Data & Actions>()(
  persist(
    (set, get) => ({
      ...empty(),

      setSettings: (s) => set({ settings: { ...get().settings, ...s } }),

      saveCategory: (c) => {
        const prev = c.id ? get().categories.find((x) => x.id === c.id) : undefined
        const cat: Category = { createdAt: Date.now(), ...prev, ...c, id: c.id ?? uid() }
        set({ categories: upsert(get().categories, cat) })
        return cat
      },
      deleteCategory: (id) => {
        if (get().products.some((p) => p.categoryId === id)) return false
        set({ categories: get().categories.filter((c) => c.id !== id) })
        return true
      },

      saveProduct: (p) => {
        const prev = p.id ? get().products.find((x) => x.id === p.id) : undefined
        const prod: Product = { createdAt: Date.now(), ...prev, ...p, id: p.id ?? uid() }
        set({ products: upsert(get().products, prod) })
        return prod
      },
      deleteProduct: (id) => set({ products: get().products.filter((p) => p.id !== id) }),
      adjustStock: (id, delta) =>
        set({
          products: get().products.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p)),
        }),

      saveSupplier: (s) => {
        const prev = s.id ? get().suppliers.find((x) => x.id === s.id) : undefined
        const sup: Supplier = { createdAt: Date.now(), ...prev, ...s, id: s.id ?? uid() }
        set({ suppliers: upsert(get().suppliers, sup) })
        return sup
      },
      deleteSupplier: (id) => {
        if (get().orders.some((o) => o.supplierId === id)) return false
        set({
          suppliers: get().suppliers.filter((s) => s.id !== id),
          products: get().products.map((p) => (p.supplierId === id ? { ...p, supplierId: undefined } : p)),
        })
        return true
      },

      createOrder: (supplierId, lines, note) => {
        const number = get().orders.reduce((m, o) => Math.max(m, o.number), 1000) + 1
        const order: PurchaseOrder = { id: uid(), number, supplierId, lines, note, status: 'ordered', createdAt: Date.now() }
        set({ orders: [order, ...get().orders] })
        return order
      },
      receiveOrder: (id) => {
        const order = get().orders.find((o) => o.id === id)
        if (!order || order.status !== 'ordered') return
        const byProduct = new Map(order.lines.map((l) => [l.productId, l]))
        set({
          orders: get().orders.map((o) => (o.id === id ? { ...o, status: 'received', receivedAt: Date.now() } : o)),
          products: get().products.map((p) => {
            const l = byProduct.get(p.id)
            return l ? { ...p, stock: p.stock + l.qty, cost: l.unitCost || p.cost, supplierId: p.supplierId ?? order.supplierId } : p
          }),
        })
      },
      cancelOrder: (id) =>
        set({ orders: get().orders.map((o) => (o.id === id && o.status === 'ordered' ? { ...o, status: 'cancelled' } : o)) }),

      checkout: (cart, payment, cashGiven) => {
        const { products, sales } = get()
        const lines = cart
          .map((c) => {
            const p = products.find((x) => x.id === c.productId)
            return p ? { productId: p.id, name: p.name, price: p.price, cost: p.cost, qty: c.qty } : null
          })
          .filter((l): l is NonNullable<typeof l> => !!l && l.qty > 0)
        const total = Math.round(lines.reduce((a, l) => a + l.price * l.qty, 0) * 100) / 100
        const number = sales.reduce((m, s) => Math.max(m, s.number), 0) + 1
        const sale: Sale = { id: uid(), number, lines, total, payment, cashGiven, createdAt: Date.now() }
        const qtyById = new Map(lines.map((l) => [l.productId, l.qty]))
        set({
          sales: [...sales, sale],
          products: products.map((p) => (qtyById.has(p.id) ? { ...p, stock: Math.max(0, p.stock - qtyById.get(p.id)!) } : p)),
        })
        return sale
      },
      voidSale: (id) => {
        const sale = get().sales.find((s) => s.id === id)
        if (!sale || sale.voided) return
        const qtyById = new Map(sale.lines.map((l) => [l.productId, l.qty]))
        set({
          sales: get().sales.map((s) => (s.id === id ? { ...s, voided: true } : s)),
          products: get().products.map((p) => (qtyById.has(p.id) ? { ...p, stock: p.stock + qtyById.get(p.id)! } : p)),
        })
      },

      loadDemo: () => {
        const { settings } = get()
        set({ ...buildDemo(settings.lang), settings })
      },
      resetAll: () => set({ ...empty(get().settings.lang), settings: get().settings }),
      importData: (d) => set({ ...empty(), ...d }),
    }),
    {
      name: 'boudawdi-shop-v1',
      partialize: (s) => ({
        categories: s.categories,
        products: s.products,
        suppliers: s.suppliers,
        orders: s.orders,
        sales: s.sales,
        settings: s.settings,
      }),
    },
  ),
)
