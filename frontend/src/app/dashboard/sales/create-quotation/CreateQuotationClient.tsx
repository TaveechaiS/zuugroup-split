'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { quotationsApi } from '@/lib/api/services'

interface Props { customers: any[]; products: any[] }

interface LineItem {
  product_id: string
  quantity: number
  unit_price: number
  negotiated_price?: number
}

export default function CreateQuotationClient({ customers, products }: Props) {
  const router = useRouter()

  const [customerId, setCustomerId] = useState('')
  const [vatPercent, setVatPercent] = useState(7)
  const [notes, setNotes] = useState('')
  const [contractDays, setContractDays] = useState(30)
  const [items, setItems] = useState<LineItem[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selectedCustomer = customers.find((c) => c.id === customerId)

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const price = item.negotiated_price ?? item.unit_price
      return sum + price * item.quantity
    }, 0)
    const vat = (subtotal * vatPercent) / 100
    return { subtotal, vat, total: subtotal + vat }
  }, [items, vatPercent])

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  const updateItem = (idx: number, field: keyof LineItem, value: any) => {
    const newItems = [...items]
    newItems[idx] = { ...newItems[idx], [field]: value }
    if (field === 'product_id') {
      const product = products.find((p) => p.id === value)
      if (product) newItems[idx].unit_price = product.price_per_unit
    }
    setItems(newItems)
  }

  const handleSubmit = async (asDraft: boolean) => {
    setError('')
    if (!customerId) { setError('กรุณาเลือกลูกค้า'); return }
    if (items.length === 0) { setError('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ'); return }
    if (items.some((i) => !i.product_id)) { setError('กรุณาเลือกสินค้าให้ครบทุกรายการ'); return }

    setSaving(true)
    try {
      await quotationsApi.create({
        customer_id: customerId,
        vat_percent: vatPercent,
        notes,
        contract_period_days: contractDays,
        status: asDraft ? 'draft' : 'pending',
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          negotiated_price: i.negotiated_price ?? null,
        })),
      })
      router.push('/dashboard/sales')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">ข้อมูลทั่วไป</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ลูกค้า *</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- เลือกลูกค้า --</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">วันที่</label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {selectedCustomer && (
            <div className="mt-4 bg-blue-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-900">{selectedCustomer.company_name}</p>
              <p className="text-gray-600">ผู้ติดต่อ: {selectedCustomer.contact_name ?? '-'}</p>
              <p className="text-gray-600">ที่อยู่: {selectedCustomer.address ?? '-'}</p>
              <p className="text-gray-600">โทร: {selectedCustomer.phone ?? '-'} | อีเมล: {selectedCustomer.email ?? '-'}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">รายการสินค้า</h3>
            <button onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
              <Plus size={14} /> เพิ่มสินค้า
            </button>
          </div>

          <div className="space-y-3">
            {items.length === 0 && <p className="text-center text-gray-400 text-sm py-6">ยังไม่มีรายการสินค้า</p>}
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <select value={item.product_id} onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                  className="col-span-5 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- เลือกสินค้า --</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" min="1" value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                  className="col-span-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="จำนวน" />
                <input type="number" value={item.unit_price} disabled
                  className="col-span-2 px-2 py-1.5 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none" placeholder="ราคาเดิม" />
                <input type="number" value={item.negotiated_price ?? ''}
                  onChange={(e) => updateItem(idx, 'negotiated_price', e.target.value ? Number(e.target.value) : undefined)}
                  className="col-span-2 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="ราคาใหม่" />
                <div className="col-span-1 text-right text-sm text-gray-700 font-medium">
                  ฿{((item.negotiated_price ?? item.unit_price) * item.quantity).toLocaleString()}
                </div>
                <button onClick={() => removeItem(idx)}
                  className="col-span-1 text-red-500 hover:bg-red-50 rounded-lg p-1.5 flex items-center justify-center transition">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">รายละเอียดเพิ่มเติม</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">VAT (%)</label>
              <input type="number" value={vatPercent} onChange={(e) => setVatPercent(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ระยะเวลาสัญญา (วัน)</label>
              <input type="number" value={contractDays} onChange={(e) => setContractDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">หมายเหตุ</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">ยอดรวม</span>
              <span>฿{totals.subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">VAT ({vatPercent}%)</span>
              <span>฿{totals.vat.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
            <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold text-gray-900">
              <span>ยอดสุทธิ</span>
              <span>฿{totals.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={() => router.back()}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">ยกเลิก</button>
          <button onClick={() => handleSubmit(true)} disabled={saving}
            className="px-5 py-2.5 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-60">บันทึกฉบับร่าง</button>
          <button onClick={() => handleSubmit(false)} disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
            {saving ? 'บันทึก...' : 'ส่งเพื่ออนุมัติ'}
          </button>
        </div>
      </div>
    </div>
  )
}
