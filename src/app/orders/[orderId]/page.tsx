'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Order } from '@/types/order'
import { formatPrice, formatDate, formatAddress, getStatusColor, getPaymentStatusColor } from '@/lib/orderUtils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Phone, MapPin, Package, Calendar, FileText, Save, Loader2, ArrowLeft, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import { toast } from 'sonner'

export default function OrderDetailsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params)
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [updating, setUpdating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchOrderDetails()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/orders/${orderId}`)
      const data = await response.json()

      if (data.success) {
        setOrder(data.order)
        setStatus(data.order.status)
        setPaymentStatus(data.order.paymentStatus)
      } else {
        console.error('Failed to fetch order:', data.error)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!order) return

    try {
      setUpdating(true)

      // Update order status if changed
      if (status !== order.status) {
        const statusResponse = await fetch(`/api/admin/orders/${order.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        })

        if (!statusResponse.ok) {
          throw new Error('Failed to update order status')
        }
      }

      // Update payment status if changed
      if (paymentStatus !== order.paymentStatus) {
        const paymentResponse = await fetch(`/api/admin/orders/${order.id}/payment`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentStatus })
        })

        if (!paymentResponse.ok) {
          throw new Error('Failed to update payment status')
        }
      }

      // Update the local state instead of refetching
      setOrder({
        ...order,
        status: status as Order['status'],
        paymentStatus: paymentStatus as Order['paymentStatus']
      })

      toast.success('Order updated successfully', {
        description: 'Order status and payment status have been updated.'
      })
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order', {
        description: error instanceof Error ? error.message : 'Please try again.'
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!order) return

    try {
      setDeleting(true)

      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete order')
      }

      toast.success('Order deleted successfully', {
        description: `Order ${order.orderId} has been permanently deleted.`
      })

      // Redirect to orders page after successful deletion
      router.push('/orders')
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Failed to delete order', {
        description: error instanceof Error ? error.message : 'Please try again.'
      })
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-96 w-full rounded-lg" />
            </div>
            <div className="space-y-5">
              <Skeleton className="h-80 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/orders')} className="hover:bg-gray-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Order Details</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <p className="text-lg font-medium text-gray-900">Order not found</p>
            <p className="text-sm text-gray-500">The order you&apos;re looking for doesn&apos;t exist</p>
            <Button onClick={() => router.push('/orders')} className="bg-gray-900 hover:bg-gray-800 text-white mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const hasChanges = status !== order.status || paymentStatus !== order.paymentStatus

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/orders')} className="hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900">Order Details</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage and track order information</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(true)}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Order
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-5">
          {/* Order ID and Date */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Order ID</p>
                  <p className="text-xl font-semibold text-gray-900">{order.orderId}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center justify-end gap-1.5 mb-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Placed on
                  </p>
                  <p className="text-sm font-medium text-gray-700">{formatDate(order.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Order Status</p>
                  <Badge className={getStatusColor(order.status)} variant="outline">
                    {order.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Payment Status</p>
                  <Badge className={getPaymentStatusColor(order.paymentStatus)} variant="outline">
                    {order.paymentStatus}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Customer Information</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 bg-gray-50 rounded-lg">
                  <Package className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Name</p>
                  <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                  <a href={`tel:${order.customerPhone}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    {order.customerPhone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 bg-gray-50 rounded-lg">
                  <MapPin className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Delivery Address</p>
                  <p className="text-sm font-medium text-gray-900 leading-relaxed">{formatAddress(order.deliveryAddress)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Order Items ({order.items.length})</h3>
            </div>
            <div className="p-6">
              <div className="space-y-5">
                {order.items.map((item, index) => (
                  <div key={item.id}>
                    {index > 0 && <div className="border-t border-gray-100 my-5" />}
                    <div className="flex items-start gap-4">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-200">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{item.brand}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{item.name}</p>
                        {item.offer && (
                          <p className="text-xs text-green-600 font-medium mt-1.5 bg-green-50 inline-block px-2 py-0.5 rounded">{item.offer}</p>
                        )}
                        <div className="flex items-start justify-between mt-3 gap-4">
                          <p className="text-sm text-gray-500">Quantity: <span className="font-medium text-gray-900">{item.quantity}</span></p>
                          <p className="font-semibold text-gray-900 whitespace-nowrap">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 mt-6 pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold text-gray-900">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(order.total)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  Customer Notes
                </h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-700 leading-relaxed">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-5">
          {/* Status Update Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-24">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Update Status</h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <Label htmlFor="status" className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Order Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentStatus" className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Payment Status</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger id="paymentStatus" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleUpdateStatus}
                disabled={!hasChanges || updating}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 rounded-lg p-4 my-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order ID:</span>
                <span className="font-medium text-gray-900">{order.orderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Customer:</span>
                <span className="font-medium text-gray-900">{order.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total:</span>
                <span className="font-medium text-gray-900">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrder}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
