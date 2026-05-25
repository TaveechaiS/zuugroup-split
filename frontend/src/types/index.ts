// ============================================================
// ZUUGROUP - TypeScript Types
// ============================================================

export type UserRole = 'admin' | 'manager' | 'sales' | 'cfo'

export type ProductStatus = 'available' | 'unavailable'

export type QuotationStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export type OrderStatus = 'draft' | 'pending_review' | 'processing' | 'completed' | 'rejected'

export type CustomerRequestStatus = 'pending' | 'approved' | 'rejected'

// ─────────────────────────────────────────────────────────────
// User
// ─────────────────────────────────────────────────────────────
export interface User {
  id: string
  first_name: string
  last_name: string
  phone?: string
  email: string
  role: UserRole
  team_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
  team?: Team
}

// ─────────────────────────────────────────────────────────────
// Team
// ─────────────────────────────────────────────────────────────
export interface Team {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  members?: User[]
}

// ─────────────────────────────────────────────────────────────
// Customer
// ─────────────────────────────────────────────────────────────
export interface Customer {
  id: string
  company_name: string
  address?: string
  location_image_url?: string
  contact_name?: string
  phone?: string
  email?: string
  drug_license_number?: string
  drug_license_image_url?: string
  hospital_license_image_url?: string
  created_by?: string
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────────────────────
// Customer Request
// ─────────────────────────────────────────────────────────────
export interface CustomerRequest {
  id: string
  company_name: string
  address?: string
  location_image_url?: string
  contact_name?: string
  phone?: string
  email?: string
  drug_license_number?: string
  drug_license_image_url?: string
  hospital_license_image_url?: string
  requested_by?: string
  status: CustomerRequestStatus
  reviewed_by?: string
  reviewed_at?: string
  reject_reason?: string
  created_at: string
  updated_at: string
  requester?: User
}

// ─────────────────────────────────────────────────────────────
// Product Category
// ─────────────────────────────────────────────────────────────
export interface ProductCategory {
  id: string
  name: string
  created_at: string
}

// ─────────────────────────────────────────────────────────────
// Product
// ─────────────────────────────────────────────────────────────
export interface Product {
  id: string
  name: string
  quantity: number
  price_per_unit: number
  category_id?: string
  unit?: string
  image_url?: string
  status: ProductStatus
  created_at: string
  updated_at: string
  category?: ProductCategory
}

// ─────────────────────────────────────────────────────────────
// Quotation
// ─────────────────────────────────────────────────────────────
export interface Quotation {
  id: string
  quotation_number: string
  customer_id: string
  created_by: string
  approved_by?: string
  vat_percent: number
  subtotal: number
  vat_amount: number
  total_amount: number
  notes?: string
  contract_period_days?: number
  status: QuotationStatus
  reject_reason?: string
  approved_at?: string
  quotation_date: string
  created_at: string
  updated_at: string
  customer?: Customer
  creator?: User
  approver?: User
  items?: QuotationItem[]
}

export interface QuotationItem {
  id: string
  quotation_id: string
  product_id: string
  quantity: number
  unit_price: number
  negotiated_price?: number
  total_price: number
  created_at: string
  product?: Product
}

// ─────────────────────────────────────────────────────────────
// Order
// ─────────────────────────────────────────────────────────────
export interface Order {
  id: string
  order_number: string
  customer_id: string
  created_by: string
  reviewed_by?: string
  processed_by?: string
  total_amount: number
  status: OrderStatus
  reject_reason?: string
  order_date: string
  reviewed_at?: string
  processed_at?: string
  created_at: string
  updated_at: string
  customer?: Customer
  creator?: User
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  product?: Product
}

// ─────────────────────────────────────────────────────────────
// Notification
// ─────────────────────────────────────────────────────────────
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  related_entity_type?: string
  related_entity_id?: string
  created_at: string
}

// ─────────────────────────────────────────────────────────────
// Activity Log
// ─────────────────────────────────────────────────────────────
export interface ActivityLog {
  id: string
  user_id?: string
  action: string
  entity_type?: string
  entity_id?: string
  description?: string
  ip_address?: string
  user_agent?: string
  created_at: string
  user?: User
}

// ─────────────────────────────────────────────────────────────
// Dashboard Stats Types
// ─────────────────────────────────────────────────────────────
export interface AdminDashboardStats {
  total_users: number
  total_customers: number
  total_products: number
  low_stock_products: number
  total_orders: number
  pending_orders: number
  total_teams: number
  recent_orders: Order[]
}

export interface ManagerDashboardStats {
  team_quotations_count: number
  team_orders_count: number
  pending_approvals: number
  team_sales_total: number
  rejected_count: number
  monthly_chart: { month: string; amount: number }[]
}

export interface SalesDashboardStats {
  my_quotations_count: number
  my_orders_count: number
  approved_quotations: number
  rejected_quotations: number
  completed_orders: number
  pending_orders: number
  monthly_sales: { month: string; amount: number }[]
}

export interface CfoDashboardStats {
  total_revenue: number
  monthly_revenue: number
  total_quotations: number
  total_orders: number
  completed_orders: number
  top_products: { name: string; total: number }[]
  top_customers: { name: string; total: number }[]
  monthly_chart: { month: string; revenue: number; orders: number }[]
  team_performance: { team: string; revenue: number }[]
}
