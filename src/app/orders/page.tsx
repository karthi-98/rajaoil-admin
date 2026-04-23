'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Order } from '@/types/order'
import { formatPrice, formatDate, getStatusColor, getPaymentStatusColor } from '@/lib/orderUtils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Filter, RefreshCw, Eye, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'
import { deleteOrderFromFirestore, fetchOrdersFromFirestore } from '@/lib/orderFirestore'

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      let filteredOrders = await fetchOrdersFromFirestore({
        status: statusFilter,
        searchTerm,
        limitCount: 100,
      })

      // Filter by payment status if not 'all'
      if (paymentFilter !== 'all') {
        filteredOrders = filteredOrders.filter((order: Order) => order.paymentStatus === paymentFilter)
      }

      setOrders(filteredOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, paymentFilter])

  const handleSearch = () => {
    fetchOrders()
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchOrders()
    setIsRefreshing(false)
  }

  const handleViewDetails = (order: Order) => {
    router.push(`/orders/${order.id}`)
  }

  const openDeleteDialog = (order: Order) => {
    setOrderToDelete(order)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return

    try {
      setIsDeleting(true)
      await deleteOrderFromFirestore(orderToDelete.id)
      toast.success(`Order ${orderToDelete.orderId} deleted successfully`)
      setIsDeleteDialogOpen(false)
      setOrderToDelete(null)
      fetchOrders()
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Failed to delete order')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Orders Management</h2>
        <p className="text-muted-foreground">View and manage all customer orders</p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row">
        {/* Search */}
        <div className="flex-1">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name, phone, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} variant="outline" disabled={!searchTerm.trim()}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {/* Order Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Order Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Payment Status Filter */}
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleRefresh}
            variant="outline"
            size="icon"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">Orders List</h3>
          <p className="text-sm text-muted-foreground">
            Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No orders found</p>
            <p className="text-sm">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderId}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.customerPhone}</TableCell>
                  <TableCell>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</TableCell>
                  <TableCell className="font-semibold">{formatPrice(order.total)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)} variant="outline">
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPaymentStatusColor(order.paymentStatus)} variant="outline">
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetails(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteDialog(order)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              {orderToDelete && (
                <>
                  This will permanently delete order <span className="font-semibold">{orderToDelete.orderId}</span> from {orderToDelete.customerName}. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
