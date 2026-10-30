export type Lang = 'fr' | 'ar'

export interface Category {
  id: string
  name: string
  color: string
  createdAt: number
}

export interface Product {
  id: string
  name: string
  categoryId: string
  barcode: string
  price: number
  cost: number
  stock: number
  minStock: number
  supplierId?: string
  createdAt: number
}

export interface Supplier {
  id: string
  name: string
  contact: string
  phone: string
  email: string
  address: string
  createdAt: number
}

export interface OrderLine {
  productId: string
  qty: number
  unitCost: number
}

export type OrderStatus = 'ordered' | 'received' | 'cancelled'

export interface PurchaseOrder {
  id: string
  number: number
  supplierId: string
  lines: OrderLine[]
  status: OrderStatus
  note: string
  createdAt: number
  receivedAt?: number
}

export interface SaleLine {
  productId: string
  name: string
  price: number
  cost: number
  qty: number
}

export type PaymentMethod = 'cash' | 'card'

export interface Sale {
  id: string
  number: number
  lines: SaleLine[]
  total: number
  payment: PaymentMethod
  cashGiven?: number
  createdAt: number
  voided?: boolean
}

export interface Settings {
  shopName: string
  currency: string
  lang: Lang
}
