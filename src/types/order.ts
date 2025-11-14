// Order Item Interface
export interface OrderItem {
  id: string
  productId: string
  brand: string
  name: string
  price: number
  image: string
  quantity: number
  offer?: string
}

// Delivery Address Interface
export interface DeliveryAddress {
  doorNo: string
  address: string
  district: string
  state: string
  pincode: string
}

// Complete Order Interface
export interface Order {
  id: string                          // Firebase document ID
  orderId: string                     // Order ID (ORD-xxxxx)
  items: OrderItem[]
  total: number
  customerName: string
  customerPhone: string
  deliveryAddress: DeliveryAddress
  notes: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed'
  createdAt: string | null            // ISO string from Firebase Timestamp
  updatedAt: string | null            // ISO string from Firebase Timestamp
}

// Order Statistics Interface
export interface OrderStatistics {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  processingOrders: number
  completedOrders: number
}
