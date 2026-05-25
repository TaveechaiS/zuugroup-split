'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import ProductDetailClient from './ProductDetailClient'
import { productsApi } from '@/lib/api/services'

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any>(null)
  useEffect(() => { productsApi.get(params.id).then(setProduct).catch(() => setProduct(null)) }, [params.id])
  if (!product) return <div className="flex flex-col h-full"><TopBar title="ข้อมูลสินค้า" /><div className="p-6 text-gray-400">กำลังโหลด...</div></div>
  return (
    <div className="flex flex-col h-full">
      <TopBar title={product.name} />
      <ProductDetailClient product={product} />
    </div>
  )
}
