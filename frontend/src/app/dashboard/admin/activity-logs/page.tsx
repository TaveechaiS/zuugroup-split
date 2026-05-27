'use client'

import { useEffect, useMemo, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import { Search } from 'lucide-react'
import { activityLogsApi } from '@/lib/api/services'

const ROLE_LABELS: Record<string, string> = { admin: 'ผู้ดูแล', manager: 'ผู้จัดการ', sales: 'พนักงานขาย', cfo: 'ผู้บริหาร' }

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login:                       { label: 'เข้าสู่ระบบ',           color: 'bg-blue-50 text-blue-700' },
  logout:                      { label: 'ออกจากระบบ',           color: 'bg-gray-100 text-gray-600' },
  'user.create':               { label: 'สร้างผู้ใช้',           color: 'bg-emerald-50 text-emerald-700' },
  'user.update':               { label: 'แก้ไขผู้ใช้',           color: 'bg-yellow-50 text-yellow-700' },
  'user.update+password':      { label: 'แก้ไขผู้ใช้ + รหัสผ่าน', color: 'bg-yellow-50 text-yellow-700' },
  'user.deactivate':           { label: 'ปิดผู้ใช้',             color: 'bg-red-50 text-red-700' },
  'team.create':               { label: 'สร้างทีม',              color: 'bg-emerald-50 text-emerald-700' },
  'team.update':               { label: 'แก้ไขทีม',              color: 'bg-yellow-50 text-yellow-700' },
  'team.delete':               { label: 'ลบทีม',                color: 'bg-red-50 text-red-700' },
  'product.create':            { label: 'สร้างสินค้า',           color: 'bg-emerald-50 text-emerald-700' },
  'product.update':            { label: 'แก้ไขสินค้า',           color: 'bg-yellow-50 text-yellow-700' },
  'product.delete':            { label: 'ลบสินค้า',              color: 'bg-red-50 text-red-700' },
  'customer.create':           { label: 'เพิ่มลูกค้า',           color: 'bg-emerald-50 text-emerald-700' },
  'customer.update':           { label: 'แก้ไขลูกค้า',           color: 'bg-yellow-50 text-yellow-700' },
  'customer.delete':           { label: 'ลบลูกค้า',              color: 'bg-red-50 text-red-700' },
  'customer_request.create':   { label: 'ส่งคำขอลูกค้า',         color: 'bg-blue-50 text-blue-700' },
  'customer_request.approve':  { label: 'อนุมัติคำขอลูกค้า',      color: 'bg-green-50 text-green-700' },
  'customer_request.reject':   { label: 'ปฏิเสธคำขอลูกค้า',       color: 'bg-red-50 text-red-700' },
  'quotation.create.draft':    { label: 'สร้างใบเสนอราคา (ร่าง)', color: 'bg-gray-100 text-gray-700' },
  'quotation.create.pending':  { label: 'สร้างใบเสนอราคา',        color: 'bg-blue-50 text-blue-700' },
  'quotation.create.approved': { label: 'สร้างใบเสนอราคา',        color: 'bg-blue-50 text-blue-700' },
  'quotation.create+auto_approve': { label: 'สร้าง+อนุมัติอัตโนมัติ', color: 'bg-green-50 text-green-700' },
  'quotation.update':          { label: 'แก้ไขใบเสนอราคา',        color: 'bg-yellow-50 text-yellow-700' },
  'quotation.approve':         { label: 'อนุมัติใบเสนอราคา',      color: 'bg-green-50 text-green-700' },
  'quotation.reject':          { label: 'ปฏิเสธใบเสนอราคา',       color: 'bg-red-50 text-red-700' },
  'order.create':              { label: 'สร้างคำสั่งซื้อ',         color: 'bg-blue-50 text-blue-700' },
  'order.create+auto_approve': { label: 'สร้าง+อนุมัติอัตโนมัติ',  color: 'bg-green-50 text-green-700' },
  'order.review_pass':         { label: 'ตรวจสอบผ่าน',            color: 'bg-green-50 text-green-700' },
  'order.review_reject':       { label: 'ตรวจสอบไม่ผ่าน',         color: 'bg-red-50 text-red-700' },
  'order.confirm':             { label: 'ยืนยันการขาย',           color: 'bg-emerald-50 text-emerald-700' },
  'order.cancel':              { label: 'ยกเลิกคำสั่งซื้อ',        color: 'bg-red-50 text-red-700' },
}

function actionInfo(action: string) {
  return ACTION_LABELS[action] ?? { label: action, color: 'bg-gray-100 text-gray-700' }
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  useEffect(() => {
    activityLogsApi.list().then((d) => setLogs(d ?? [])).finally(() => setLoading(false))
  }, [])

  const uniqueActions = useMemo(() => {
    const set = new Set<string>()
    logs.forEach((l) => set.add(l.action))
    return Array.from(set).sort()
  }, [logs])

  const filtered = useMemo(() => logs
    .filter((l) => actionFilter === 'all' || l.action === actionFilter)
    .filter((l) => {
      const haystack = [
        l.user?.first_name, l.user?.last_name,
        ROLE_LABELS[l.user?.role], l.user?.role,
        actionInfo(l.action).label, l.action,
        l.description, l.entity_type,
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(search.toLowerCase())
    }), [logs, search, actionFilter])

  return (
    <div className="flex flex-col h-full">
      <TopBar title="บันทึกการใช้งาน" />
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5 border-b border-gray-100">
            <div className="relative w-full sm:w-auto">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหา..."
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72" />
            </div>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">การกระทำทั้งหมด</option>
              {uniqueActions.map((a) => <option key={a} value={a}>{actionInfo(a).label}</option>)}
            </select>
            <p className="ml-auto text-sm text-gray-500">{filtered.length} รายการ</p>
          </div>

          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th className="text-left px-5 py-3">เวลา</th>
                <th className="text-left px-5 py-3">ผู้ใช้</th>
                <th className="text-left px-5 py-3">บทบาท</th>
                <th className="text-left px-5 py-3">การกระทำ</th>
                <th className="text-left px-5 py-3">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && <tr><td colSpan={5} className="text-center py-10 text-gray-400">กำลังโหลด...</td></tr>}
              {!loading && filtered.map((log) => {
                const info = actionInfo(log.action)
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-5 py-3 text-gray-900">
                      {log.user ? `${log.user.first_name} ${log.user.last_name}` : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{ROLE_LABELS[log.user?.role] ?? '-'}</td>
                    <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded text-xs ${info.color}`}>{info.label}</span></td>
                    <td className="px-5 py-3 text-gray-700 text-xs">{log.description ?? '-'}</td>
                  </tr>
                )
              })}
              {!loading && filtered.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400">ไม่พบบันทึก</td></tr>}
            </tbody>
          </table></div>
        </div>
      </div>
    </div>
  )
}
