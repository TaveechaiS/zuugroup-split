'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { ordersApi, customersApi } from '@/lib/api/services'

interface Props { customers: any[]; products: any[] }
interface OrderItem { product_id: string; quantity: number; unit_price: number }

export default function CreateOrderClient({ customers, products }: Props) {
  const router = useRouter()
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState<OrderItem[]>([])
  const [customerPrices, setCustomerPrices] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!customerId) { setCustomerPrices({}); return }
    customersApi.prices(customerId).then((data) => {
      const map = (data ?? []).reduce((acc: any, r: any) => ({ ...acc, [r.product_id]: r.custom_price }), {})
      setCustomerPrices(map)
    })
  }, [customerId])

  const total = useMemo(() => items.reduce((s, it) => s + it.unit_price * it.quantity, 0), [items])

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  const updateItem = (idx: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items]
    newItems[idx] = { ...newItems[idx], [field]: value }
    if (field === 'product_id') {
      const product = products.find((p) => p.id === value)
      if (product) newItems[idx].unit_price = customerPrices[value] ?? product.price_per_unit
    }
    setItems(newItems)
  }

  const handleSubmit = async () => {
    setError('')
    if (!customerId) { setError('กรุณาเลือกลูกค้า'); return }
    if (items.length === 0) { setError('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ'); return }
    if (items.some((i) => !i.product_id)) { setError('กรุณาเลือกสินค้าให้ครบทุกรายการ'); return }

    setSaving(true)
    try {
      await ordersApi.create({ customer_id: customerId, items })
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
          <h3 className="font-semibold text-gray-900 mb-4">ข้อมูลคำสั่งซื้อ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ลูกค้า *</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- เลือกลูกค้า --</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
              {customerId && Object.keys(customerPrices).length > 0 && (
                <p className="text-xs text-blue-600 mt-1.5">
                  ✓ ลูกค้ารายนี้มีราคาตกลงพิเศษ {Object.keys(customerPrices).length} รายการ
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">วันที่</label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">รายการสินค้า</h3>
            <button onClick={addItem} disabled={!customerId}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition">
              <Plus size={14} /> เพิ่มสินค้า
            </button>
          </div>

          <div className="space-y-3">
            {!customerId && <p className="text-center text-gray-400 text-sm py-6">กรุณาเลือกลูกค้าก่อนเพิ่มสินค้า</p>}
            {items.map((item, idx) => {
              const product = products.find((p) => p.id === item.product_id)
              const hasCustomPrice = item.product_id && customerPrices[item.product_id] !== undefined
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <select value={item.product_id} onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                    className="col-span-5 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- เลือกสินค้า --</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} (คงเหลือ: {p.quantity} {p.unit ?? ''})</option>)}
                  </select>
                  <input type="number" min="1" max={product?.quantity} value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                    className="col-span-2 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="จำนวน" />
                  <div className="col-span-2 px-2 py-1.5 text-sm text-gray-700">
                    ฿{item.unit_price.toLocaleString()}{hasCustomPrice && <span className="ml-1 text-xs text-green-600">✓</span>}
                  </div>
                  <div className="col-span-2 text-right text-sm text-gray-900 font-medium">฿{(item.unit_price * item.quantity).toLocaleString()}</div>
                  <button onClick={() => removeItem(idx)}
                    className="col-span-1 text-red-500 hover:bg-red-50 rounded-lg p-1.5 flex items-center justify-center transition">
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex justify-between text-base font-bold text-gray-900">
            <span>ยอดรวมทั้งสิ้น</span><span>฿{total.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={() => router.back()}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">ยกเลิก</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
            {saving ? 'บันทึก...' : 'ส่งคำสั่งซื้อ'}
          </button>
        </div>
      </div>
    </div>
  )
}
