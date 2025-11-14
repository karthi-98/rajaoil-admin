import { DeliveryAddress } from '@/types/order'

// Type for Firestore Timestamp or other date formats
type TimestampType = { toDate: () => Date } | string | number | Date | null | undefined

// Format Price
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

// Format Date
export function formatDate(timestamp: TimestampType): string {
  if (!timestamp) return 'N/A'

  const date = timestamp && typeof timestamp === 'object' && 'toDate' in timestamp
    ? timestamp.toDate()
    : new Date(timestamp as string | number | Date)

  // Check if date is valid
  if (isNaN(date.getTime())) return 'N/A'

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  }).format(date)
}

// Format Address
export function formatAddress(address: DeliveryAddress): string {
  return `${address.doorNo}, ${address.address}, ${address.district}, ${address.state} - ${address.pincode}`
}

// Get Status Badge Color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    processing: 'bg-blue-100 text-blue-800 border-blue-300',
    completed: 'bg-green-100 text-green-800 border-green-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
}

// Get Payment Status Badge Color
export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    paid: 'bg-green-100 text-green-800 border-green-300',
    failed: 'bg-red-100 text-red-800 border-red-300',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
}
