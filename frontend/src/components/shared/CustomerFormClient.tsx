'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X } from 'lucide-react'
import { customersApi, customerRequestsApi, zonesApi } from '@/lib/api/services'

interface Props {
  mode: 'create' | 'request' | 'edit'
  initial?: any
  onDone?: () => void
}

const IMAGE_FIELDS = [
  { field: 'location_image_url' as const, label: 'รูปสถานที่' },
  { field: 'drug_license_image_url' as const, label: 'ใบอนุญาตขายยา' },
  { field: 'hospital_license_image_url' as const, label: 'ใบอนุญาตสถานพยาบาล' },
]

export default function CustomerFormClient({ mode, initial, onDone }: Props) {
  const router = useRouter()

  const [form, setForm] = useState({
    company_name: initial?.company_name ?? '',
    customer_code: initial?.customer_code ?? '',
    zone_id: initial?.zone_id ?? '',
    address: initial?.address ?? '',
    contact_name: initial?.contact_name ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    has_tax_id: initial?.has_tax_id ?? false,
    tax_id: initial?.tax_id ?? '',
    drug_license_number: initial?.drug_license_number ?? '',
    location_image_url: initial?.location_image_url ?? '',
    drug_license_image_url: initial?.drug_license_image_url ?? '',
    hospital_license_image_url: initial?.hospital_license_image_url ?? '',
  })
  const [zones, setZones] = useState<any[]>([])
  useEffect(() => { zonesApi.list().then(setZones).catch(() => setZones([])) }, [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleFile = (field: string, file: File) => {
    if (file.size > 2 * 1024 * 1024) { setError('ไฟล์ใหญ่เกิน 2MB'); return }
    const reader = new FileReader()
    reader.onloadend = () => setForm((f) => ({ ...f, [field]: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')

    try {
      if (mode === 'request') {
        await customerRequestsApi.create(form)
        showToast('success', 'ส่งคำขอเรียบร้อย รอผู้ดูแลตรวจสอบ')
        setForm({ company_name: '', customer_code: '', zone_id: '', address: '', contact_name: '', phone: '', email: '', has_tax_id: false, tax_id: '', drug_license_number: '', location_image_url: '', drug_license_image_url: '', hospital_license_image_url: '' })
      } else if (mode === 'create') {
        await customersApi.create(form)
        setSuccess('เพิ่มลูกค้าเรียบร้อย')
        if (onDone) onDone()
        else router.push('/dashboard/admin/customers')
      } else if (mode === 'edit') {
        await customersApi.update(initial.id, form)
        setSuccess('แก้ไขเรียบร้อย')
        if (onDone) onDone()
      }
    } catch (err: any) {
      if (mode === 'request') showToast('error', err.message || 'ส่งคำขอไม่สำเร็จ')
      else setError(err.message || 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {success && mode !== 'request' && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">ข้อมูลบริษัท</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสลูกค้า</label>
                  <input value={form.customer_code} onChange={(e) => setForm({ ...form, customer_code: e.target.value })}
                    placeholder={initial ? '' : 'auto: CUS-0001'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                  <p className="text-xs text-gray-400 mt-0.5">ปล่อยว่างเพื่อ auto-gen</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">เขตการขาย</label>
                  <select value={form.zone_id ?? ''} onChange={(e) => setForm({ ...form, zone_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- ไม่ระบุ --</option>
                    {zones.map((z) => <option key={z.id} value={z.id}>{z.code} - {z.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อบริษัท <span className="text-red-500">*</span></label>
                <input required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ที่อยู่</label>
                <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อผู้ติดต่อ</label>
                  <input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์โทรศัพท์</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">อีเมล</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">ข้อมูลภาษีและใบอนุญาต</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">มีเลขผู้เสียภาษีหรือไม่?</label>
                  <select value={form.has_tax_id ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, has_tax_id: e.target.value === 'yes', tax_id: e.target.value === 'yes' ? form.tax_id : '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="no">ไม่มี</option>
                    <option value="yes">มี</option>
                  </select>
                </div>
                {form.has_tax_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">เลขประจำตัวผู้เสียภาษี <span className="text-red-500">*</span></label>
                    <input required value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                      placeholder="เช่น 0105560001234"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">เลขที่อนุญาตขายยา</label>
                <input value={form.drug_license_number} onChange={(e) => setForm({ ...form, drug_license_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">รูปภาพและเอกสาร</h3>
            <p className="text-xs text-gray-500 mb-3">อัพโหลดรูปจากเครื่อง (ไม่เกิน 2MB ต่อรูป)</p>
            <div className="space-y-4">
              {IMAGE_FIELDS.map((u) => (
                <div key={u.field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{u.label}</label>
                  <input
                    ref={(el) => { fileRefs.current[u.field] = el }}
                    type="file" accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(u.field, f) }}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => fileRefs.current[u.field]?.click()}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                      <Upload size={14} /> อัพโหลดรูป
                    </button>
                    {form[u.field] && (
                      <div className="relative">
                        <img src={form[u.field]} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                        <button type="button" onClick={() => setForm({ ...form, [u.field]: '' })}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button type="button" onClick={() => router.back()}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">ยกเลิก</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {saving ? 'บันทึก...' : (mode === 'request' ? 'ส่งคำขอ' : 'บันทึก')}
            </button>
          </div>
        </form>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className={`px-5 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}
