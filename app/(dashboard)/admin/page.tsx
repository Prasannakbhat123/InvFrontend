'use client'

import { useState, useEffect } from 'react'
import { Package, ShoppingCart, Users, TrendingUp, AlertCircle, DollarSign, CheckCircle, Clock, Box, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { analytics as analyticsApi, orders as ordersApi } from '@/app/lib/api'
import { formatCurrency, formatDate } from '@/app/lib/utils'
import EventCalendar from '@/app/components/calendar/EventCalendar'

interface AnalyticsData {
  total_revenue: string
  total_orders: number
  total_products: number
  active_employees: number
  orders_by_status: Record<string, number>
  revenue_growth: number
  orders_growth: number
}

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

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsData, ordersData] = await Promise.all([
          analyticsApi.getOverview(),
          ordersApi.getAll()
        ])
        setAnalytics(analyticsData)
        setRecentOrders(ordersData.slice(0, 5))
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
    
    // Set up interval for real-time updates — 5 min is plenty; analytics queries are expensive
    const interval = setInterval(fetchData, 300000)
    
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-[#1F764D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  const stats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(parseFloat(analytics.total_revenue)),
      change: `${analytics.revenue_growth > 0 ? '+' : ''}${analytics.revenue_growth.toFixed(1)}% from last month`,
      icon: DollarSign,
      isHighlighted: true,
      growth: analytics.revenue_growth,
    },
    {
      title: 'Total Orders',
      value: analytics.total_orders.toString(),
      change: `${analytics.orders_growth > 0 ? '+' : ''}${analytics.orders_growth.toFixed(1)}% from last month`,
      icon: ShoppingCart,
      isHighlighted: false,
      growth: analytics.orders_growth,
    },
    {
      title: 'Total Products',
      value: analytics.total_products.toString(),
      change: 'Active inventory',
      icon: Package,
      isHighlighted: false,
      growth: 0,
    },
    {
      title: 'Active Employees',
      value: analytics.active_employees.toString(),
      change: 'Team members',
      icon: Users,
      isHighlighted: false,
      growth: 0,
    },
  ]
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#13452D] to-[#1F764D] rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-white/90 text-lg">Plan, prioritize, and accomplish your tasks with ease.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/orders/create">
              <button className="px-6 py-3 bg-white text-[#13452D] rounded-lg font-semibold hover:bg-white/90 transition-all flex items-center gap-2 cursor-pointer">
                <span className="text-xl">+</span>
                Create Order
              </button>
            </Link>
            {/* <Link href="/admin/analytics">
              <button className="px-6 py-3 bg-white/20 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/30 transition-all cursor-pointer">
                Import Data
              </button>
            </Link> */}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className={`rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${
              stat.isHighlighted 
                ? 'bg-gradient-to-br from-[#13452D] to-[#1F764D] text-white' 
                : 'bg-white border border-gray-100'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <p className={`text-sm font-medium ${stat.isHighlighted ? 'text-white/80' : 'text-gray-600'}`}>
                  {stat.title}
                </p>
                <div className={`p-2 rounded-lg ${stat.isHighlighted ? 'bg-white/20' : 'bg-gray-100'}`}>
                  <Icon className={`h-5 w-5 ${stat.isHighlighted ? 'text-white' : 'text-gray-700'}`} />
                </div>
              </div>
              <div className="mb-3">
                <div className={`text-4xl font-bold ${stat.isHighlighted ? 'text-white' : 'text-gray-900'}`}>
                  {stat.value}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {stat.growth !== 0 && (
                  <div className={`flex items-center gap-1 ${stat.isHighlighted ? 'text-white/90' : 'text-gray-600'}`}>
                    <svg className={`h-4 w-4 ${stat.growth > 0 ? 'text-green-500' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.growth > 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                    </svg>
                    <p className="text-xs font-medium">{stat.change}</p>
                  </div>
                )}
                {stat.growth === 0 && (
                  <p className={`text-xs font-medium ${stat.isHighlighted ? 'text-white/90' : 'text-gray-600'}`}>
                    {stat.change}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
              <p className="text-gray-600 text-sm mt-1">Latest order activities</p>
            </div>
            <Link href="/admin/orders">
              <button className="px-4 py-2 text-[#1F764D] border-2 border-[#1F764D] font-semibold rounded-lg hover:bg-[#1F764D] hover:text-white transition-all duration-300 cursor-pointer">
                View All
              </button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders found</p>
            ) : (
              recentOrders.map((order) => (
                <Link key={order.order_id} href={`/admin/orders/${order.order_id}`}>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 hover:shadow-md transition-all cursor-pointer">
                    <div>
                      <p className="font-bold text-gray-900">{order.order_id}</p>
                      <p className="text-sm text-gray-600">{order.client_name}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(new Date(order.ordered_at))}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 mb-2">{formatCurrency(parseFloat(order.total_order_amount))}</p>
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-700'
                          : order.status === 'PAID'
                          ? 'bg-[#1F764D]/10 text-[#1F764D]'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quick Stats</h2>
            <p className="text-gray-600 text-sm mt-1">Overview of key metrics</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.total_products}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#13452D]/10 to-[#1F764D]/10 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-[#13452D] to-[#1F764D] rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.active_employees}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Revenue Growth</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.revenue_growth.toFixed(1)}%</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.total_orders}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500 rounded-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(parseFloat(analytics.total_revenue))}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500 rounded-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.orders_by_status.pending || 0}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-cyan-100/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500 rounded-lg">
                  <Box className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Processing Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.orders_by_status.processing || 0}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-600 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.orders_by_status.completed || 0}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Orders Growth</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.orders_growth > 0 ? '+' : ''}{analytics.orders_growth.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Calendar */}
      <EventCalendar />

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          <p className="text-gray-600 text-sm mt-1">Frequently used actions for efficient management</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/admin/products/create">
            <div className="h-24 flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-300">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <p className="font-semibold text-blue-700">Add New Product</p>
            </div>
          </Link>
          <Link href="/admin/orders/create">
            <div className="h-24 flex items-center gap-3 p-4 bg-gradient-to-r from-[#13452D]/10 to-[#1F764D]/10 rounded-xl hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-[#1F764D]">
              <div className="p-3 bg-gradient-to-br from-[#13452D] to-[#1F764D] rounded-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <p className="font-semibold text-[#13452D]">Create Order</p>
            </div>
          </Link>
          <Link href="/admin/analytics">
            <div className="h-24 flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-300">
              <div className="p-3 bg-purple-500 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <p className="font-semibold text-purple-700">View Analytics</p>
            </div>
          </Link>
          <Link href="/admin/employees">
            <div className="h-24 flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-amber-300">
              <div className="p-3 bg-amber-500 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <p className="font-semibold text-amber-700">Manage Team</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}