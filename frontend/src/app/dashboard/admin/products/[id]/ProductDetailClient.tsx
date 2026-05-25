'use client'

export default function ProductDetailClient({ product }: { product: any }) {
  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex gap-5">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-40 h-40 object-cover rounded-lg border border-gray-200" />
          ) : (
            <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-sm">ไม่มีรูป</div>
          )}
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
              {product.category && <p className="text-sm text-gray-500">หมวดหมู่: {product.category.name}</p>}
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-500 text-xs">คงเหลือ</dt><dd className="text-gray-900 font-medium">{product.quantity} {product.unit ?? ''}</dd></div>
              <div><dt className="text-gray-500 text-xs">ราคา/หน่วย</dt><dd className="text-gray-900 font-medium">฿{product.price_per_unit.toLocaleString()}</dd></div>
              <div><dt className="text-gray-500 text-xs">สถานะ</dt><dd className="text-gray-900">{product.status === 'available' ? 'พร้อมขาย' : 'ปิดการขาย'}</dd></div>
              <div><dt className="text-gray-500 text-xs">อัปเดตล่าสุด</dt><dd className="text-gray-900">{new Date(product.updated_at).toLocaleDateString('th-TH')}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
