'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Package, History, TrendingUp, TrendingDown, Edit2, Trash2, Upload, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { stockLogsApi, productsApi } from '@/lib/api/services'

const ACTION_LABEL: Record<string, { label: string; color: string }> = {
  initial:        { label: 'สร้างสินค้า',     color: 'bg-blue-50 text-blue-700' },
  refill:         { label: 'เติมสินค้า',       color: 'bg-green-50 text-green-700' },
  manual_adjust:  { label: 'ปรับสต๊อก',       color: 'bg-yellow-50 text-yellow-700' },
  order_complete: { label: 'ขายออก (ออเดอร์)',  color: 'bg-purple-50 text-purple-700' },
  order_cancel:   { label: 'คืนจากออเดอร์ยกเลิก', color: 'bg-gray-100 text-gray-700' },
}

export default function ProductDetailClient({ product: initialProduct, categories = [] }: { product: any; categories?: any[] }) {
  const router = useRouter()
  const [product, setProduct] = useState(initialProduct)
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    stockLogsApi.forProduct(product.id)
      .then((d) => setLogs(d ?? []))
      .catch(() => setLogs([]))
      .finally(() => setLoadingLogs(false))
  }, [product.id])

  const handleEdit = () => {
    setEditForm({
      name: product.name,
      product_code: product.product_code ?? '',
      quantity: product.quantity,
      price_per_unit: product.price_per_unit,
      cost_price: product.cost_price ?? 0,
      category_id: product.category_id ?? '',
      unit: product.unit ?? '',
      image_url: product.image_url ?? '',
      status: product.status,
      lot_number: product.lot_number ?? '',
      manufacture_date: product.manufacture_date ?? '',
      expiry_date: product.expiry_date ?? '',
    })
    setEditError('')
    setShowEdit(true)
  }

  const handleEditFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) { setEditError('ไฟล์ใหญ่เกิน 2MB'); return }
    const reader = new FileReader()
    reader.onloadend = () => setEditForm((f: any) => ({ ...f, image_url: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setEditError('')
    try {
      const body = { ...editForm, category_id: editForm.category_id || null, image_url: editForm.image_url || '' }
      const res = await productsApi.update(product.id, body)
      setProduct(res ?? { ...product, ...body })
      setShowEdit(false)
      // refresh stock logs in case quantity changed
      setLoadingLogs(true)
      const newLogs = await stockLogsApi.forProduct(product.id).catch(() => [])
      setLogs(newLogs ?? [])
      setLoadingLogs(false)
    } catch (err: any) {
      setEditError(err.message || 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`ยืนยันลบสินค้า "${product.name}"?`)) return
    setDeleting(true)
    try {
      await productsApi.remove(product.id)
      router.push('/dashboard/admin/products')
    } catch (err: any) {
      alert(err.message || 'ลบไม่สำเร็จ')
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) router.back()
            else router.push('/dashboard/admin/products')
          }}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600">
            <ArrowLeft size={16} /> ย้อนกลับ
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              <Edit2 size={14} /> แก้ไข
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              <Trash2 size={14} /> {deleting ? 'กำลังลบ…' : 'ลบสินค้า'}
            </button>
          </div>
        </div>

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

      {/* Edit modal — inline so no page navigation needed */}
      {showEdit && editForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEdit(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[92vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-lg">แก้ไขสินค้า</h3>
              <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
            </div>
            {editError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">{editError}</div>}
            <form onSubmit={saveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสสินค้า</label>
                  <input value={editForm.product_code} onChange={(e) => setEditForm({ ...editForm, product_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หน่วย</label>
                  <input value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
                <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนคงเหลือ <span className="text-red-500">*</span></label>
                  <input required type="number" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  <p className="text-xs text-blue-500 mt-0.5">การเปลี่ยนจำนวนจะถูกบันทึกใน Stock Log</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เลขล็อต</label>
                  <input value={editForm.lot_number} onChange={(e) => setEditForm({ ...editForm, lot_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันผลิต</label>
                  <input type="date" value={editForm.manufacture_date}
                    onChange={(e) => {
                      const mfg = e.target.value
                      let expiry = editForm.expiry_date
                      if (mfg) {
                        const d = new Date(mfg)
                        if (!isNaN(d.getTime())) {
                          d.setFullYear(d.getFullYear() + 3)
                          expiry = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
                        }
                      }
                      setEditForm({ ...editForm, manufacture_date: mfg, expiry_date: expiry })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันหมดอายุ</label>
                  <input type="date" value={editForm.expiry_date} onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคาต้นทุน (บาท)</label>
                  <input type="number" step="0.01" value={editForm.cost_price} onChange={(e) => setEditForm({ ...editForm, cost_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-orange-200 bg-orange-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคาขาย (บาท) <span className="text-red-500">*</span></label>
                  <input required type="number" step="0.01" value={editForm.price_per_unit} onChange={(e) => setEditForm({ ...editForm, price_per_unit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                <select value={editForm.category_id} onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- ไม่มีหมวด --</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รูปสินค้า</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleEditFile(f) }} className="hidden" />
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    <Upload size={14} /> อัพโหลดรูป
                  </button>
                  {editForm.image_url && (
                    <div className="relative">
                      <img src={editForm.image_url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                      <button type="button" onClick={() => setEditForm({ ...editForm, image_url: '' })} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="available">พร้อมขาย</option>
                  <option value="unavailable">ปิดการขาย</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">ยกเลิก</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium">
                  {saving ? 'กำลังบันทึก…' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
