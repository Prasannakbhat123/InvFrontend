// API configuration and helper functions

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.windscapesai.com/api/v1'

export const API_ENDPOINTS = {
  // Auth endpoints
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  me: `${API_BASE_URL}/auth/me`,
  
  // Product endpoints
  products: `${API_BASE_URL}/products`,
  productsAll: `${API_BASE_URL}/products/all`,
  productById: (id: string) => `${API_BASE_URL}/products/${id}`,
  productAdd: `${API_BASE_URL}/products/add`,
  productAddStock: (id: string) => `${API_BASE_URL}/products/${id}/add-stock`,
  
  // Order endpoints
  orders: `${API_BASE_URL}/orders`,
  ordersAll: `${API_BASE_URL}/orders/all`,
  ordersPaid: `${API_BASE_URL}/orders/paid`,
  orderById: (id: string) => `${API_BASE_URL}/orders/${id}`,
  orderCreate: `${API_BASE_URL}/orders/create`,
  orderAddProduct: (orderId: string) => `${API_BASE_URL}/orders/${orderId}/add-product`,
  orderRemoveProduct: (orderId: string) => `${API_BASE_URL}/orders/${orderId}/remove-product`,
  orderStatus: (orderId: string) => `${API_BASE_URL}/orders/${orderId}/complete`,
  
  // Nursery endpoints
  nurseries: `${API_BASE_URL}/nursery`,
  nurseryAll: `${API_BASE_URL}/nursery/all`,
  nurseryById: (id: string) => `${API_BASE_URL}/nursery/${id}`,
  nurseryAdd: `${API_BASE_URL}/nursery/add`,
  
  // Analytics endpoints
  analyticsOverview: `${API_BASE_URL}/analytics/overview`,
  analyticsDesigners: `${API_BASE_URL}/analytics/designers`,
  analyticsTopProducts: `${API_BASE_URL}/analytics/products/top`,
  analyticsRevenueTrend: `${API_BASE_URL}/analytics/revenue-trend`,
  analyticsOrdersTrend: `${API_BASE_URL}/analytics/orders-trend`,
  
  // Employee endpoints
  employees: `${API_BASE_URL}/employees/employees`,
  employeeById: (id: string) => `${API_BASE_URL}/employees/employees/${id}`,
  employeeCreate: `${API_BASE_URL}/employees/create`,
  
  // Event endpoints
  events: `${API_BASE_URL}/events`,
  eventsAll: `${API_BASE_URL}/events/all`,
  eventById: (id: string) => `${API_BASE_URL}/events/${id}`,
  eventCreate: `${API_BASE_URL}/events/create`,
  eventUpdate: (id: string) => `${API_BASE_URL}/events/${id}`,
  eventDelete: (id: string) => `${API_BASE_URL}/events/${id}`,
  
  // Notification endpoints
  notifications: `${API_BASE_URL}/notifications`,
  lowStockNotifications: `${API_BASE_URL}/notifications/low-stock`,

  // Scan endpoints
  recordScan: `${API_BASE_URL}/employees/scan`,
  scanLogsForOrder: (orderId: string) => `${API_BASE_URL}/employees/scans?order_id=${orderId}`,
}

// Helper function for API calls with authentication
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token')
  
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  const response = await fetch(endpoint, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

// Auth helper functions
export const auth = {
  login: async (username: string, password: string) => {
    const response = await apiCall<{
      access_token: string
      role: string
      user_id: string
    }>(API_ENDPOINTS.login, {
      method: 'POST',
      body: JSON.stringify({
        user_username: username,
        user_password: password,
      }),
    })
    
    // Store token in localStorage
    localStorage.setItem('access_token', response.access_token)
    localStorage.setItem('user_role', response.role)
    localStorage.setItem('user_id', response.user_id)
    
    return response
  },
  
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_role')
    localStorage.removeItem('user_id')
  },
  
  getMe: async () => {
    return apiCall<{
      user_id: string
      user_username: string
      role: string
      created_at: string
    }>(API_ENDPOINTS.me)
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token')
  },
  
  getRole: () => {
    return localStorage.getItem('user_role')
  },
}

