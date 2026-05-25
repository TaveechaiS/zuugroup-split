'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import AdminProductsClient from './AdminProductsClient'
import { productsApi } from '@/lib/api/services'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const reload = () => {
    Promise.all([productsApi.list(), productsApi.categories()])
      .then(([p, c]) => { setProducts(p ?? []); setCategories(c ?? []) })
  }
  useEffect(() => { reload() }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title="จัดการสินค้า" />
      <AdminProductsClient products={products} categories={categories} onReload={reload} />
    </div>
  )
}
