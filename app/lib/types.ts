export type UserRole = 'ADMIN' | 'EMPLOYEE'

export type OrderStatus = 'CREATED' | 'IN_PROGRESS' | 'COMPLETED'

export interface User {
  user_id: string
  user_username: string
  user_password: string
  role: UserRole
  created_at: Date
}

export interface Nursery {
  nursery_id: string
  nursery_name: string
}

export interface Product {
  product_id: string
  nursery_id: string
  item_name: string
  size: string
  inventory_quantity: number
  ordered_quantity: number
  base_price_per_unit: number
  rate_percentage: number
  image_url?: string
  nursery?: Nursery
}

export interface Order {
  order_id: string
  user_id: string
  client_name: string
  total_order_amount: number
  status: OrderStatus
  ordered_at: Date
  updated_at: Date
  invoice_generated_at?: Date
  paid_at?: Date
  user?: User
  ordered_products?: OrderedProduct[]
}

export interface OrderedProduct {
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  rate_percentage?: number
  total_price: number
  product?: Product
}

export interface EmployeeScanLog {
  scan_id: string
  employee_id: string
  order_id: string
  product_id: string
  scanned_quantity: number
  scanned_at: Date
  employee?: User
  order?: Order
  product?: Product
}

export interface CreateProductFormData {
  item_name: string
  size: string
  inventory_quantity: number
  base_price_per_unit: number
  rate_percentage: number
  nursery_id: string
  image_url?: string
}

export interface CreateOrderFormData {
  client_name: string
  user_id: string
  products: Array<{
    product_id: string
    quantity: number
  }>
}

export interface LoginFormData {
  username: string
  password: string
}