// Product API functions
export const products = {
  getAll: async () => {
    return apiCall<Array<{
      product_id: string
      nursery_id: string
      item_name: string
      size: string
      inventory_quantity: number
      ordered_quantity: number
      base_price_per_unit: string
      rate_percentage: string
      image_url?: string | null
    }>>(API_ENDPOINTS.productsAll)
  },
  
  getById: async (id: string) => {
    return apiCall<{
      product_id: string
      nursery_id: string
      item_name: string
      size: string
      inventory_quantity: number
      ordered_quantity: number
      base_price_per_unit: string
      rate_percentage: string
      image_url?: string | null
    }>(API_ENDPOINTS.productById(id))
  },
  
  create: async (data: {
    nursery_id: string
    item_name: string
    size: string
    inventory_quantity: number
    ordered_quantity?: number
    base_price_per_unit: number
    rate_percentage?: number
    image_url?: string | null
  }) => {
    return apiCall<{
      product_id: string
      message: string
    }>(API_ENDPOINTS.productAdd, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  addStock: async (productId: string, quantity: number) => {
    return apiCall<{
      product_id: string
      added_quantity: number
      inventory_quantity: number
      message: string
    }>(API_ENDPOINTS.productAddStock(productId), {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    })
  },
}

// Order API functions
export const orders = {
  getAll: async () => {
    return apiCall<Array<{
      order_id: string
      user_id: string
      client_name: string
      status: string
      total_order_amount: string
      ordered_at: string
      updated_at: string
      invoice_generated_at?: string | null
      paid_at?: string | null
      items_count: number
    }>>(API_ENDPOINTS.ordersAll)
  },
  
  getPaid: async () => {
    return apiCall<Array<{
      order_id: string
      user_id: string
      client_name: string
      status: string
      total_order_amount: string
      ordered_at: string
      updated_at: string
      invoice_generated_at?: string | null
      paid_at?: string | null
      items_count: number
    }>>(API_ENDPOINTS.ordersPaid)
  },
  
  getById: async (id: string) => {
    return apiCall<{
      order_id: string
      user_id: string
      client_name: string
      status: string
      total_order_amount: string
      ordered_at: string
      updated_at: string
      invoice_generated_at?: string | null
      paid_at?: string | null
      items: Array<{
        product_id: string
        quantity: number
        unit_price: string
        rate_percentage: string | null
        total_price: string
      }>
    }>(API_ENDPOINTS.orderById(id))
  },
  
  create: async (data: {
    user_id: string
    client_name: string
  }) => {
    return apiCall<{
      order_id: string
      status: string
      message: string
    }>(API_ENDPOINTS.orderCreate, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  addProduct: async (orderId: string, data: {
    product_id: string
    quantity: number
    unit_price: number
    rate_percentage?: number
  }) => {
    return apiCall<{
      order_id: string
      product_id: string
      quantity: number
      line_total: string
      order_total: string
      message: string
    }>(API_ENDPOINTS.orderAddProduct(orderId), {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  removeProduct: async (orderId: string, data: {
    product_id: string
    quantity?: number
  }) => {
    return apiCall<{
      order_id: string
      product_id: string
      order_total: string
      message: string
    }>(API_ENDPOINTS.orderRemoveProduct(orderId), {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  updateStatus: async (orderId: string, status: string) => {
    return apiCall<{
      order_id: string
      old_status?: string
      new_status?: string
      status?: string
      message: string
    }>(API_ENDPOINTS.orderStatus(orderId), {
      method: 'PATCH',
    })
  },
  
  generateInvoice: async (orderId: string) => {
    return apiCall<{
      message: string
      order_id: string
      invoice_generated_at: string
    }>(`${API_BASE_URL}/orders/${orderId}/generate-invoice`, {
      method: 'POST',
    })
  },
  
  markPaid: async (orderId: string) => {
    return apiCall<{
      message: string
      order_id: string
      paid_at: string
      status: string
    }>(`${API_BASE_URL}/orders/${orderId}/mark-paid`, {
      method: 'POST',
    })
  },
}

// Nursery API functions
export const nurseries = {
  getAll: async () => {
    return apiCall<Array<{
      nursery_id: string
      nursery_name: string
    }>>(API_ENDPOINTS.nurseryAll)
  },
  
  getById: async (id: string) => {
    return apiCall<{
      nursery_id: string
      nursery_name: string
    }>(API_ENDPOINTS.nurseryById(id))
  },
  
  create: async (data: {
    nursery_name: string
  }) => {
    return apiCall<{
      nursery_id: string
      message: string
    }>(API_ENDPOINTS.nurseryAdd, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// Analytics API functions
export const analytics = {
  getOverview: async () => {
    return apiCall<{
      total_revenue: string
      total_orders: number
      total_products: number
      active_employees: number
      orders_by_status: Record<string, number>
      revenue_growth: number
      orders_growth: number
    }>(API_ENDPOINTS.analyticsOverview)
  },
  
  getDesigners: async () => {
    return apiCall<Array<{
      user_id: string
      username: string
      orders: number
      revenue: string
      avg_order_value: string
    }>>(API_ENDPOINTS.analyticsDesigners)
  },
  
  getTopProducts: async (limit: number = 10) => {
    return apiCall<Array<{
      product_id: string
      name: string
      sold: number
      revenue: string
    }>>(`${API_ENDPOINTS.analyticsTopProducts}?limit=${limit}`)
  },
  
  getRevenueTrend: async (days: number = 30) => {
    return apiCall<Array<{
      date: string
      revenue: number
    }>>(`${API_ENDPOINTS.analyticsRevenueTrend}?days=${days}`)
  },
  
  getOrdersTrend: async (days: number = 30) => {
    return apiCall<Array<{
      date: string
      orders: number
    }>>(`${API_ENDPOINTS.analyticsOrdersTrend}?days=${days}`)
  },
}
// Employee API functions
export const employees = {
  getAll: async () => {
    return apiCall<Array<{
      employee_id: string
      username: string
      role: string
      created_at: string
      items_scanned: number
      orders_completed: number
      status: string
    }>>(API_ENDPOINTS.employees)
  },
  
  getById: async (id: string) => {
    return apiCall<{
      employee_id: string
      username: string
      role: string
      created_at: string
      items_scanned: number
      orders_completed: number
      inventory_updated: number
      products_added_count: number
      status: string
      scanned_products: Array<{
        product_id: string
        item_name: string
        size: string
        total_scanned: number
        last_scanned_at: string
      }>
      scanned_orders: Array<{
        order_id: string
        client_name: string
        status: string
        scan_events: number
        total_scanned: number
        last_scanned_at: string
      }>
      inventory_updates: Array<{
        notification_id: string
        product_id: string
        item_name?: string | null
        size?: string | null
        title: string
        message: string
        created_at: string
      }>
      recent_scans: Array<{
        scan_id: string
        order_id: string
        product_id: string
        scanned_quantity: number
        scanned_at: string
      }>
    }>(API_ENDPOINTS.employeeById(id))
  },
  
  create: async (data: { username: string; password: string }) => {
    return apiCall<{
      employee_id: string
      username: string
      message: string
    }>(API_ENDPOINTS.employeeCreate, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// Scan API functions
export const scans = {
  record: async (data: {
    order_id: string
    product_id: string
    quantity_scanned: number
  }) => {
    return apiCall<{
      scan_id: string
      product_id: string
      quantity_scanned: number
      new_inventory_quantity: number
      message: string
    }>(API_ENDPOINTS.recordScan, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getForOrder: async (orderId: string) => {
    return apiCall<{
      order_id: string
      scanned_quantities: Record<string, number>
    }>(API_ENDPOINTS.scanLogsForOrder(orderId))
  },
}

// Event API functions
export const events = {
  getAll: async () => {
    return apiCall<Array<{
      event_id: string
      event_name: string
      event_date: string
      event_time: string
      created_by: string
      created_at: string
      updated_at: string
    }>>(API_ENDPOINTS.eventsAll)
  },
  
  getById: async (id: string) => {
    return apiCall<{
      event_id: string
      event_name: string
      event_date: string
      event_time: string
      created_by: string
      created_at: string
      updated_at: string
    }>(API_ENDPOINTS.eventById(id))
  },
  
  create: async (data: { event_name: string; event_date: string; event_time: string }) => {
    return apiCall<{
      event_id: string
      event_name: string
      event_date: string
      event_time: string
      created_by: string
      created_at: string
      updated_at: string
    }>(API_ENDPOINTS.eventCreate, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  update: async (id: string, data: Partial<{ event_name: string; event_date: string; event_time: string }>) => {
    return apiCall<{
      event_id: string
      event_name: string
      event_date: string
      event_time: string
      created_by: string
      created_at: string
      updated_at: string
    }>(API_ENDPOINTS.eventUpdate(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  
  delete: async (id: string) => {
    return apiCall<{ message: string }>(API_ENDPOINTS.eventDelete(id), {
      method: 'DELETE',
    })
  },
}

export const notifications = {
  getAll: async () => {
    return apiCall<Array<{
      notification_id: string
      type: string
      title: string
      message: string
      actor_user_id?: string | null
      reference_id?: string | null
      created_at: string
    }>>(API_ENDPOINTS.notifications)
  },

  getLowStock: async () => {
    return apiCall<Array<{
      product_id: string
      item_name: string
      size: string
      current_stock: number
      threshold: number
      nursery_id: string
      created_at: string
    }>>(API_ENDPOINTS.lowStockNotifications)
  },
}