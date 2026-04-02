'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Plus, Printer, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { toast } from 'sonner'
import { products as productsApi, nurseries as nurseriesApi } from '@/app/lib/api'
import { printBarcode } from '@/app/lib/barcodePrinter'

interface Nursery {
  nursery_id: string
  nursery_name: string
}

export default function CreateProductPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nurseries, setNurseries] = useState<Nursery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [printStatus, setPrintStatus] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [createdProductId, setCreatedProductId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    item_name: '',
    size: '',
    inventory_quantity: '',
    base_price_per_unit: '',
    rate_percentage: '',
    nursery_id: '',
    image_url: ''
  })

  useEffect(() => {
    const loadNurseries = async () => {
      try {
        const data = await nurseriesApi.getAll()
        setNurseries(data)
      } catch (error: any) {
        console.error('Error fetching nurseries:', error)
        toast.error('Failed to load nurseries')
      } finally {
        setIsLoading(false)
      }
    }
    loadNurseries()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleManualPrint = async () => {
    if (!createdProductId) {
      toast.error('No product to print barcodes for')
      return
    }

    const quantity = parseInt(formData.inventory_quantity)
    if (quantity <= 0) {
      toast.error('Invalid quantity for printing')
      return
    }

    try {
      toast.info(`Printing ${quantity} barcode(s)...`)
      await printBarcode(createdProductId, formData.item_name, quantity)
      setPrintStatus({
        success: true,
        message: `${quantity} barcode(s) printed successfully`
      })
      toast.success('Barcodes printed successfully!')
    } catch (error: any) {
      console.error('Failed to print barcode:', error)
      setPrintStatus({
        success: false,
        message: error.message || 'Failed to print barcodes'
      })
      toast.error('Failed to print barcodes')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setPrintStatus(null)

    // Open the print window NOW (synchronously, while still in the user-gesture context)
    // Browsers block window.open called after async/await, so we must open it here.
    const printWindow = window.open('', '_blank')

    try {
      // Validate required fields
      if (!formData.nursery_id || !formData.item_name || !formData.size || 
          !formData.inventory_quantity || !formData.base_price_per_unit || !formData.rate_percentage) {
        toast.error('Please fill in all required fields')
        // Close the blank window we opened if validation fails
        printWindow?.close()
        setIsSubmitting(false)
        return
      }

      // Prepare data for API
      const productData = {
        nursery_id: formData.nursery_id,
        item_name: formData.item_name.trim(),
        size: formData.size.trim(),
        inventory_quantity: parseInt(formData.inventory_quantity),
        ordered_quantity: 0,
        base_price_per_unit: parseFloat(formData.base_price_per_unit),
        rate_percentage: parseFloat(formData.rate_percentage),
        // Only include image_url if it's a valid URL, otherwise send null
        image_url: formData.image_url.trim() && formData.image_url.startsWith('http') 
          ? formData.image_url.trim() 
          : null
      }

      // Call the API
      const response = await productsApi.create(productData)
      const productId = response.product_id
      
      toast.success('Product created successfully!')
      toast.info(`Product ID: ${productId}`)
      setCreatedProductId(productId)

      // Automatically print barcodes
      const quantity = parseInt(formData.inventory_quantity)
      if (quantity > 0) {
        try {
          toast.info(`Preparing to print ${quantity} barcode(s)...`)
          await printBarcode(productId, formData.item_name, quantity, printWindow)
          setPrintStatus({
            success: true,
            message: `${quantity} barcode(s) printed successfully`
          })
          toast.success('Barcodes printed successfully!')
        } catch (error: any) {
          console.error('Failed to print barcode:', error)
          // Close the pre-opened blank window if printing failed
          printWindow?.close()
          setPrintStatus({
            success: false,
            message: error.message || 'Failed to print barcode. Product was created successfully.'
          })
          toast.error('Failed to print barcodes. You can reprint from the products list.')
        }
      }
      
      // Redirect after a delay
      setTimeout(() => {
        router.push('/admin/products')
      }, 2000)
    } catch (error: any) {
      console.error('Error creating product:', error)
      toast.error(error.message || 'Failed to create product')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-1">Create a new product with automatic barcode generation</p>
        </div>
      </div>

      {/* Print Status Alert */}
      {printStatus && (
        <Card className={printStatus.success ? 'border-emerald-500 bg-emerald-50' : 'border-orange-500 bg-orange-50'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${printStatus.success ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                {printStatus.success ? (
                  <Check className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${printStatus.success ? 'text-emerald-700' : 'text-orange-700'}`}>
                  {printStatus.message}
                </p>
                {!printStatus.success && createdProductId && (
                  <p className="text-sm text-orange-600 mt-1">
                    You can reprint the barcodes using the button below.
                  </p>
                )}
              </div>
              {!printStatus.success && createdProductId && (
                <Button
                  onClick={handleManualPrint}
                  variant="outline"
                  size="sm"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Retry Print
                </Button>
              )}
              <Button
                onClick={() => setPrintStatus(null)}
                variant="ghost"
                size="sm"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>Enter the basic details of the product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <Input
                      name="item_name"
                      value={formData.item_name}
                      onChange={handleChange}
                      placeholder="e.g., Japanese Maple"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size *
                    </label>
                    <Input
                      name="size"
                      value={formData.size}
                      onChange={handleChange}
                      placeholder="e.g., Small (3-4 ft)"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nursery *
                    </label>
                    <select
                      name="nursery_id"
                      value={formData.nursery_id}
                      onChange={handleChange}
                      className="w-full h-10 border border-gray-300 rounded-md px-3 bg-white"
                      required
                      disabled={isLoading}
                    >
                      <option value="">Select nursery</option>
                      {nurseries.map(nursery => (
                        <option key={nursery.nursery_id} value={nursery.nursery_id}>
                          {nursery.nursery_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory & Pricing</CardTitle>
                <CardDescription>Set initial inventory and pricing details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Inventory *
                    </label>
                    <Input
                      type="number"
                      name="inventory_quantity"
                      value={formData.inventory_quantity}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Barcodes will be auto-generated
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Price ($) *
                    </label>
                    <Input
                      type="number"
                      name="base_price_per_unit"
                      value={formData.base_price_per_unit}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate (%) *
                    </label>
                    <Input
                      type="number"
                      name="rate_percentage"
                      value={formData.rate_percentage}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                </div>

                {formData.base_price_per_unit && formData.rate_percentage && (
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Final Price:</span>
                      <span className="text-xl font-bold text-emerald-600">
                        ${(
                          parseFloat(formData.base_price_per_unit) *
                          (1 + parseFloat(formData.rate_percentage) / 100)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Image</CardTitle>
                <CardDescription>Upload or provide image URL (optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG or GIF (max. 5MB)</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or paste image URL
                  </label>
                  <Input
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Product Name:</span>
                    <span className="font-medium">{formData.item_name || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{formData.size || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Initial Stock:</span>
                    <span className="font-medium">{formData.inventory_quantity || '0'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Price:</span>
                    <span className="font-medium">
                      ${formData.base_price_per_unit || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rate:</span>
                    <span className="font-medium">{formData.rate_percentage || '0'}%</span>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Final Price:</span>
                    <span className="text-xl font-bold text-emerald-600">
                      ${formData.base_price_per_unit && formData.rate_percentage
                        ? (
                            parseFloat(formData.base_price_per_unit) *
                            (1 + parseFloat(formData.rate_percentage) / 100)
                          ).toFixed(2)
                        : '0.00'
                      }
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Product'}
                  </Button>
                  <Link href="/admin/products" className="block">
                    <Button variant="outline" className="w-full" type="button">
                      Cancel
                    </Button>
                  </Link>
                </div>

                <div className="text-xs text-gray-500 text-center pt-4 border-t">
                  <p>Barcodes will be automatically generated</p>
                  <p>equal to inventory quantity</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}