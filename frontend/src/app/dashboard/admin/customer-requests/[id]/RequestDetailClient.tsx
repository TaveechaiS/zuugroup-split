'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { customerRequestsApi } from '@/lib/api/services'

export default function RequestDetailClient({ request }: { request: any }) {
  const router = useRouter()
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const approve = async () => {
    setSaving(true); setError('')
    try {
      await customerRequestsApi.approve(request.id)
      window.location.href = '/dashboard/admin/customer-requests'
    } catch (err: any) { setError(err.message); setSaving(false) }
  }

  const reject = async () => {
    if (!reason.trim()) { setError('กรุณาระบุเหตุผล'); return }
    setSaving(true); setError('')
    try {
      await customerRequestsApi.reject(request.id, reason)
      window.location.href = '/dashboard/admin/customer-requests'
    } catch (err: any) { setError(err.message); setSaving(false) }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900">{request.company_name}</h2>
          <p className="text-sm text-gray-500 mt-1">ขอโดย: {request.requester?.first_name} {request.requester?.last_name} ({request.requester?.email})</p>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 text-sm">
            <div><dt className="text-gray-500 text-xs">ที่อยู่</dt><dd className="text-gray-900 mt-0.5">{request.address ?? '-'}</dd></div>
            <div><dt className="text-gray-500 text-xs">ผู้ติดต่อ</dt><dd className="text-gray-900 mt-0.5">{request.contact_name ?? '-'}</dd></div>
            <div><dt className="text-gray-500 text-xs">โทรศัพท์</dt><dd className="text-gray-900 mt-0.5">{request.phone ?? '-'}</dd></div>
            <div><dt className="text-gray-500 text-xs">อีเมล</dt><dd className="text-gray-900 mt-0.5">{request.email ?? '-'}</dd></div>
            <div><dt className="text-gray-500 text-xs">เลขใบอนุญาตขายยา</dt><dd className="text-gray-900 mt-0.5">{request.drug_license_number ?? '-'}</dd></div>
          </dl>

          {(request.location_image_url || request.drug_license_image_url || request.hospital_license_image_url) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
              {[
                { url: request.location_image_url, label: 'รูปสถานที่' },
                { url: request.drug_license_image_url, label: 'ใบอนุญาตขายยา' },
                { url: request.hospital_license_image_url, label: 'ใบอนุญาตสถานพยาบาล' },
              ].filter((x) => x.url).map((img) => (
                <div key={img.label}>
                  <p className="text-xs text-gray-500 mb-1.5">{img.label}</p>
                  <a href={img.url} target="_blank" rel="noopener noreferrer">
                    <img src={img.url} alt={img.label} className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {!showReject ? (
          <div className="flex gap-3 justify-end">
            <button onClick={() => router.back()} className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">ยกเลิก</button>
            <button onClick={() => setShowReject(true)} disabled={saving} className="px-5 py-2.5 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center gap-2 disabled:opacity-60"><X size={16} /> ไม่อนุมัติ</button>
            <button onClick={approve} disabled={saving} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-60"><Check size={16} /> {saving ? 'บันทึก...' : 'อนุมัติ'}</button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-red-200 p-5 space-y-3">
            <p className="text-sm font-medium text-gray-900">เหตุผลที่ไม่อนุมัติ *</p>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" />
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
