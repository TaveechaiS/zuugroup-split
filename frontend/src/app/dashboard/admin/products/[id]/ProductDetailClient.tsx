'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Package, History, TrendingUp, TrendingDown, Plus, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { stockLogsApi } from '@/lib/api/services'

const ACTION_LABEL: Record<string, { label: string; color: string }> = {
  initial:        { label: 'สร้างสินค้า',     color: 'bg-blue-50 text-blue-700' },
  refill:         { label: 'เติมสินค้า',       color: 'bg-green-50 text-green-700' },
  manual_adjust:  { label: 'ปรับสต๊อก',       color: 'bg-yellow-50 text-yellow-700' },
  order_complete: { label: 'ขายออก (ออเดอร์)',  color: 'bg-purple-50 text-purple-700' },
  order_cancel:   { label: 'คืนจากออเดอร์ยกเลิก', color: 'bg-gray-100 text-gray-700' },
}

export default function ProductDetailClient({ product }: { product: any }) {
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  useEffect(() => {
    stockLogsApi.forProduct(product.id)
      .then((d) => setLogs(d ?? []))
      .catch(() => setLogs([]))
      .finally(() => setLoadingLogs(false))
  }, [product.id])

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <button onClick={() => {
          if (typeof window !== 'undefined' && window.history.length > 1) router.back()
          else router.push('/dashboard/admin/products')
        }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600">
          <ArrowLeft size={16} /> ย้อนกลับ
        </button>

        {/* Product summary card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-40 h-40 object-cover rounded-lg border border-gray-200" />
            ) : (
              <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-sm shrink-0">
                <Package size={40} />
              </div>
            )}
            <div className="flex-1 space-y-3 min-w-0">
              <div>
                <span className="font-mono text-xs text-blue-700">{product.product_code ?? '—'}</span>
                <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
                {product.category && <p className="text-sm text-gray-500">หมวดหมู่: {product.category.name}</p>}
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div><dt className="text-gray-500 text-xs">คงเหลือ</dt>
                  <dd className={`font-medium ${product.quantity < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                    {product.quantity} {product.unit ?? ''}
                  </dd>
                </div>
                {product.cost_price !== undefined && (
                  <div><dt className="text-gray-500 text-xs">ราคาต้นทุน</dt>
                    <dd className="text-orange-700 font-medium">฿{Number(product.cost_price ?? 0).toLocaleString()}</dd>
                  </div>
                )}
                <div><dt className="text-gray-500 text-xs">ราคาขาย</dt>
                  <dd className="text-gray-900 font-medium">฿{product.price_per_unit.toLocaleString()}</dd>
                </div>
                <div><dt className="text-gray-500 text-xs">สถานะ</dt>
                  <dd className="text-gray-900">{product.status === 'available' ? 'พร้อมขาย' : 'ปิดการขาย'}</dd>
                </div>
                {product.lot_number && (
                  <div><dt className="text-gray-500 text-xs">เลขล็อต</dt>
                    <dd className="font-mono text-gray-900">{product.lot_number}</dd>
                  </div>
                )}
                {product.expiry_date && (
                  <div><dt className="text-gray-500 text-xs">วันหมดอายุ</dt>
                    <dd className="text-gray-900">{new Date(product.expiry_date).toLocaleDateString('th-TH')}</dd>
                  </div>
                )}
                {product.manufacture_date && (
                  <div><dt className="text-gray-500 text-xs">วันผลิต</dt>
                    <dd className="text-gray-900">{new Date(product.manufacture_date).toLocaleDateString('th-TH')}</dd>
                  </div>
                )}
                <div><dt className="text-gray-500 text-xs">อัปเดตล่าสุด</dt>
                  <dd className="text-gray-900">{new Date(product.updated_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Stock log timeline */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <History size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">ประวัติการเปลี่ยนแปลงสต๊อก</h3>
            <span className="text-xs text-gray-400 ml-auto">{logs.length} รายการ</span>
          </div>
          {loadingLogs && <p className="p-6 text-center text-sm text-gray-400">กำลังโหลด…</p>}
          {!loadingLogs && logs.length === 0 && <p className="p-6 text-center text-sm text-gray-400">ยังไม่มีประวัติ</p>}
          {!loadingLogs && logs.length > 0 && (
            <div className="divide-y divide-gray-50">
              {logs.map((log) => {
                const info = ACTION_LABEL[log.action] ?? { label: log.action, color: 'bg-gray-100 text-gray-700' }
                const isPositive = log.change > 0
                return (
                  <div key={log.id} className="px-6 py-3.5 flex items-start gap-4 text-sm">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>{info.label}</span>
                        <span className={`font-semibold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                          {isPositive ? '+' : ''}{log.change}
                        </span>
                        <span className="text-gray-400 text-xs">
                          ({log.before_qty} → {log.after_qty})
                        </span>
                      </div>
                      {log.reason && <p className="text-gray-600 mt-1">{log.reason}</p>}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {log.performed_by_user && (
                          <span>โดย {log.performed_by_user.first_name} {log.performed_by_user.last_name}</span>
                        )}
                        {log.lot_number && <span>ล็อต: <span className="font-mono">{log.lot_number}</span></span>}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap text-right">
                      {new Date(log.created_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
