'use client'

import { useState } from 'react'
import { Order } from '@/types/order'
import { formatPrice, formatDate, formatAddress, getStatusColor, getPaymentStatusColor } from '@/lib/orderUtils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Phone, MapPin, Package, Calendar, FileText, Save, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface OrderDetailsSheetProps {
  order: Order
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export default function OrderDetailsSheet({ order, open, onOpenChange, onUpdate }: OrderDetailsSheetProps) {
  const [status, setStatus] = useState(order.status)
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus)
  const [updating, setUpdating] = useState(false)

  const handleUpdateStatus = async () => {
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
          throw new Error('Failed to update status')
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

      onUpdate()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const hasChanges = status !== order.status || paymentStatus !== order.paymentStatus

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] max-w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            View and manage order information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order ID and Date */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="text-lg font-bold">{order.orderId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                    <Calendar className="h-3 w-3" />
                    Placed on
                  </p>
                  <p className="text-sm font-medium">{formatDate(order.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order Status</p>
                  <Badge className={getStatusColor(order.status)} variant="outline">
                    {order.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                  <Badge className={getPaymentStatusColor(order.paymentStatus)} variant="outline">
                    {order.paymentStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{order.customerName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a href={`tel:${order.customerPhone}`} className="font-medium text-blue-600 hover:underline">
                      {order.customerPhone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Address</p>
                    <p className="font-medium">{formatAddress(order.deliveryAddress)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Order Items ({order.items.length})</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={item.id}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="flex gap-4">
                        <div className="relative w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.brand}</p>
                          <p className="text-sm text-muted-foreground">{item.name}</p>
                          {item.offer && (
                            <p className="text-xs text-green-600 mt-1">{item.offer}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-sm">Qty: {item.quantity}</p>
                            <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(order.total)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Customer Notes
              </h3>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm">{order.notes}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Status Update Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Update Order Status</h3>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="status">Order Status</Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
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
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as typeof paymentStatus)}>
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
                  className="w-full"
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
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
