'use client'

import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS = ['#2563EB', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

interface Props {
  orders: any[]
  products: any[]
  customers: any[]
  orderItems: any[]
}

export default function AdminReportsClient({ orders, products, customers, orderItems }: Props) {
  const [tab, setTab] = useState<'orders' | 'completed' | 'customers' | 'products' | 'stock'>('orders')

  const ordersByStatus = useMemo(() => {
    const map: Record<string, number> = {}
    orders.forEach((o) => { map[o.status] = (map[o.status] ?? 0) + 1 })
    const labels: Record<string, string> = {
      pending_review: 'รอตรวจสอบ', processing: 'กำลังดำเนินการ',
      completed: 'สำเร็จ', cancelled: 'ยกเลิก', rejected: 'ไม่ผ่าน',
    }
    return Object.entries(map).map(([k, v]) => ({ name: labels[k] ?? k, value: v }))
  }, [orders])

  const completed = useMemo(() => orders.filter((o) => o.status === 'completed'), [orders])

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; sales: number }>()
    orderItems.forEach((item) => {
      const name = item.product?.name ?? '-'
      const prev = map.get(name) ?? { name, quantity: 0, sales: 0 }
      map.set(name, {
        name,
        quantity: prev.quantity + (item.quantity ?? 0),
        sales: prev.sales + (item.total_price ?? 0),
      })
    })
    return Array.from(map.values()).sort((a, b) => b.sales - a.sales).slice(0, 10)
  }, [orderItems])

  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; orderCount: number; sales: number }>()
    completed.forEach((o) => {
      const name = o.customer?.company_name ?? '-'
      const prev = map.get(name) ?? { name, orderCount: 0, sales: 0 }
      map.set(name, { name, orderCount: prev.orderCount + 1, sales: prev.sales + (o.total_amount ?? 0) })
    })
    return Array.from(map.values()).sort((a, b) => b.sales - a.sales).slice(0, 10)
  }, [completed])

  const lowStock = useMemo(() => products.filter((p) => p.quantity < 10).sort((a, b) => a.quantity - b.quantity), [products])

  return (
    <div className="p-4 sm:p-6">
      <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-5 w-fit overflow-x-auto">
        {[
          { id: 'orders' as const, label: 'รายงานคำสั่งซื้อ' },
          { id: 'completed' as const, label: 'คำสั่งซื้อสำเร็จ' },
          { id: 'customers' as const, label: 'ลูกค้า' },
          { id: 'products' as const, label: 'สินค้า' },
          { id: 'stock' as const, label: 'สต๊อกต่ำ' },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${tab === t.id ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">สัดส่วนคำสั่งซื้อตามสถานะ</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={ordersByStatus} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.name}: ${entry.value}`} outerRadius={100} dataKey="value">
                  {ordersByStatus.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">สรุปจำนวนตามสถานะ</h3>
            <div className="space-y-2.5">
              {ordersByStatus.map((s, idx) => (
                <div key={s.name} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                    <span className="text-sm text-gray-700">{s.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'completed' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <p className="text-sm text-gray-500">คำสั่งซื้อสำเร็จทั้งหมด <strong className="text-gray-900">{completed.length}</strong> รายการ
              <span className="ml-3">รวมยอด <strong className="text-gray-900">฿{completed.reduce((s, o) => s + (o.total_amount ?? 0), 0).toLocaleString()}</strong></span>
            </p>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">เลขที่</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">ลูกค้า</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">ยอด</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">วันที่</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {completed.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-600">{o.order_number}</td>
                  <td className="px-5 py-3 text-gray-900">{o.customer?.company_name}</td>
                  <td className="px-5 py-3 text-right text-gray-900 font-medium">฿{o.total_amount?.toLocaleString()}</td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                    <div>{new Date(o.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    <div className="text-xs text-gray-400">{new Date(o.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      {tab === 'customers' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">ลูกค้า Top 10 (ซื้อสูงสุด)</h3>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">อันดับ</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">ลูกค้า</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">จำนวนครั้ง</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">ยอดรวม</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {topCustomers.map((c, idx) => (
                <tr key={c.name} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-bold text-gray-900">{idx + 1}</td>
                  <td className="px-5 py-3 text-gray-900">{c.name}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{c.orderCount}</td>
                  <td className="px-5 py-3 text-right text-gray-900 font-medium">฿{c.sales.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      {tab === 'products' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">สินค้าขายดี Top 10</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={(v: number) => [`฿${v.toLocaleString()}`, 'ยอดขาย']} />
              <Bar dataKey="sales" fill="#2563EB" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'stock' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">สินค้าสต๊อกต่ำ (น้อยกว่า 10)</h3>
            <p className="text-sm text-gray-500 mt-1">{lowStock.length} รายการ</p>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">สินค้า</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">คงเหลือ</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">หน่วย</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">ราคา</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {lowStock.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-900 font-medium">{p.name}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${p.quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.quantity}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{p.unit ?? '-'}</td>
                  <td className="px-5 py-3 text-right text-gray-900">฿{p.price_per_unit?.toLocaleString()}</td>
                </tr>
              ))}
              {lowStock.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-gray-400">ไม่มีสินค้าสต๊อกต่ำ</td></tr>}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  )
}
