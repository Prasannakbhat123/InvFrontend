'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Search, Package } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { formatCurrency } from '@/app/lib/utils'
import { toast } from 'sonner'
import { products as productsApi, orders as ordersApi, nurseries as nurseriesApi } from '@/app/lib/api'

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

interface OrderProduct extends Product {
  quantity: number
}

interface Nursery {
  nursery_id: string
  nursery_name: string
}

export default function CreateOrderPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [nurseries, setNurseries] = useState<Nursery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    client_name: '',
    user_id: '',
  })
  
  const [selectedProducts, setSelectedProducts] = useState<OrderProduct[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, nurseriesData] = await Promise.all([
          productsApi.getAll(),
          nurseriesApi.getAll()
        ])
        setAvailableProducts(productsData)
        setNurseries(nurseriesData)
      } catch (error: any) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const addProduct = (product: Product) => {
    const existing = selectedProducts.find(p => p.product_id === product.product_id)
    if (existing) {
      toast.error('Product already added to order')
      return
    }

    if (product.inventory_quantity === 0) {
      toast.error('Product is out of stock')
      return
    }

    // Add new product at the beginning of the array
    setSelectedProducts(prev => [{
      ...product,
      quantity: 1
    }, ...prev])
    setShowProductSearch(false)
    setSearchQuery('')
  }

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.product_id !== productId))
  }

  const updateQuantity = (productId: string, value: string) => {
    // Allow empty string for user to clear and type new value
    if (value === '') {
      setSelectedProducts(prev => prev.map(p => 
        p.product_id === productId ? { ...p, quantity: '' as any } : p
      ))
      return
    }
    
    const quantity = parseInt(value)
    
    // Check if it's a valid number
    if (isNaN(quantity)) {
      return
    }
    
    setSelectedProducts(prev => prev.map(p => {
      if (p.product_id === productId) {
        // Real-time validation
        if (quantity > p.inventory_quantity) {
          toast.error(`Quantity cannot exceed available stock (${p.inventory_quantity})`)
          return { ...p, quantity: p.inventory_quantity }
        }
        if (quantity < 1) {
          return { ...p, quantity }
        }
        return { ...p, quantity }
      }
      return p
    }))
  }

  const calculateProductTotal = (product: OrderProduct) => {
    const basePrice = parseFloat(product.base_price_per_unit)
    const rate = parseFloat(product.rate_percentage)
    const unitPrice = basePrice * (1 + rate / 100)
    return unitPrice * product.quantity
  }

  const getUnitPrice = (product: Product) => {
    const basePrice = parseFloat(product.base_price_per_unit)
    const rate = parseFloat(product.rate_percentage)
    return basePrice * (1 + rate / 100)
  }

  const getNurseryName = (nurseryId: string) => {
    const nursery = nurseries.find(n => n.nursery_id === nurseryId)
    return nursery?.nursery_name || nurseryId
  }

  const calculateOrderTotal = () => {
    return selectedProducts.reduce((sum, product) => sum + calculateProductTotal(product), 0)
  }

  const filteredProducts = availableProducts.filter(product => {
    const inOrder = selectedProducts.some(p => p.product_id === product.product_id)
    const matchesSearch = product.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.size.toLowerCase().includes(searchQuery.toLowerCase())
    return !inOrder && matchesSearch
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedProducts.length === 0) {
      toast.error('Please add at least one product to the order')
      return
    }

    setIsSubmitting(true)

    try {
      // Step 1: Create order
      const orderResponse = await ordersApi.create({
        user_id: formData.user_id,
        client_name: formData.client_name
      })
      
      const orderId = orderResponse.order_id
      
      // Step 2: Add products to order
      for (const product of selectedProducts) {
        await ordersApi.addProduct(orderId, {
          product_id: product.product_id,
          quantity: product.quantity,
          unit_price: parseFloat(product.base_price_per_unit),
          rate_percentage: parseFloat(product.rate_percentage)
        })
      }
      
      toast.success('Order created successfully!')
      router.push('/admin/orders')
    } catch (error: any) {
      console.error('Error creating order:', error)
      toast.error(error.message || 'Failed to create order')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-[#1F764D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Create New Order</h1>
            <p className="text-gray-500 mt-2">Build a new order with products and client details</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Order Information</h2>
                <p className="text-sm text-gray-500">Enter client and admin details</p>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleChange}
                    placeholder="Enter client or company name"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F764D] focus:border-transparent transition-all text-black"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Admin User ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    placeholder="e.g., ADM001"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F764D] focus:border-transparent transition-all text-black"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Use your admin user ID from login
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Order Products</h2>
                  <p className="text-sm text-gray-500">Add products to this order</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProductSearch(!showProductSearch)}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#13452D] to-[#1F764D] text-white rounded-lg font-medium hover:shadow-md transition-all flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </button>
              </div>
              <div className="space-y-4">
                {/* Product Search */}
                {showProductSearch && (
                  <div className="border-2 border-[#1F764D]/20 rounded-xl p-5 bg-gradient-to-br from-green-50/50 to-white">
                    <div className="relative mb-4">
                      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by product name or size..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F764D] focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                      {filteredProducts.map(product => (
                        <div
                          key={product.product_id}
                          onClick={() => addProduct(product)}
                          className="group relative bg-white rounded-xl p-4 cursor-pointer border-2 border-gray-100 hover:border-[#1F764D] hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* Left side - Product info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-gradient-to-br from-[#1F764D]/10 to-[#13452D]/10 rounded-lg group-hover:from-[#1F764D]/20 group-hover:to-[#13452D]/20 transition-colors">
                                  <Package className="h-5 w-5 text-[#1F764D]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-base truncate group-hover:text-[#1F764D] transition-colors">{product.item_name}</h4>
                                  <p className="text-sm text-gray-600 mt-0.5">{product.size}</p>
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="w-1.5 h-1.5 bg-[#1F764D] rounded-full"></span>
                                    <span className="text-xs text-gray-500 font-medium">{getNurseryName(product.nursery_id)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Stock info badges */}
                              <div className="flex gap-2 mt-3">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-md border border-green-200">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                  <span className="text-xs font-semibold text-green-700">Stock: {product.inventory_quantity}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-md border border-blue-200">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  <span className="text-xs font-semibold text-blue-700">Ordered: {product.ordered_quantity}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right side - Price */}
                            <div className="text-right">
                              <div className="px-3 py-1.5 bg-gradient-to-r from-[#13452D] to-[#1F764D] rounded-lg">
                                <p className="text-xs text-white/80 font-medium">Price</p>
                                <p className="text-lg font-bold text-white">
                                  {formatCurrency(getUnitPrice(product))}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Hover indicator */}
                          <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#1F764D] rounded-xl pointer-events-none transition-all"></div>
                        </div>
                      ))}
                      {filteredProducts.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p className="font-medium">No products found</p>
                          <p className="text-sm mt-1">Try a different search term</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Selected Products */}
                {selectedProducts.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-300">
                    <div className="inline-flex p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4 shadow-inner">
                      <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="font-bold text-gray-900 text-lg">No products added yet</p>
                    <p className="text-sm text-gray-500 mt-2">Click "Add Product" to start building your order</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedProducts.map(product => (
                      <div key={product.product_id} className="group relative bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-[#1F764D] hover:shadow-xl transition-all duration-300">
                        {/* Product Header */}
                        <div className="flex items-start gap-4 mb-5">
                          {/* Product Icon */}
                          <div className="p-3 bg-gradient-to-br from-[#1F764D]/10 to-[#13452D]/10 rounded-xl group-hover:from-[#1F764D]/20 group-hover:to-[#13452D]/20 transition-colors">
                            <Package className="h-6 w-6 text-[#1F764D]" />
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-lg mb-1">{product.item_name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{product.size}</p>
                            
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-[#1F764D] rounded-full"></span>
                                <span className="text-xs text-gray-600 font-medium">{getNurseryName(product.nursery_id)}</span>
                              </div>
                            </div>
                            
                            {/* Stock badges */}
                            <div className="flex gap-2">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs font-bold text-green-700">Stock: {product.inventory_quantity}</span>
                              </div>
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-xs font-bold text-blue-700">Ordered: {product.ordered_quantity}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => removeProduct(product.product_id)}
                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110"
                            title="Remove product"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                        
                        {/* Quantity and Price Section */}
                        <div className="grid grid-cols-3 gap-4 pt-5 border-t-2 border-gray-100">
                          <div>
                            <label className="text-xs font-bold text-gray-700 uppercase mb-2 block tracking-wide">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              max={product.inventory_quantity}
                              value={product.quantity || ''}
                              onFocus={(e) => {
                                e.target.select()
                              }}
                              onChange={(e) => updateQuantity(product.product_id, e.target.value)}
                              onBlur={(e) => {
                                if (!e.target.value || parseInt(e.target.value) < 1) {
                                  updateQuantity(product.product_id, '1')
                                }
                              }}
                              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F764D] focus:border-[#1F764D] text-gray-900 font-bold text-center transition-all"
                            />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-gray-700 uppercase mb-2 tracking-wide">Unit Price</p>
                            <div className="px-3 py-2.5 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <p className="text-base font-bold text-gray-900">
                                {formatCurrency(getUnitPrice(product))}
                              </p>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-gray-700 uppercase mb-2 tracking-wide">Subtotal</p>
                            <div className="px-3 py-2.5 bg-gradient-to-r from-[#13452D] to-[#1F764D] rounded-xl shadow-md">
                              <p className="text-base font-bold text-white">
                                {formatCurrency(calculateProductTotal(product))}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Client</span>
                  <span className="font-semibold text-gray-900">{formData.client_name || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Admin ID</span>
                  <span className="font-semibold text-gray-900">{formData.user_id || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Products</span>
                  <span className="font-semibold text-gray-900">{selectedProducts.length}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-600">Total Items</span>
                  <span className="font-semibold text-gray-900">
                    {selectedProducts.reduce((sum, p) => sum + (p.quantity || 0), 0)}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#13452D] to-[#1F764D] rounded-xl p-5 mb-6">
                <p className="text-sm text-white/80 mb-2 font-medium">Order Total</p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(calculateOrderTotal())}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting || selectedProducts.length === 0}
                  className="w-full px-6 py-3.5 bg-gradient-to-r from-[#13452D] to-[#1F764D] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating Order...
                    </span>
                  ) : 'Create Order'}
                </button>
                <Link href="/admin/orders">
                  <button
                    type="button"
                    className="w-full px-6 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium mb-1">Note:</p>
                    <p>Order status will be set to CREATED. You can generate an invoice after order creation.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}