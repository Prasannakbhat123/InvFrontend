'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, ScanLine, CheckCircle, Package, ArrowRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/app/lib/utils'
import { orders as ordersApi } from '@/app/lib/api'
import { toast } from 'sonner'

interface Order {
  order_id: string
  user_id: string
  client_name: string
  total_order_amount: string
  status: string
  ordered_at: string
  updated_at: string
  invoice_generated_at?: string | null
  paid_at?: string | null
  items_count: number
}

export default function EmployeeOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await ordersApi.getPaid()
        setOrders(data)
      } catch (error: any) {
        console.error('Error fetching orders:', error)
        toast.error('Failed to load orders')
      } finally {
        setIsLoading(false)
      }
    }
    fetchOrders()
  }, [])

  // Filter orders based on search and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-[#1F764D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#13452D] to-[#1F764D] rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Paid Orders</h1>
        <p className="text-white/90 text-lg">
          Scan and process orders that have been paid. Only paid orders are shown here.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#13452D] to-[#1F764D] rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Total Paid Orders</p>
              <p className="text-4xl font-bold">{orders.length}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <ScanLine className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">In Progress</p>
              <p className="text-4xl font-bold text-[#1F764D]">
                {orders.filter(o => o.status === 'IN_PROGRESS').length}
              </p>
            </div>
            <div className="p-3 bg-[#1F764D]/10 rounded-xl">
              <Package className="h-8 w-8 text-[#1F764D]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Completed</p>
              <p className="text-4xl font-bold text-green-600">
                {orders.filter(o => o.status === 'COMPLETED').length}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID or client name..."
                className="w-full h-12 pl-12 pr-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#1F764D] transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-gradient-to-r from-[#13452D] to-[#1F764D] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 cursor-pointer ${
                statusFilter === 'IN_PROGRESS'
                  ? 'bg-gradient-to-r from-[#13452D] to-[#1F764D] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 cursor-pointer ${
                statusFilter === 'COMPLETED'
                  ? 'bg-gradient-to-r from-[#13452D] to-[#1F764D] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <ScanLine className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'No orders match your current filters.'
                : 'No paid orders are available at the moment.'}
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
                className="px-6 py-3 bg-gradient-to-r from-[#13452D] to-[#1F764D] text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.order_id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#1F764D]">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-gray-900">{order.order_id}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                        order.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {order.status === 'IN_PROGRESS' ? (
                        <>
                          <Package className="h-3 w-3" />
                          In Progress
                        </>
                      ) : order.status === 'COMPLETED' ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </>
                      ) : (
                        <>
                          <ScanLine className="h-3 w-3" />
                          Ready to Start
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-lg font-medium text-gray-700 mb-4">{order.client_name}</p>

                  <div className="flex items-center gap-8 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Items:</span>
                      <span className="font-semibold text-gray-900">{order.items_count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(parseFloat(order.total_order_amount))}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Paid:</span>
                      <span className="font-semibold text-gray-900">{formatDate(order.paid_at || '')}</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="ml-6">
                  <Link href={`/employee/orders/${order.order_id}`}>
                    <button
                      className={`px-6 py-4 rounded-xl font-bold text-base flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                        order.status === 'IN_PROGRESS'
                          ? 'bg-gradient-to-r from-[#13452D] to-[#1F764D] text-white hover:shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <ScanLine className="h-5 w-5" />
                      {order.status === 'IN_PROGRESS'
                        ? 'Continue Scanning'
                        : order.status === 'COMPLETED'
                        ? 'View Details'
                        : 'Start Scanning'}
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl p-6 border-l-4 border-l-[#1F764D]">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-[#1F764D] rounded-lg">
            <ScanLine className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg mb-1">📋 Important Information</p>
            <p className="text-gray-700">
              Only paid orders are visible here. Click "Start Scanning" or "Continue Scanning" to process order items.
              Make sure to scan all items before marking an order as complete.
            </p>
          </div>
        </div>
      </div>    </div>
  )
}