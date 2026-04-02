'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ScanLine, CheckCircle, Package, AlertCircle } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { BarcodeScanner } from '@/app/components/barcode/BarcodeScanner'
import { toast } from 'sonner'
import { orders as ordersApi, products as productsApi, scans as scansApi } from '@/app/lib/api'
import { formatCurrency } from '@/app/lib/utils'
import { convertToEAN13Format, calculateEAN13CheckDigit } from '@/app/lib/barcodePrinter'

interface OrderProduct {
  product_id: string
  name: string
  size: string
  quantity: number
  unit_price: string
  total_price: string
  scanned_quantity: number
}

interface Order {
  order_id: string
  client_name: string
  status: string
  total_order_amount: string
  paid_at: string | null
}

const initialProducts: OrderProduct[] = []

export default function EmployeeOrderScanPage({ params }: { params: Promise<{ id: string }> }) {
  const [orderId, setOrderId] = useState<string>('')
  const [order, setOrder] = useState<Order | null>(null)
  const [products, setProducts] = useState<OrderProduct[]>(initialProducts)
  const [isLoading, setIsLoading] = useState(true)
  const [scannerActive, setScannerActive] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setOrderId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (!orderId) return

    const fetchOrderDetails = async () => {
      try {
        const orderData = await ordersApi.getById(orderId)
        
        setOrder({
          order_id: orderData.order_id,
          client_name: orderData.client_name,
          status: orderData.status,
          total_order_amount: orderData.total_order_amount,
          paid_at: orderData.paid_at || null,
        })

        // Fetch product details for each item
        const productDetails = await Promise.all(
          orderData.items.map(async (item) => {
            try {
              const product = await productsApi.getById(item.product_id)
              return {
                product_id: item.product_id,
                name: product.item_name,
                size: product.size,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                scanned_quantity: 0, // TODO: Fetch from scan logs
              }
            } catch (error) {
              console.error(`Error fetching product ${item.product_id}:`, error)
              return {
                product_id: item.product_id,
                name: 'Unknown Product',
                size: 'N/A',
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                scanned_quantity: 0,
              }
            }
          })
        )

        setProducts(productDetails)

        // Load existing scan logs so scanned_quantity is accurate on re-visit
        try {
          const scanData = await scansApi.getForOrder(orderId)
          if (scanData.scanned_quantities) {
            setProducts(prev =>
              prev.map(p => ({
                ...p,
                scanned_quantity: scanData.scanned_quantities[p.product_id] ?? 0,
              }))
            )
          }
        } catch {
          // Non-fatal – UI still works without restored scan counts
        }
      } catch (error: any) {
        console.error('Error fetching order:', error)
        toast.error(error.message || 'Failed to load order details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId])

  const handleScan = async (barcode: string) => {
    // Do NOT close the scanner — user wants to keep scanning
    // Strip any non-digit characters a scanner might add (prefix/suffix/CR/LF)
    const cleanBarcode = barcode.replace(/\D/g, '')
    if (!cleanBarcode) {
      toast.error('Invalid barcode — no digits received')
      return
    }

    // EAN-13 scanners send 13 digits (12-digit base + check digit).
    // Some scanners drop leading zeros, so we also compare stripped versions.
    const stripLeadingZeros = (s: string) => s.replace(/^0+/, '') || '0'

    const matched = products.find(p => {
      const ean12     = convertToEAN13Format(p.product_id)          // 12 digits
      const ean13Full = ean12 + calculateEAN13CheckDigit(ean12)     // 13 digits
      return (
        cleanBarcode === ean13Full ||
        cleanBarcode === ean12 ||
        stripLeadingZeros(cleanBarcode) === stripLeadingZeros(ean13Full) ||
        stripLeadingZeros(cleanBarcode) === stripLeadingZeros(ean12)
      )
    })

    if (!matched) {
      toast.error('Scanned barcode does not match any product in this order')
      return
    }

    if (matched.scanned_quantity >= matched.quantity) {
      toast.warning(`${matched.name} is already fully scanned`)
      return
    }

    try {
      await scansApi.record({
        order_id: orderId,
        product_id: matched.product_id,
        quantity_scanned: 1,
      })

      setProducts(prev =>
        prev.map(p =>
          p.product_id === matched.product_id
            ? { ...p, scanned_quantity: p.scanned_quantity + 1 }
            : p
        )
      )
      toast.success(`Scanned: ${matched.name} (${matched.scanned_quantity + 1}/${matched.quantity})`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to record scan')
    }
  }

  const handleManualScan = async (productId: string) => {
    const product = products.find(p => p.product_id === productId)

    if (!product) return

    if (product.scanned_quantity >= product.quantity) {
      toast.warning(`${product.name} is already fully scanned`)
      return
    }

    try {
      await scansApi.record({
        order_id: orderId,
        product_id: productId,
        quantity_scanned: 1,
      })

      setProducts(prev =>
        prev.map(p =>
          p.product_id === productId
            ? { ...p, scanned_quantity: p.scanned_quantity + 1 }
            : p
        )
      )
      toast.success(`Scanned: ${product.name} (${product.scanned_quantity + 1}/${product.quantity})`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to record scan')
    }
  }

  const handleCompleteOrder = async () => {
    const allScanned = products.every(p => p.scanned_quantity >= p.quantity)

    if (!allScanned) {
      toast.error('Please scan all required products before completing the order')
      return
    }

    try {
      await ordersApi.updateStatus(orderId, 'COMPLETED')
      toast.success('Order completed successfully!')
      toast.info('Admin has been notified')
      if (order) {
        setOrder({ ...order, status: 'COMPLETED' })
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete order')
    }
  }

  const totalRequired = products.reduce((sum, p) => sum + p.quantity, 0)
  const totalScanned = products.reduce((sum, p) => sum + p.scanned_quantity, 0)
  const progress = totalRequired > 0 ? (totalScanned / totalRequired) * 100 : 0
  const allComplete = products.every(p => p.scanned_quantity >= p.quantity) && products.length > 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Not Found</h3>
            <p className="text-gray-600 mb-4">The order you're looking for doesn't exist or is not accessible.</p>
            <Link href="/employee/orders">
              <Button>Back to Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/employee/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{order.order_id}</h1>
            <p className="text-gray-600 mt-1">Client: {order.client_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setScannerActive(true)}
            size="lg"
            disabled={order.status === 'COMPLETED'}
          >
            <ScanLine className="h-5 w-5 mr-2" />
            Open Scanner
          </Button>
          {allComplete && order.status !== 'COMPLETED' && (
            <Button
              onClick={handleCompleteOrder}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Complete Order
            </Button>
          )}
        </div>
      </div>

      {/* Order Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                order.status === 'COMPLETED'
                  ? 'bg-green-100 text-green-800'
                  : order.status === 'IN_PROGRESS'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {order.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-lg font-semibold mt-1">{formatCurrency(parseFloat(order.total_order_amount))}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-lg font-semibold mt-1">{totalRequired}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Paid Status</p>
              <p className="text-lg font-semibold mt-1 text-green-600">
                {order.paid_at ? '✓ Paid' : 'Not Paid'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Banner */}
      <Card className={`border-l-4 ${
        allComplete && order.status === 'COMPLETED'
          ? 'border-l-green-500 bg-green-50'
          : allComplete
          ? 'border-l-green-500 bg-green-50'
          : progress > 0
          ? 'border-l-blue-500 bg-blue-50'
          : 'border-l-gray-300 bg-gray-50'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-lg font-semibold">
                Progress: {totalScanned} of {totalRequired} items scanned
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {order.status === 'COMPLETED'
                  ? '✓ Order completed and ready for delivery'
                  : allComplete
                  ? 'All products scanned! Ready to complete order.'
                  : `${totalRequired - totalScanned} items remaining`
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-600">{Math.round(progress)}%</p>
              <p className="text-sm text-gray-600">Complete</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${
                allComplete ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      {!allComplete && order.status !== 'COMPLETED' && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">📱 Scanning Instructions</p>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Use the "Open Scanner" button or click "Scan" next to each product</li>
                  <li>Scan products one at a time for accurate inventory tracking</li>
                  <li>Partial scans are allowed - you can scan in multiple sessions</li>
                  <li>Complete all required quantities before marking order as complete</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Order Items</h2>
        {products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No products found in this order</p>
            </CardContent>
          </Card>
        ) : (
          products.map((product) => {
            const isComplete = product.scanned_quantity >= product.quantity
            const remaining = product.quantity - product.scanned_quantity

            return (
              <Card key={product.product_id} className={isComplete ? 'border-green-200 bg-green-50' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Product Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-4 rounded-full ${
                        isComplete ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {isComplete ? (
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        ) : (
                          <Package className="h-8 w-8 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{product.name}</h3>
                          {isComplete && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              ✓ Complete
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {product.size} • {formatCurrency(parseFloat(product.unit_price))} per unit
                        </p>
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-xs text-gray-600">Required</p>
                            <p className="font-semibold">{product.quantity}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Scanned</p>
                            <p className="font-semibold text-blue-600">{product.scanned_quantity}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Remaining</p>
                            <p className={`font-semibold ${
                              remaining === 0 ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {remaining}
                            </p>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    isComplete ? 'bg-green-600' : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${(product.scanned_quantity / product.quantity) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-600 w-10">
                                {Math.round((product.scanned_quantity / product.quantity) * 100)}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Line Total</p>
                            <p className="font-semibold">{formatCurrency(parseFloat(product.total_price))}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      {!isComplete && order.status !== 'COMPLETED' && (
                        <Button
                          onClick={() => handleManualScan(product.product_id)}
                          size="lg"
                        >
                          <ScanLine className="h-5 w-5 mr-2" />
                          Scan
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isActive={scannerActive}
        onScan={handleScan}
        onClose={() => setScannerActive(false)}
        products={products}
      />
    </div>
  )
}