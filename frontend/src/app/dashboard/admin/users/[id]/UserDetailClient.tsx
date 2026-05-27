'use client'

const ROLE_LABELS: Record<string, string> = { admin: 'ผู้ดูแล', manager: 'ผู้จัดการ', sales: 'พนักงานขาย', cfo: 'ผู้บริหาร' }

export default function UserDetailClient({ user }: { user: any }) {
  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl">
            {user.first_name?.[0]}{user.last_name?.[0]}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user.first_name} {user.last_name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{ROLE_LABELS[user.role]}</span>
          </div>
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><dt className="text-gray-500 text-xs">เบอร์โทรศัพท์</dt><dd className="text-gray-900 mt-0.5">{user.phone ?? '-'}</dd></div>
          <div><dt className="text-gray-500 text-xs">ทีม</dt><dd className="text-gray-900 mt-0.5">{user.team?.name ?? '-'}</dd></div>
          <div><dt className="text-gray-500 text-xs">สถานะ</dt><dd className="text-gray-900 mt-0.5">{user.is_active ? 'ใช้งาน' : 'ปิด'}</dd></div>
          <div><dt className="text-gray-500 text-xs">วันที่สร้างบัญชี</dt><dd className="text-gray-900 mt-0.5">{new Date(user.created_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</dd></div>
        </dl>
      </div>
    </div>
  )
}
