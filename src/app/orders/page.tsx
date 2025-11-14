'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Order } from '@/types/order'
import { formatPrice, formatDate, getStatusColor, getPaymentStatusColor } from '@/lib/orderUtils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Filter, RefreshCw, Eye } from 'lucide-react'

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: statusFilter,
        limit: '100'
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/admin/orders?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        let filteredOrders = data.orders

        // Filter by payment status if not 'all'
        if (paymentFilter !== 'all') {
          filteredOrders = filteredOrders.filter((order: Order) => order.paymentStatus === paymentFilter)
        }

        setOrders(filteredOrders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, paymentFilter])

  const handleSearch = () => {
    fetchOrders()
  }

  const handleViewDetails = (order: Order) => {
    router.push(`/orders/${order.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Orders Management</h2>
        <p className="text-muted-foreground">View and manage all customer orders</p>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
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

              <Button onClick={fetchOrders} variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders List</CardTitle>
          <CardDescription>
            Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <div className="rounded-md border">
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(order)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
