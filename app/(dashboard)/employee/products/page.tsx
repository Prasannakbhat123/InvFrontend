'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { products as productsApi, nurseries as nurseriesApi } from '@/app/lib/api'
import { formatCurrency } from '@/app/lib/utils'

interface Product {
  product_id: string
  nursery_id: string
  item_name: string
  size: string
  inventory_quantity: number
  ordered_quantity: number
  base_price_per_unit: string
  rate_percentage: string
  image_url?: string | null
}

interface Nursery {
  nursery_id: string
  nursery_name: string
}

export default function EmployeeProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [nurseries, setNurseries] = useState<Nursery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    const load = async () => {
      try {
        const [productData, nurseryData] = await Promise.all([
          productsApi.getAll(),
          nurseriesApi.getAll(),
        ])
        setProducts(productData)
        setNurseries(nurseryData)
      } catch (error: any) {
        toast.error(error.message || 'Failed to load products')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const getNurseryName = (id: string) => nurseries.find(n => n.nursery_id === id)?.nursery_name || id

  const finalPrice = (base: string, rate: string) => {
    const b = Number(base)
    const r = Number(rate)
    return b * (1 + r / 100)
  }

  const totalPages = Math.ceil(products.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = products.slice(startIndex, endIndex)

  if (isLoading) return <div className="text-gray-600">Loading products...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-gradient-to-r from-[#13452D] to-[#1F764D] rounded-2xl p-6 text-white">
        <div>
          <h1 className="text-3xl font-bold">Products Inventory</h1>
          <p className="text-white/90">Inventory view and stock updates</p>
        </div>
        <Link href="/employee/products/create">
          <button className="px-4 py-2 rounded-lg bg-white text-[#13452D] font-semibold">Add Product</button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {paginatedProducts.map(product => (
          <div key={product.product_id} className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{product.item_name}</h3>
                <p className="text-sm text-gray-600">{product.size}</p>
                <p className="text-xs text-gray-500 mt-1">{getNurseryName(product.nursery_id)}</p>
                <p className="text-xs text-gray-400">{product.product_id}</p>
              </div>
              <div className="p-2 bg-[#1F764D]/10 rounded-lg">
                <Package className="h-5 w-5 text-[#1F764D]" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-gray-500">Inventory</p>
                <p className="text-xl font-bold text-gray-900">{product.inventory_quantity}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-gray-500">Final Price</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(finalPrice(product.base_price_per_unit, product.rate_percentage))}</p>
              </div>
            </div>

            <div className="mt-4">
              <Link href="/employee/products/create">
                <button className="w-full rounded-lg bg-gradient-to-r from-[#13452D] to-[#1F764D] px-3 py-2 text-sm font-semibold text-white flex items-center justify-center gap-1">
                  <PlusCircle className="h-4 w-4" /> New
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {products.length > 0 && totalPages > 1 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(endIndex, products.length)}</span> of <span className="font-semibold text-gray-900">{products.length}</span> products
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:border-[#1F764D] hover:bg-[#1F764D]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl font-semibold transition-all ${
                          currentPage === page
                            ? 'bg-gradient-to-br from-[#13452D] to-[#1F764D] text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  }

                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2 text-gray-400">...</span>
                  }

                  return null
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:border-[#1F764D] hover:bg-[#1F764D]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
