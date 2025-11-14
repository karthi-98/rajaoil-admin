import { NextRequest, NextResponse } from 'next/server'
import { collection, doc, getDocs, query, orderBy, limit, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Order } from '@/types/order'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limitCount = parseInt(searchParams.get('limit') || '50')
    const searchTerm = searchParams.get('search')

    // Reference to orders subcollection
    const rajaoilDocRef = doc(db, 'rajaoil', 'others')
    const ordersCollectionRef = collection(rajaoilDocRef, 'orders')

    let q

    // Build query based on filters
    if (status && status !== 'all') {
      q = query(
        ordersCollectionRef,
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )
    } else {
      q = query(
        ordersCollectionRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )
    }

    const querySnapshot = await getDocs(q)

    let orders: Order[] = []
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data()
      orders.push({
        id: docSnapshot.id,
        ...data,
        // Convert Firestore Timestamp to ISO string for JSON serialization
        createdAt: data.createdAt?.toDate().toISOString() || null,
        updatedAt: data.updatedAt?.toDate().toISOString() || null
      } as Order)
    })

    // If search term is provided, filter in memory
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      orders = orders.filter((order) => {
        return (
          order.customerName?.toLowerCase().includes(searchLower) ||
          order.customerPhone?.includes(searchTerm) ||
          order.orderId?.toLowerCase().includes(searchLower)
        )
      })
    }

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders'
      },
      { status: 500 }
    )
  }
}
