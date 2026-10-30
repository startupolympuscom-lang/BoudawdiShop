import type { Category, Lang, Product, PurchaseOrder, Sale, Supplier } from './types'
import { CATEGORY_COLORS, DAY, generateEan13, startOfDay, uid } from './utils'
import type { Data } from './store'

type L = [fr: string, ar: string]

const CATS: L[] = [
  ['Produits laitiers', 'مشتقات الحليب'],
  ['Épicerie', 'البقالة'],
  ['Boissons', 'المشروبات'],
  ['Fruits & légumes', 'الفواكه والخضر'],
  ['Boulangerie', 'المخبزة'],
  ['Hygiène & beauté', 'النظافة والتجميل'],
  ['Entretien', 'مواد التنظيف'],
  ['Snacks & confiserie', 'الوجبات الخفيفة والحلويات'],
]

const SUPPLIERS: { name: L; contact: string; phone: string }[] = [
  { name: ['Laiterie Atlas', 'ملبنة الأطلس'], contact: 'Youssef A.', phone: '+212 6 12 34 56 78' },
  { name: ['Distribution Nour', 'توزيع النور'], contact: 'Salma B.', phone: '+212 6 23 45 67 89' },
  { name: ['Boissons du Sud', 'مشروبات الجنوب'], contact: 'Karim E.', phone: '+212 6 34 56 78 90' },
  { name: ['Hygiène Plus', 'هيجين بلوس'], contact: 'Nadia F.', phone: '+212 6 45 67 89 01' },
  { name: ['Primeurs Souss', 'خضر وفواكه سوس'], contact: 'Hassan O.', phone: '+212 6 56 78 90 12' },
]

// [name, category index, supplier index, price, cost, stock, minStock]
const PRODUCTS: [L, number, number, number, number, number, number][] = [
  [['Lait entier 1L', 'حليب كامل 1ل'], 0, 0, 7, 5.6, 48, 20],
  [['Lben 1L', 'لبن 1ل'], 0, 0, 7.5, 6, 30, 12],
  [['Yaourt nature x4', 'زبادي طبيعي ×4'], 0, 0, 10, 7.8, 25, 10],
  [['Beurre 250g', 'زبدة 250غ'], 0, 0, 22, 17.5, 14, 6],
  [['Fromage en portions x16', 'جبن مثلثات ×16'], 0, 0, 26, 20, 6, 8],
  [['Œufs x12', 'بيض ×12'], 0, 1, 18, 14, 22, 10],
  [['Huile de table 1L', 'زيت المائدة 1ل'], 1, 1, 21, 17, 35, 10],
  [['Sucre en morceaux 1kg', 'سكر قوالب 1كغ'], 1, 1, 9, 7.2, 40, 15],
  [['Farine 5kg', 'دقيق 5كغ'], 1, 1, 38, 31, 12, 5],
  [['Thé vert 200g', 'شاي أخضر 200غ'], 1, 1, 16, 12, 28, 10],
  [['Pâtes spaghetti 500g', 'معكرونة سباغيتي 500غ'], 1, 1, 6.5, 4.8, 50, 15],
  [['Riz 1kg', 'أرز 1كغ'], 1, 1, 14, 10.5, 3, 8],
  [['Concentré de tomate 400g', 'مركز الطماطم 400غ'], 1, 1, 8, 6, 33, 10],
  [['Eau minérale 1,5L', 'ماء معدني 1.5ل'], 2, 2, 6, 4.2, 96, 30],
  [['Soda cola 1L', 'مشروب غازي كولا 1ل'], 2, 2, 10, 7.5, 40, 15],
  [['Jus d’orange 1L', 'عصير برتقال 1ل'], 2, 2, 14, 10, 18, 8],
  [['Café moulu 250g', 'قهوة مطحونة 250غ'], 2, 1, 32, 25, 9, 6],
  [['Tomates (kg)', 'طماطم (كغ)'], 3, 4, 6, 4, 40, 15],
  [['Pommes de terre (kg)', 'بطاطس (كغ)'], 3, 4, 5, 3.2, 55, 20],
  [['Oignons (kg)', 'بصل (كغ)'], 3, 4, 4.5, 3, 4, 15],
  [['Bananes (kg)', 'موز (كغ)'], 3, 4, 15, 11, 20, 8],
  [['Pain rond', 'خبز دائري'], 4, 1, 1.5, 1, 60, 30],
  [['Msemen', 'مسمن'], 4, 1, 3, 1.8, 25, 10],
  [['Savon de Marseille', 'صابون مرسيليا'], 5, 3, 8, 5.5, 30, 10],
  [['Shampooing 400ml', 'شامبو 400مل'], 5, 3, 29, 22, 12, 6],
  [['Dentifrice 75ml', 'معجون أسنان 75مل'], 5, 3, 15, 11, 2, 6],
  [['Javel 1L', 'جافيل 1ل'], 6, 3, 9, 6.5, 26, 10],
  [['Liquide vaisselle 750ml', 'سائل غسل الأواني 750مل'], 6, 3, 14, 10.5, 18, 8],
  [['Lessive en poudre 1kg', 'مسحوق الغسيل 1كغ'], 6, 3, 27, 21, 15, 6],
  [['Papier toilette x6', 'ورق صحي ×6'], 6, 3, 19, 14.5, 7, 8],
  [['Biscuits chocolat', 'بسكويت بالشوكولاتة'], 7, 1, 5, 3.5, 45, 15],
  [['Chips 100g', 'رقائق البطاطس 100غ'], 7, 1, 6, 4.2, 38, 15],
  [['Tablette de chocolat', 'لوح شوكولاتة'], 7, 1, 12, 8.5, 0, 6],
]

