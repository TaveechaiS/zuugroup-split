'use client'

import { DollarSign, FileText, ShoppingCart, Users } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  stats: { quotationCount: number; orderCount: number; totalSales: number; customerCount: number }
  topProducts: { name: string; quantity: number; sales: number }[]
  topCustomers: { name: string; sales: number }[]
  monthlyData: { month: string; sales: number }[]
  teams: { id: string; name: string }[]
}

export default function CFODashboardClient({ stats, topProducts, topCustomers, monthlyData, teams }: Props) {
  const cards = [
    { label: 'ยอดขายรวม', value: `฿${stats.totalSales.toLocaleString()}`, icon: <DollarSign size={20} />, color: 'bg-green-50 text-green-600' },
    { label: 'คำสั่งซื้อ', value: stats.orderCount, icon: <ShoppingCart size={20} />, color: 'bg-blue-50 text-blue-600' },
    { label: 'ใบเสนอราคา', value: stats.quotationCount, icon: <FileText size={20} />, color: 'bg-purple-50 text-purple-600' },
    { label: 'จำนวนลูกค้า', value: stats.customerCount, icon: <Users size={20} />, color: 'bg-orange-50 text-orange-600' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color} mb-3`}>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly sales */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">ยอดขายรายเดือน</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(v: number) => [`฿${v.toLocaleString()}`, 'ยอดขาย']} />
            <Line type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">สินค้าขายดี Top 5</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(v: number) => [`฿${v.toLocaleString()}`, 'ยอดขาย']} />
              <Bar dataKey="sales" fill="#2563EB" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top customers */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">ลูกค้าที่ซื้อสูงสุด Top 5</h3>
          <div className="space-y-3">
            {topCustomers.map((c, idx) => (
              <div key={c.name} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{c.name}</p>
                </div>
                <p className="font-semibold text-gray-900 text-sm">฿{c.sales.toLocaleString()}</p>
              </div>
            ))}
            {topCustomers.length === 0 && <p className="text-center text-gray-400 text-sm py-6">ยังไม่มีข้อมูล</p>}
          </div>
        </div>
      </div>

      {/* Team performance placeholder */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">ผลงานแต่ละทีม</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {teams.map((t) => (
            <div key={t.id} className="border border-gray-100 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900">{t.name}</p>
              <p className="text-xs text-gray-500 mt-1">ดูรายงานละเอียดในหน้ารายงาน</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
