'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import ProductsViewClient from '@/components/shared/ProductsViewClient'
import { productsApi } from '@/lib/api/services'

export default function SalesProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  useEffect(() => { productsApi.list().then(setProducts) }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="ข้อมูลสินค้า" />
      <ProductsViewClient products={products} />
    </div>
  )
}
