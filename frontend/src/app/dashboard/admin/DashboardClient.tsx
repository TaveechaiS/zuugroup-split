'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'
import { Users, Building2, Package, UsersRound, ShoppingCart, AlertTriangle, Clock, UserPlus } from 'lucide-react'

interface Props {
  stats: {
    userCount: number
    customerCount: number
    productCount: number
    teamCount: number
    orderCount: number
    pendingOrderCount: number
    pendingCustomerRequests: number
    lowStockProducts: any[]
    recentOrders: any[]
    monthlyData?: { month: string; orders: number; revenue: number }[]
    statusBreakdown?: { name: string; value: number; color: string }[]
  }
}

export default function AdminDashboardClient({ stats }: Props) {
  const monthlyData = stats.monthlyData ?? []
  const statusBreakdown = stats.statusBreakdown ?? []
  const hasMonthlyData = monthlyData.some((m) => m.orders > 0 || m.revenue > 0)
  const hasStatusData = statusBreakdown.length > 0

  const statCards = [
    { label: 'ผู้ใช้ทั้งหมด', value: stats.userCount, icon: <Users size={20} />, color: 'blue', href: '/dashboard/admin/users' },
    { label: 'ลูกค้า', value: stats.customerCount, icon: <Building2 size={20} />, color: 'green', href: '/dashboard/admin/customers' },
    { label: 'สินค้า', value: stats.productCount, icon: <Package size={20} />, color: 'purple', href: '/dashboard/admin/products' },
    { label: 'ทีมทั้งหมด', value: stats.teamCount, icon: <UsersRound size={20} />, color: 'orange', href: '/dashboard/admin/teams' },
    { label: 'คำสั่งซื้อทั้งหมด', value: stats.orderCount, icon: <ShoppingCart size={20} />, color: 'indigo', href: '/dashboard/admin/orders' },
    { label: 'รอดำเนินการ', value: stats.pendingOrderCount, icon: <Clock size={20} />, color: 'yellow', href: '/dashboard/admin/orders?status=pending_review' },
    { label: 'คำขอเพิ่มลูกค้า', value: stats.pendingCustomerRequests, icon: <UserPlus size={20} />, color: 'pink', href: '/dashboard/admin/customer-requests' },
    { label: 'สินค้าใกล้หมด', value: stats.lowStockProducts.length, icon: <AlertTriangle size={20} />, color: 'red', href: '/dashboard/admin/products?low_stock=true' },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    pink: 'bg-pink-50 text-pink-600',
    red: 'bg-red-50 text-red-600',
  }

  const statusLabel: Record<string, { label: string; color: string }> = {
    draft: { label: 'ร่าง', color: 'bg-gray-100 text-gray-600' },
    pending_review: { label: 'รอตรวจสอบ', color: 'bg-yellow-100 text-yellow-700' },
    processing: { label: 'ดำเนินการ', color: 'bg-blue-100 text-blue-700' },
    completed: { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-700' },
    rejected: { label: 'ไม่ผ่าน', color: 'bg-red-100 text-red-700' },
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <a
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-sm transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[card.color]}`}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </a>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Line Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">ยอดขายรายเดือน (6 เดือนล่าสุด)</h3>
            {!hasMonthlyData && <span className="text-xs text-gray-400">ยังไม่มีคำสั่งซื้อ</span>}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
              <Tooltip formatter={(v: number) => [`฿${v.toLocaleString()}`, 'ยอดขาย']} />
              <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">จำนวนคำสั่งซื้อรายเดือน</h3>
            {!hasMonthlyData && <span className="text-xs text-gray-400">ยังไม่มีคำสั่งซื้อ</span>}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip formatter={(v: number) => [v, 'คำสั่งซื้อ']} />
              <Bar dataKey="orders" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Breakdown */}
      {hasStatusData && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">สถานะคำสั่งซื้อ</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                  {statusBreakdown.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip formatter={(v: number, _n, p: any) => [v, p?.payload?.name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 self-center">
              {statusBreakdown.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                    <span className="text-gray-700">{s.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{s.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">คำสั่งซื้อล่าสุด</h3>
            <a href="/dashboard/admin/orders" className="text-sm text-blue-600 hover:underline">ดูทั้งหมด</a>
          </div>
          <div className="space-y-3">
            {stats.recentOrders.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีคำสั่งซื้อ</p>
            )}
            {stats.recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.order_number}</p>
                  <p className="text-xs text-gray-500">{order.customer?.company_name ?? '-'}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusLabel[order.status]?.color}`}>
                    {statusLabel[order.status]?.label}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">฿{order.total_amount?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">สินค้าใกล้หมด</h3>
            <a href="/dashboard/admin/products?low_stock=true" className="text-sm text-blue-600 hover:underline">ดูทั้งหมด</a>
          </div>
          <div className="space-y-3">
            {stats.lowStockProducts.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">สินค้าทุกชิ้นมีพอ</p>
            )}
            {stats.lowStockProducts.slice(0, 5).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <p className="text-sm text-gray-900">{p.name}</p>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.quantity <= 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.quantity <= 0 ? 'หมด' : `เหลือ ${p.quantity} ${p.unit ?? ''}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
