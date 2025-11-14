import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // Reference to the specific order document
    const rajaoilDocRef = doc(db, 'rajaoil', 'others')
    const orderDocRef = doc(rajaoilDocRef, 'orders', orderId)

    const orderDoc = await getDoc(orderDocRef)

    if (!orderDoc.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found'
        },
        { status: 404 }
      )
    }

    const data = orderDoc.data()
    const order = {
      id: orderDoc.id,
      ...data,
      // Convert Firestore Timestamp to ISO string for JSON serialization
      createdAt: data.createdAt?.toDate().toISOString() || null,
      updatedAt: data.updatedAt?.toDate().toISOString() || null
    }

    return NextResponse.json({
      success: true,
      order
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch order'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // Reference to the specific order document
    const rajaoilDocRef = doc(db, 'rajaoil', 'others')
    const orderDocRef = doc(rajaoilDocRef, 'orders', orderId)

    // Check if order exists
    const orderDoc = await getDoc(orderDocRef)
    if (!orderDoc.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found'
        },
        { status: 404 }
      )
    }

    // Delete the order
    await deleteDoc(orderDocRef)

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete order'
      },
      { status: 500 }
    )
  }
}
