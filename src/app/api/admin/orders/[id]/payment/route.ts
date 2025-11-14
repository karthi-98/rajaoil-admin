import { NextRequest, NextResponse } from 'next/server'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { paymentStatus } = await request.json()
    const { id: orderId } = await params

    if (!paymentStatus || !['pending', 'paid', 'failed'].includes(paymentStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment status value'
        },
        { status: 400 }
      )
    }

    const rajaoilDocRef = doc(db, 'rajaoil', 'others')
    const orderDocRef = doc(rajaoilDocRef, 'orders', orderId)

    await updateDoc(orderDocRef, {
      paymentStatus,
      updatedAt: serverTimestamp()
    })

    return NextResponse.json({
      success: true,
      message: 'Payment status updated successfully'
    })
  } catch (error) {
    console.error('Error updating payment status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update payment status'
      },
      { status: 500 }
    )
  }
}
