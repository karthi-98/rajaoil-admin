import { NextRequest, NextResponse } from 'next/server'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await request.json()
    const { id: orderId } = await params

    if (!status || !['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status value'
        },
        { status: 400 }
      )
    }

    const rajaoilDocRef = doc(db, 'rajaoil', 'others')
    const orderDocRef = doc(rajaoilDocRef, 'orders', orderId)

    await updateDoc(orderDocRef, {
      status,
      updatedAt: serverTimestamp()
    })

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully'
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update order status'
      },
      { status: 500 }
    )
  }
}
