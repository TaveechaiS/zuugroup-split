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
  const [vatPercent, setVatPercent] = useState(7)
  const [includeVat, setIncludeVat] = useState(true)
  const [discountPct, setDiscountPct] = useState(0)
  const [discountAmt, setDiscountAmt] = useState(0)
  const [hasOther, setHasOther] = useState(false)
  const [otherLabel, setOtherLabel] = useState('')
  const [otherAmt, setOtherAmt] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!customerId) { setCustomerPrices({}); return }
    customersApi.prices(customerId).then((data) => {
      const map = (data ?? []).reduce((acc: any, r: any) => ({ ...acc, [r.product_id]: r.custom_price }), {})
      setCustomerPrices(map)
    })
  }, [customerId])

  const subtotal = useMemo(() => items.reduce((s, it) => s + it.unit_price * it.quantity, 0), [items])
  const totalDiscount = useMemo(() => +(((subtotal * discountPct) / 100) + discountAmt).toFixed(2), [subtotal, discountPct, discountAmt])
  const afterDiscount = useMemo(() => Math.max(0, subtotal - totalDiscount), [subtotal, totalDiscount])
  const vatAmount = useMemo(() => includeVat ? +(afterDiscount * vatPercent / 100).toFixed(2) : 0, [afterDiscount, vatPercent, includeVat])
  const other = useMemo(() => hasOther ? otherAmt : 0, [hasOther, otherAmt])
  const total = useMemo(() => +(afterDiscount + vatAmount + other).toFixed(2), [afterDiscount, vatAmount, other])

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  const updateItem = (idx: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items]
    newItems[idx] = { ...newItems[idx], [field]: value }
    if (field === 'product_id') {
      // Guard against picking the same product as another row
      const dup = newItems.findIndex((it, i) => i !== idx && it.product_id === value && value)
      if (dup !== -1) {
        alert('สินค้านี้ถูกเพิ่มในรายการแล้ว — กรุณาเพิ่มจำนวนในแถวเดิมแทน')
        return
      }
      const product = products.find((p) => p.id === value)
      if (product) newItems[idx].unit_price = customerPrices[value] ?? product.price_per_unit
    }
    setItems(newItems)
  }

  // Check insufficient stock per item
  const insufficientItems = items
    .map((it, idx) => {
      const p = products.find((pp) => pp.id === it.product_id)
      return p && it.quantity > p.quantity
        ? { idx, name: p.name, requested: it.quantity, available: p.quantity, unit: p.unit ?? '' }
        : null
    })
    .filter(Boolean) as Array<{ idx: number; name: string; requested: number; available: number; unit: string }>
  const hasInsufficient = insufficientItems.length > 0

  const handleSubmit = async (asDraft: boolean = false) => {
    setError('')
    if (!customerId) { setError('กรุณาเลือกลูกค้า'); return }
    if (items.length === 0) { setError('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ'); return }
    if (items.some((i) => !i.product_id)) { setError('กรุณาเลือกสินค้าให้ครบทุกรายการ'); return }
    if (!asDraft && hasInsufficient) {
      setError('จำนวนสินค้าไม่เพียงพอ — ปรับจำนวนสินค้าใหม่ หรือกด "บันทึกฉบับร่าง"')
      return
    }

    setSaving(true)
    try {
      await ordersApi.create({
        customer_id: customerId,
        items,
        vat_percent: vatPercent,
        include_vat: includeVat,
        discount_percent: discountPct,
        discount_amount: discountAmt,
        other_label: hasOther ? otherLabel || null : null,
        other_amount: hasOther ? otherAmt : 0,
        notes: notes || undefined,
        status: asDraft ? 'draft' : 'pending_review',
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
              const insufficient = product && item.quantity > product.quantity
              return (
                <div key={idx} className={`rounded-xl p-3 ${insufficient ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <select value={item.product_id} onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                      className="col-span-5 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="">-- เลือกสินค้า --</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} (คงเหลือ: {p.quantity} {p.unit ?? ''})</option>)}
                    </select>
                    <input type="number" min="1" value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                      className={`col-span-2 px-2 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 bg-white ${insufficient ? 'border-red-400 focus:ring-red-500 text-red-700 font-semibold' : 'border-gray-300 focus:ring-blue-500'}`}
                      placeholder="จำนวน" />
                    <div className="col-span-2 px-2 py-1.5 text-sm text-gray-700">
                      ฿{item.unit_price.toLocaleString()}{hasCustomPrice && <span className="ml-1 text-xs text-green-600">✓</span>}
                    </div>
                    <div className="col-span-2 text-right text-sm text-gray-900 font-medium">฿{(item.unit_price * item.quantity).toLocaleString()}</div>
                    <button onClick={() => removeItem(idx)}
                      className="col-span-1 text-red-500 hover:bg-red-100 rounded-lg p-1.5 flex items-center justify-center transition">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {insufficient && (
                    <p className="text-xs text-red-700 mt-1.5 ml-1">
                      ⚠️ จำนวนสินค้าไม่เพียงพอ — มีในสต๊อก {product!.quantity} {product!.unit ?? ''} แต่สั่ง {item.quantity} {product!.unit ?? ''}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeVat} onChange={(e) => setIncludeVat(e.target.checked)} className="rounded text-blue-600" />
              <span className="text-gray-700">รวมภาษี VAT</span>
              {includeVat && (
                <>
                  <span className="text-gray-400 mx-2">|</span>
                  <input type="number" min="0" max="100" step="0.1" value={vatPercent} onChange={(e) => setVatPercent(Number(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-gray-500 text-xs">%</span>
                </>
              )}
            </label>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">ส่วนลด</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">% ส่วนลด</label>
                  <input type="number" min="0" max="100" step="0.1" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ยอดบาท</label>
                  <input type="number" min="0" step="0.01" value={discountAmt} onChange={(e) => setDiscountAmt(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <label className="flex items-center gap-2 text-sm mb-2">
                <input type="checkbox" checked={hasOther} onChange={(e) => setHasOther(e.target.checked)} className="rounded text-blue-600" />
                <span className="text-gray-700">ค่าใช้จ่ายอื่น ๆ (เช่น ค่าขนส่ง)</span>
              </label>
              {hasOther && (
                <div className="grid grid-cols-2 gap-3">
                  <input value={otherLabel} onChange={(e) => setOtherLabel(e.target.value)} placeholder="ชื่อรายการ"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="number" step="0.01" value={otherAmt} onChange={(e) => setOtherAmt(Number(e.target.value))} placeholder="0.00"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">หมายเหตุ (ถ้ามี)</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-1.5 max-w-xs ml-auto text-sm">
            <div className="flex justify-between text-gray-600"><span>ยอดรวมก่อนปรับ</span><span>฿{subtotal.toLocaleString()}</span></div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-red-600"><span>ส่วนลด</span><span>-฿{totalDiscount.toLocaleString()}</span></div>
            )}
            {includeVat && (
              <div className="flex justify-between text-gray-600"><span>VAT ({vatPercent}%)</span><span>฿{vatAmount.toLocaleString()}</span></div>
            )}
            {hasOther && otherAmt > 0 && (
              <div className="flex justify-between text-gray-600"><span>{otherLabel || 'อื่นๆ'}</span><span>฿{other.toLocaleString()}</span></div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 pt-1.5 border-t border-gray-200">
              <span>ยอดสุทธิ</span><span>฿{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {hasInsufficient && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <p className="font-semibold mb-2">⚠️ จำนวนสินค้าไม่เพียงพอ ({insufficientItems.length} รายการ)</p>
            <ul className="space-y-1 ml-5 list-disc">
              {insufficientItems.map((it) => (
                <li key={it.idx}>
                  {it.name}: สั่ง {it.requested} {it.unit} / มีในสต๊อก {it.available} {it.unit}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs">ส่งคำสั่งซื้อทันทีไม่ได้ — กด "บันทึกฉบับร่าง" เพื่อเก็บไว้ก่อน (ยังไม่ตัดสต๊อก)</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 justify-end">
          <button onClick={() => router.back()}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">ยกเลิก</button>
          <button onClick={() => handleSubmit(true)} disabled={saving}
            className="px-5 py-2.5 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-60">
            {saving ? 'บันทึก…' : 'บันทึกฉบับร่าง'}
          </button>
          <button onClick={() => handleSubmit(false)} disabled={saving || hasInsufficient}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            title={hasInsufficient ? 'จำนวนสินค้าไม่เพียงพอ' : undefined}>
            {saving ? 'บันทึก…' : 'ส่งคำสั่งซื้อ'}
          </button>
        </div>
      </div>
    </div>
  )
}
