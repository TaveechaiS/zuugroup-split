'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { ordersApi } from '@/lib/api/services'

export default function OrderReviewClient({ order }: { order: any }) {
  const router = useRouter()
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const approve = async () => {
    setSaving(true); setError('')
    try {
      await ordersApi.reviewPass(order.id)
      router.push('/dashboard/manager/orders-pending'); router.refresh()
    } catch (err: any) { setError(err.message); setSaving(false) }
  }

  const reject = async () => {
    if (!reason.trim()) { setError('กรุณาระบุเหตุผล'); return }
    setSaving(true); setError('')
    try {
      await ordersApi.reviewReject(order.id, reason)
      router.push('/dashboard/manager/orders-pending'); router.refresh()
    } catch (err: any) { setError(err.message); setSaving(false) }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">คำสั่งซื้อ {order.order_number}</h2>
              <p className="text-sm text-gray-500 mt-1">{new Date(order.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">รอตรวจสอบ</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">ผู้สร้างเอกสาร</p>
              <p className="font-medium text-gray-900">{order.creator?.first_name} {order.creator?.last_name}</p>
              <p className="text-xs text-gray-500">{order.creator?.email}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">ลูกค้า</p>
              <p className="font-medium text-gray-900">{order.customer?.company_name}</p>
              <p className="text-xs text-gray-500">โทร: {order.customer?.phone ?? '-'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-900">รายการสินค้า</div>
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th className="text-left px-5 py-2.5">สินค้า</th>
                <th className="text-right px-5 py-2.5">จำนวน</th>
                <th className="text-right px-5 py-2.5">ราคา/หน่วย</th>
                <th className="text-right px-5 py-2.5">รวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(order.items ?? []).map((it: any) => (
                <tr key={it.id}>
                  <td className="px-5 py-3 text-gray-900">{it.product?.name}</td>
                  <td className="px-5 py-3 text-right">{it.quantity} {it.product?.unit ?? ''}</td>
                  <td className="px-5 py-3 text-right">฿{it.unit_price.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-gray-900 font-medium">฿{it.total_price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-end items-center gap-3 text-base font-bold text-gray-900">
              <span>ยอดรวม:</span><span>฿{order.total_amount?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {!showReject ? (
          <div className="flex gap-3 justify-end">
            <button onClick={() => router.back()} className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">ยกเลิก</button>
            <button onClick={() => setShowReject(true)} disabled={saving} className="px-5 py-2.5 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center gap-2 disabled:opacity-60"><X size={16} /> ไม่ผ่าน</button>
            <button onClick={approve} disabled={saving} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-60"><Check size={16} /> {saving ? 'บันทึก...' : 'ผ่านการตรวจสอบ'}</button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-red-200 p-5 space-y-3">
            <p className="text-sm font-medium text-gray-900">เหตุผลที่ไม่ผ่าน *</p>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" placeholder="ระบุเหตุผล..." />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowReject(false)} className="px-4 py-2 text-sm text-gray-600">ยกเลิก</button>
              <button onClick={reject} disabled={saving} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">{saving ? 'บันทึก...' : 'ยืนยัน'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
