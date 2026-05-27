'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

export default function CustomerRequestsClient({ requests }: { requests: any[] }) {
  const router = useRouter()
  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
              <th className="text-left px-5 py-3">บริษัท</th>
              <th className="text-left px-5 py-3">ผู้ขอ</th>
              <th className="text-left px-5 py-3">ผู้ติดต่อ</th>
              <th className="text-left px-5 py-3">โทร</th>
              <th className="text-left px-5 py-3">วันที่ขอ</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests.map((r) => (
              <tr key={r.id} onClick={() => router.push(`/dashboard/admin/customer-requests/${r.id}`)} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-5 py-3.5 font-medium text-gray-900">{r.company_name}</td>
                <td className="px-5 py-3.5 text-gray-600">{r.requester?.first_name} {r.requester?.last_name}</td>
                <td className="px-5 py-3.5 text-gray-600">{r.contact_name ?? '-'}</td>
                <td className="px-5 py-3.5 text-gray-600">{r.phone ?? '-'}</td>
                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                  <div>{new Date(r.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div className="text-xs text-gray-400">{new Date(r.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td className="px-5 py-3.5"><ChevronRight size={16} className="text-gray-400" /></td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">ไม่มีคำขอที่รออนุมัติ</td></tr>}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}