export function buildDemo(lang: Lang): Omit<Data, 'settings'> {
  const i = lang === 'ar' ? 1 : 0
  const now = Date.now()

  const categories: Category[] = CATS.map((c, k) => ({
    id: uid(), name: c[i], color: CATEGORY_COLORS[k % CATEGORY_COLORS.length], createdAt: now - 40 * DAY,
  }))

  const suppliers: Supplier[] = SUPPLIERS.map((s) => ({
    id: uid(), name: s.name[i], contact: s.contact, phone: s.phone,
    email: '', address: lang === 'ar' ? 'الدار البيضاء' : 'Casablanca', createdAt: now - 40 * DAY,
  }))

  const products: Product[] = PRODUCTS.map(([name, c, s, price, cost, stock, minStock]) => ({
    id: uid(), name: name[i], categoryId: categories[c].id, supplierId: suppliers[s].id,
    barcode: generateEan13(), price, cost, stock, minStock, createdAt: now - 40 * DAY,
  }))

  // ~30 days of sales history (historical: does not touch current stock)
  const sales: Sale[] = []
  const today = startOfDay(now)
  let n = 0
  for (let d = 29; d >= 0; d--) {
    const day = today - d * DAY
    const weekday = new Date(day).getDay()
    const base = weekday === 5 || weekday === 6 ? 34 : 24
    let count = base + Math.floor(Math.random() * 12)
    const lastHour = d === 0 ? new Date(now).getHours() : 22
    if (d === 0) count = Math.round((count * Math.max(0, lastHour - 8)) / 14)
    for (let k = 0; k < count; k++) {
      const hour = 8 + Math.random() * Math.max(1, lastHour - 8)
      const ts = day + hour * 3_600_000
      if (ts > now) continue
      const nLines = 1 + Math.floor(Math.random() * 5)
      const picked = new Set<number>()
      while (picked.size < nLines) picked.add(Math.floor(Math.random() * products.length))
      const lines = [...picked].map((idx) => {
        const p = products[idx]
        return { productId: p.id, name: p.name, price: p.price, cost: p.cost, qty: 1 + Math.floor(Math.random() * 3) }
      })
      const total = Math.round(lines.reduce((a, l) => a + l.price * l.qty, 0) * 100) / 100
      const card = Math.random() < 0.25
      sales.push({
        id: uid(), number: ++n, lines, total, createdAt: ts,
        payment: card ? 'card' : 'cash',
        cashGiven: card ? undefined : Math.ceil(total / 10) * 10,
      })
    }
  }
  sales.sort((a, b) => a.createdAt - b.createdAt)
  sales.forEach((s, k) => (s.number = k + 1))

  const line = (pi: number, qty: number) => ({ productId: products[pi].id, qty, unitCost: products[pi].cost })
  const orders: PurchaseOrder[] = [
    { id: uid(), number: 1001, supplierId: suppliers[0].id, lines: [line(0, 48), line(1, 24), line(3, 12)], status: 'received', note: '', createdAt: now - 12 * DAY, receivedAt: now - 11 * DAY },
    { id: uid(), number: 1002, supplierId: suppliers[2].id, lines: [line(13, 96), line(14, 48)], status: 'received', note: '', createdAt: now - 6 * DAY, receivedAt: now - 5 * DAY },
    { id: uid(), number: 1003, supplierId: suppliers[3].id, lines: [line(25, 24), line(29, 20)], status: 'ordered', note: '', createdAt: now - 1 * DAY },
    { id: uid(), number: 1004, supplierId: suppliers[1].id, lines: [line(11, 30), line(32, 24), line(16, 12)], status: 'ordered', note: '', createdAt: now - 2 * 3_600_000 },
  ]

  return { categories, products, suppliers, orders, sales }
}
