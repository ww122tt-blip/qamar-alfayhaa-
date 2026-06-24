// ============================================
// SHIPMENT TYPES
// ============================================

export type ShipmentStatus =
  | 'new'
  | 'picked_up'
  | 'at_waseet_office'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'failed_delivery'
  | 'cancelled'

export type PricingType = 'per_order' | 'per_kg'

export type UserRole = 'admin' | 'manager' | 'employee'

export type PaymentType = 'cod' | 'delivery_fee' | 'refund' | 'other'

// ============================================
// DATABASE MODELS
// ============================================

export interface Profile {
  id: string
  user_id: string
  name: string
  username: string
  role: UserRole
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  code: string // CR6853
  name: string
  phones: string[]
  governorate: string
  district?: string
  pricing_type: PricingType
  delivery_price: number
  notes?: string
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
  password?: string
  shipping_tag?: string
  warehouse_id?: string
  address?: string
}

export interface ClientPrice {
  id: string
  client_id: string
  warehouse_id: string
  pricing_type: PricingType
  price: number
  created_at: string
}

export interface ClientPricingRule {
  id: string
  client_id: string
  warehouse_id: string
  pricing_type: PricingType
  min_weight: number
  max_weight: number
  created_at: string
}

export interface Shipment {
  id: string
  number: string // SHL_XXX format
  code: string // alternative code field
  client_id: string
  client?: Client
  recipient_name: string
  recipient_phone: string
  governorate: string
  district?: string
  weight?: number
  item_price: number
  delivery_fee: number
  cod_amount: number
  status: ShipmentStatus
  waseet_id?: string
  waseet_status?: string
  warehouse_id?: string
  warehouse?: Warehouse
  shelf_id?: string
  shelf?: Shelf
  notes?: string
  tracking_number?: string
  label_url?: string
  type?: string
  amount?: number
  delivery_price?: number
  created_by?: string
  creator?: Profile
  created_at: string
  updated_at: string
}

export interface ShipmentLog {
  id: string
  shipment_id: string
  old_status?: ShipmentStatus
  new_status: ShipmentStatus
  changed_by?: string
  changer?: Profile
  note?: string
  created_at: string
}

export interface Shelf {
  id: string
  code: string
  status: 'created' | 'sent' | 'received_by_waseet' | 'completed'
  waseet_batch_id?: string
  shipments_count?: number
  sent_at?: string
  created_by?: string
  created_at: string
}

export interface CashBox {
  id: string
  name: string
  currency: 'IQD' | 'USD' | 'KWD'
  balance: number
  notes?: string
  created_at: string
}

export interface Payment {
  id: string
  shipment_id?: string
  shipment?: Shipment
  cash_box_id: string
  cash_box?: CashBox
  amount: number
  type: PaymentType
  note?: string
  created_by?: string
  created_at: string
}

export interface Warehouse {
  id: string
  name: string
  country: string
  governorate?: string
  district?: string
  address?: string
  phone?: string
  features: string[]
  notes?: string
  is_active: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id?: string
  title: string
  content: string
  type: 'shipment' | 'payment' | 'system' | 'whatsapp'
  entity_type?: string
  entity_id?: string
  is_read: boolean
  is_archived: boolean
  created_at: string
}

export interface WhatsAppLog {
  id: string
  recipient_phone: string
  message: string
  status: 'sent' | 'failed' | 'pending'
  shipment_id?: string
  error?: string
  sent_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  user?: Profile
  action: string
  entity_type: string
  entity_id?: string
  details?: Record<string, unknown>
  created_at: string
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface DashboardStats {
  totalShipments: number
  pendingShipments: number
  deliveredShipments: number
  returnedShipments: number
  totalCodAmount: number
  collectedAmount: number
  pendingAmount: number
  totalClients: number
  todayShipments: number
  whatsappSentToday: number
}

// ============================================
// FORM TYPES
// ============================================

export interface CreateClientForm {
  name: string
  phones: string[]
  governorate: string
  district?: string
  pricing_type: PricingType
  delivery_price: number
  notes?: string
}

export interface CreateShipmentForm {
  client_id: string
  recipient_name: string
  recipient_phone: string
  governorate: string
  district?: string
  weight?: number
  item_price: number
  delivery_fee: number
  cod_amount: number
  warehouse_id?: string
  notes?: string
}

// ============================================
// API TYPES
// ============================================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface FilterOptions {
  page?: number
  pageSize?: number
  search?: string
  status?: ShipmentStatus | 'all'
  client_id?: string
  governorate?: string
  dateFrom?: string
  dateTo?: string
  warehouse_id?: string
}

// ============================================
// WASEET API TYPES
// ============================================

export interface WaseetShipmentPayload {
  recipientName: string
  recipientPhone: string
  governorate: string
  district?: string
  weight?: number
  price: number
  deliveryFee: number
  codAmount: number
  notes?: string
}

export interface WaseetShipmentResponse {
  id: string
  trackingNumber: string
  status: string
  createdAt: string
}

// ============================================
// WHATSAPP TYPES
// ============================================

export interface WhatsAppMessage {
  phone: string
  message: string
  shipmentId?: string
}

export interface WhatsAppSettings {
  instanceId: string
  apiToken: string
  adminPhones: string[]
  notifications: {
    newShipment: boolean
    statusChange: boolean
    returned: boolean
    dailyReport: boolean
  }
  templates: {
    newShipment: string
    outForDelivery: string
    delivered: string
    returned: string
    failedDelivery: string
    adminNewShipment: string
  }
}
