'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Package, Edit, BarChart3, RefreshCw, ChevronDown, X } from 'lucide-react'
import { formatCurrency } from '@/app/lib/utils'
import { products as productsApi, nurseries as nurseriesApi } from '@/app/lib/api'
import { toast } from 'sonner'

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

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNurseries, setSelectedNurseries] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [nurseries, setNurseries] = useState<Nursery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const itemsPerPage = 10

  const fetchProducts = async () => {
    try {
      const data = await productsApi.getAll()
      setProducts(data)
    } catch (error: any) {
      console.error('Error fetching products:', error)
      toast.error(error.message || 'Failed to load products')
    }
  }

  const fetchNurseries = async () => {
    try {
      const data = await nurseriesApi.getAll()
      setNurseries(data)
    } catch (error: any) {
      console.error('Error fetching nurseries:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchProducts(), fetchNurseries()])
      setIsLoading(false)
    }
    loadData()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchProducts()
    setIsRefreshing(false)
    toast.success('Products refreshed')
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.size.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesNursery = selectedNurseries.length === 0 || selectedNurseries.includes(product.nursery_id)
    return matchesSearch && matchesNursery
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedNurseries])

  const toggleNurseryFilter = (nurseryId: string) => {
    setSelectedNurseries(prev => 
      prev.includes(nurseryId)
        ? prev.filter(id => id !== nurseryId)
        : [...prev, nurseryId]
    )
  }

  const clearFilters = () => {
    setSelectedNurseries([])
    setShowFilterDropdown(false)
  }

  const calculateFinalPrice = (basePrice: string, rate: string) => {
    const base = parseFloat(basePrice)
    const rateVal = parseFloat(rate)
    return base * (1 + rateVal / 100)
  }

  const getNurseryName = (nurseryId: string) => {
    const nursery = nurseries.find(n => n.nursery_id === nurseryId)
    return nursery?.nursery_name || nurseryId
  }

  const handleAddStock = async (product: Product) => {
    const rawQty = window.prompt(`Add stock for ${product.item_name} (${product.product_id})`, '1')
    if (!rawQty) return

    const qty = Number(rawQty)
    if (!Number.isInteger(qty) || qty <= 0) {
      toast.error('Please enter a valid positive quantity')
      return
    }

    try {
      const response = await productsApi.addStock(product.product_id, qty)
      setProducts(prev => prev.map(p =>
        p.product_id === response.product_id
          ? { ...p, inventory_quantity: response.inventory_quantity }
          : p
      ))
      toast.success(`Added ${qty} units successfully`)
    } catch (error: any) {
      console.error('Failed to add stock:', error)
      toast.error(error.message || 'Failed to add stock')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#13452D] to-[#1F764D] rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Products</h1>
            <p className="text-white/90 text-lg">Manage your nursery inventory and pricing ({products.length} total products)</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-6 py-3 bg-white/20 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link href="/admin/products/create">
              <button className="px-6 py-3 bg-white text-[#13452D] rounded-lg font-semibold hover:bg-white/90 transition-all flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Product
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name or size..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1F764D] transition-colors text-gray-900"
            />
          </div>
          
          {/* Nursery Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                selectedNurseries.length > 0
                  ? 'bg-gradient-to-br from-[#13452D] to-[#1F764D] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>
                {selectedNurseries.length === 0
                  ? 'Filter by Nursery'
                  : `${selectedNurseries.length} Nursery${selectedNurseries.length > 1 ? 'ies' : ''} Selected`}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${
                showFilterDropdown ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Dropdown Menu */}
            {showFilterDropdown && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50 max-h-96 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-[#13452D]/5 to-[#1F764D]/5">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Select Nurseries
                  </h3>
                  {selectedNurseries.length > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {nurseries.map(nursery => {
                    const count = products.filter(p => p.nursery_id === nursery.nursery_id).length
                    const isSelected = selectedNurseries.includes(nursery.nursery_id)
                    return (
                      <label
                        key={nursery.nursery_id}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleNurseryFilter(nursery.nursery_id)}
                          className="w-5 h-5 rounded border-2 border-gray-300 text-[#1F764D] focus:ring-2 focus:ring-[#1F764D]/50 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{nursery.nursery_name}</div>
                          <div className="text-sm text-gray-500">{count} product{count !== 1 ? 's' : ''}</div>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 bg-[#1F764D] rounded-full"></div>
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid - 2 Columns with 4:3 Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {paginatedProducts.map((product) => (
          <div 
            key={product.product_id} 
            className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-[#1F764D] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
          >
            {/* 4:3 Ratio Container */}
            <div className="grid grid-cols-5 gap-0">
              {/* Left Side - 2/5 width for header */}
              <div className="col-span-2 bg-gradient-to-br from-[#13452D] to-[#1F764D] p-6 text-white flex flex-col justify-between">
                <div>
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm inline-block mb-4">
                    <Package className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 leading-tight">{product.item_name}</h3>
                  <p className="text-white/80 text-sm font-medium mb-3">{product.size}</p>
                  <div className="flex items-center gap-2 p-2 bg-white/10 rounded-lg">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-xs font-medium truncate">{getNurseryName(product.nursery_id)}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-xs opacity-80 mb-1">Product ID</div>
                  <div className="text-xs font-mono bg-white/20 px-2 py-1 rounded">
                    {product.product_id.slice(-8)}
                  </div>
                </div>
              </div>

              {/* Right Side - 3/5 width for content */}
              <div className="col-span-3 p-6 flex flex-col justify-between">
                {/* Inventory Status */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl group-hover:from-green-100 group-hover:to-green-200/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-500 rounded-lg group-hover:scale-110 transition-transform">
                        <Package className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">In Stock</span>
                    </div>
                    <span className={`text-xl font-bold ${
                      product.inventory_quantity < 10 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {product.inventory_quantity}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl group-hover:from-blue-100 group-hover:to-blue-200/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                        <BarChart3 className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Ordered</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">{product.ordered_quantity}</span>
                  </div>
                  
                  {product.inventory_quantity < 10 && (
                    <div className="flex items-center gap-2 p-3 bg-red-100 rounded-xl border-l-4 border-red-600 animate-pulse">
                      <span className="text-lg">⚠️</span>
                      <span className="text-xs font-bold text-red-700">Low Stock Alert</span>
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="mb-4 p-4 bg-gradient-to-br from-[#13452D]/5 to-[#1F764D]/5 rounded-xl border-2 border-[#1F764D]/20 group-hover:border-[#1F764D]/40 transition-colors">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Base Price</span>
                      <span className="font-semibold">{formatCurrency(parseFloat(product.base_price_per_unit))}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Rate ({product.rate_percentage}%)</span>
                      <span className="font-semibold text-[#1F764D]">+{formatCurrency(parseFloat(product.base_price_per_unit) * parseFloat(product.rate_percentage) / 100)}</span>
                    </div>
                    <div className="h-px bg-gray-300 my-2"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">Final Price</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-[#13452D] to-[#1F764D] bg-clip-text text-transparent">
                        {formatCurrency(calculateFinalPrice(product.base_price_per_unit, product.rate_percentage))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <Link href={`/admin/products/${product.product_id}`} className="flex-1">
                    <button className="w-full h-12 px-4 bg-gradient-to-br from-[#13452D] to-[#1F764D] text-white rounded-xl font-semibold hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                      <BarChart3 className="h-4 w-4" />
                      Details
                    </button>
                  </Link>
                  <button
                    onClick={() => handleAddStock(product)}
                    className="h-12 min-w-32 px-5 border-2 border-[#1F764D]/30 bg-[#1F764D]/10 text-[#13452D] rounded-xl hover:border-[#1F764D] hover:bg-[#1F764D]/15 hover:shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-2 text-sm font-semibold whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    Add Stock
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {filteredProducts.length > 0 && totalPages > 1 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredProducts.length)}</span> of <span className="font-semibold text-gray-900">{filteredProducts.length}</span> products
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
                  // Show first page, last page, current page, and pages around current
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
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
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

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="p-6 bg-gray-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
            <Package className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-600 mb-6">No products match your current search criteria.</p>
          <button 
            onClick={() => {setSearchQuery(''); setSelectedNurseries([])}}
            className="px-6 py-3 bg-gradient-to-br from-[#13452D] to-[#1F764D] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}