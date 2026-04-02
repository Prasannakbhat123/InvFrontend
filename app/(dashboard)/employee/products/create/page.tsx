'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { nurseries as nurseriesApi, products as productsApi } from '@/app/lib/api'

interface Nursery {
  nursery_id: string
  nursery_name: string
}

const FIXED_EMPLOYEE_RATE = 2.25

export default function EmployeeCreateProductPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [nurseries, setNurseries] = useState<Nursery[]>([])
  const [formData, setFormData] = useState({
    item_name: '',
    size: '',
    inventory_quantity: '',
    base_price_per_unit: '',
    nursery_id: '',
    image_url: '',
  })

  useEffect(() => {
    const loadNurseries = async () => {
      try {
        const data = await nurseriesApi.getAll()
        setNurseries(data)
      } catch (error) {
        toast.error('Failed to load nurseries')
      } finally {
        setIsLoading(false)
      }
    }
    loadNurseries()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.item_name || !formData.size || !formData.inventory_quantity || !formData.base_price_per_unit || !formData.nursery_id) {
        toast.error('Please fill all required fields')
        return
      }

      const response = await productsApi.create({
        nursery_id: formData.nursery_id,
        item_name: formData.item_name.trim(),
        size: formData.size.trim(),
        inventory_quantity: Number(formData.inventory_quantity),
        ordered_quantity: 0,
        base_price_per_unit: Number(formData.base_price_per_unit),
        rate_percentage: FIXED_EMPLOYEE_RATE,
        image_url: formData.image_url.trim() || null,
      })

      toast.success(response.message || 'Product added successfully')
      toast.info('Admin has been notified')
      setFormData({
        item_name: '',
        size: '',
        inventory_quantity: '',
        base_price_per_unit: '',
        nursery_id: '',
        image_url: '',
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to add product')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/employee">
          <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Product</h1>
          <p className="text-sm text-gray-600">Employee product entry with fixed rate policy</p>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-emerald-700 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900">Rate is fixed for employees</p>
            <p className="text-sm text-emerald-700">Rate is locked to {FIXED_EMPLOYEE_RATE}% and cannot be edited.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input name="item_name" value={formData.item_name} onChange={handleChange} className="w-full h-11 rounded-lg border border-gray-300 px-3 text-gray-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Size *</label>
            <input name="size" value={formData.size} onChange={handleChange} className="w-full h-11 rounded-lg border border-gray-300 px-3 text-gray-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nursery *</label>
            <select name="nursery_id" value={formData.nursery_id} onChange={handleChange} className="w-full h-11 rounded-lg border border-gray-300 px-3 bg-white text-gray-900" disabled={isLoading} required>
              <option value="">Select nursery</option>
              {nurseries.map(n => <option key={n.nursery_id} value={n.nursery_id}>{n.nursery_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Inventory *</label>
            <input type="number" min="0" name="inventory_quantity" value={formData.inventory_quantity} onChange={handleChange} className="w-full h-11 rounded-lg border border-gray-300 px-3 text-gray-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Price *</label>
            <input type="number" min="0" step="0.01" name="base_price_per_unit" value={formData.base_price_per_unit} onChange={handleChange} className="w-full h-11 rounded-lg border border-gray-300 px-3 text-gray-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate (%)</label>
            <input value={FIXED_EMPLOYEE_RATE.toFixed(2)} disabled className="w-full h-11 rounded-lg border border-gray-300 px-3 bg-gray-100 text-gray-600" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
          <input name="image_url" value={formData.image_url} onChange={handleChange} className="w-full h-11 rounded-lg border border-gray-300 px-3 text-gray-900" />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#13452D] to-[#1F764D] px-5 py-3 text-white font-semibold disabled:opacity-50"
        >
          <CheckCircle className="h-4 w-4" />
          {isSubmitting ? 'Saving...' : 'Add Product'}
        </button>
      </form>
    </div>
  )
}
