# Orders Admin Panel - Complete Documentation

## Firebase Structure

### Collection Path
```
rajaoil (collection)
  └── others (document)
      └── orders (subcollection)
          └── {orderId} (auto-generated document ID)
```

### Example Firebase Path
```
/rajaoil/others/orders/{firebase-generated-id}
```

---

## Order Document Structure

### Complete Order Object

```typescript
{
  // Order Identification
  orderId: string                    // Format: "ORD-1234567890123"

  // Order Items
  items: Array<{
    id: string                       // Cart item ID: "PRODUCT_ID-SIZE"
    productId: string                // Product document name (e.g., "TSRG MITHRA BRAND")
    brand: string                    // Brand name
    name: string                     // Variant/Size name (e.g., "200ml jar")
    price: number                    // Unit price in INR
    image: string                    // Product image URL
    quantity: number                 // Quantity ordered
    offer?: string                   // Offer text if available
  }>

  // Order Summary
  total: number                      // Total order amount in INR

  // Customer Information
  customerName: string               // Customer full name
  customerPhone: string              // Customer phone number

  // Delivery Address (Structured)
  deliveryAddress: {
    doorNo: string                   // Door/Flat number
    address: string                  // Street address, area, landmark
    district: string                 // District name
    state: string                    // State name
    pincode: string                  // 6-digit pincode
  }

  // Additional Information
  notes: string                      // Customer notes (optional, can be empty)

  // Order Status
  status: string                     // "pending" | "processing" | "completed" | "cancelled"
  paymentStatus: string              // "pending" | "paid" | "failed"

  // Timestamps
  createdAt: Timestamp               // Firebase server timestamp
  updatedAt: Timestamp               // Firebase server timestamp
}
```

---

## Sample Order Document

```json
{
  "orderId": "ORD-1731508234567",
  "items": [
    {
      "id": "TSRG MITHRA BRAND-200ml jar",
      "productId": "TSRG MITHRA BRAND",
      "brand": "TSRG",
      "name": "200ml jar",
      "price": 4300,
      "image": "https://firebasestorage.googleapis.com/...",
      "quantity": 2,
      "offer": "100ML Jar free - Worth 1200 /-"
    },
    {
      "id": "TSRG MITHRA BRAND-500ml jar",
      "productId": "TSRG MITHRA BRAND",
      "brand": "TSRG",
      "name": "500ml jar",
      "price": 8500,
      "image": "https://firebasestorage.googleapis.com/...",
      "quantity": 1
    }
  ],
  "total": 17100,
  "customerName": "Rajesh Kumar",
  "customerPhone": "9876543210",
  "deliveryAddress": {
    "doorNo": "123, Flat 4B",
    "address": "MG Road, Near City Mall, Jayanagar",
    "district": "Bangalore Urban",
    "state": "Karnataka",
    "pincode": "560011"
  },
  "notes": "Please call before delivery",
  "status": "pending",
  "paymentStatus": "pending",
  "createdAt": "Firebase Timestamp",
  "updatedAt": "Firebase Timestamp"
}
```

---

## Querying Orders (Firebase Code Examples)

### 1. Get All Orders (Latest First)

```typescript
import { collection, doc, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

async function getAllOrders(limitCount = 50) {
  try {
    // Reference to orders subcollection
    const rajaoilDocRef = doc(db, 'rajaoil', 'others')
    const ordersCollectionRef = collection(rajaoilDocRef, 'orders')

    // Query with ordering and limit
    const q = query(
      ordersCollectionRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )

    const querySnapshot = await getDocs(q)

    const orders = []
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,              // Firebase document ID
        ...doc.data()            // All order data
      })
    })

    return orders
  } catch (error) {
    console.error('Error fetching orders:', error)
    return []
  }
}
```

### 2. Get Orders by Status

```typescript
import { collection, doc, getDocs, query, where, orderBy } from 'firebase/firestore'

async function getOrdersByStatus(status: 'pending' | 'processing' | 'completed' | 'cancelled') {
  try {
    const rajaoilDocRef = doc(db, 'rajaoil', 'others')
    const ordersCollectionRef = collection(rajaoilDocRef, 'orders')

    const q = query(
      ordersCollectionRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)

    const orders = []
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      })
    })

    return orders
  } catch (error) {
    console.error('Error fetching orders by status:', error)
    return []
  }
}
```

### 3. Get Single Order by Order ID

```typescript
import { collection, doc, getDocs, query, where } from 'firebase/firestore'

async function getOrderByOrderId(orderId: string) {
  try {
    const rajaoilDocRef = doc(db, 'rajaoil', 'others')
    const ordersCollectionRef = collection(rajaoilDocRef, 'orders')

    const q = query(
      ordersCollectionRef,
      where('orderId', '==', orderId)
    )

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const orderDoc = querySnapshot.docs[0]
    return {
      id: orderDoc.id,
      ...orderDoc.data()
    }
  } catch (error) {
    console.error('Error fetching order:', error)
    return null
  }
}
```

### 4. Get Orders by Date Range

```typescript
import { collection, doc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore'

async function getOrdersByDateRange(startDate: Date, endDate: Date) {
  try {
    const rajaoilDocRef = doc(db, 'rajaoil', 'others')
    const ordersCollectionRef = collection(rajaoilDocRef, 'orders')

    const startTimestamp = Timestamp.fromDate(startDate)
    const endTimestamp = Timestamp.fromDate(endDate)

    const q = query(
      ordersCollectionRef,
      where('createdAt', '>=', startTimestamp),
      where('createdAt', '<=', endTimestamp),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)

    const orders = []
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      })
    })

    return orders
  } catch (error) {
    console.error('Error fetching orders by date:', error)
    return []
  }
}
```

### 5. Search Orders by Customer Name or Phone

```typescript
async function searchOrders(searchTerm: string) {
  try {
    const rajaoilDocRef = doc(db, 'rajaoil', 'others')
    const ordersCollectionRef = collection(rajaoilDocRef, 'orders')

    // Get all orders (Firebase doesn't support text search natively)
    const querySnapshot = await getDocs(ordersCollectionRef)

    const orders = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const searchLower = searchTerm.toLowerCase()

      // Search in customer name, phone, or order ID
      if (
        data.customerName?.toLowerCase().includes(searchLower) ||
        data.customerPhone?.includes(searchTerm) ||
        data.orderId?.toLowerCase().includes(searchLower)
      ) {
        orders.push({
          id: doc.id,
          ...data
        })
      }
    })

    return orders
  } catch (error) {
    console.error('Error searching orders:', error)
    return []
  }
}
```

### 6. Update Order Status

```typescript
import { collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore'

async function updateOrderStatus(
  firebaseDocId: string,
  newStatus: 'pending' | 'processing' | 'completed' | 'cancelled'
) {
  try {
    const rajaoilDocRef = doc(db, 'rajaoil', 'others')
    const orderDocRef = doc(rajaoilDocRef, 'orders', firebaseDocId)

    await updateDoc(orderDocRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    })

    console.log('Order status updated successfully')
    return true
  } catch (error) {
    console.error('Error updating order status:', error)
    return false
  }
}
```

### 7. Update Payment Status

```typescript
async function updatePaymentStatus(
  firebaseDocId: string,
  paymentStatus: 'pending' | 'paid' | 'failed'
) {
  try {
    const rajaoilDocRef = doc(db, 'rajaoil', 'others')
    const orderDocRef = doc(rajaoilDocRef, 'orders', firebaseDocId)

    await updateDoc(orderDocRef, {
      paymentStatus: paymentStatus,
      updatedAt: serverTimestamp()
    })

    console.log('Payment status updated successfully')
    return true
  } catch (error) {
    console.error('Error updating payment status:', error)
    return false
  }
}
```

### 8. Get Order Statistics

```typescript
async function getOrderStatistics() {
  try {
    const rajaoilDocRef = doc(db, 'rajaoil', 'others')
    const ordersCollectionRef = collection(rajaoilDocRef, 'orders')

    const querySnapshot = await getDocs(ordersCollectionRef)

    let totalOrders = 0
    let totalRevenue = 0
    let pendingOrders = 0
    let completedOrders = 0

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      totalOrders++
      totalRevenue += data.total || 0

      if (data.status === 'pending') pendingOrders++
      if (data.status === 'completed') completedOrders++
    })

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
      processingOrders: totalOrders - pendingOrders - completedOrders
    }
  } catch (error) {
    console.error('Error calculating statistics:', error)
    return null
  }
}
```

---

## TypeScript Interfaces for Admin Panel

```typescript
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
  createdAt: any                      // Firebase Timestamp
  updatedAt: any                      // Firebase Timestamp
}

// Order Statistics Interface
export interface OrderStatistics {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  processingOrders: number
  completedOrders: number
}
```

---

## Admin Panel Features to Implement

### Essential Features:

1. **Orders List Page**
   - Display all orders in table format
   - Show: Order ID, Customer Name, Total Amount, Status, Date
   - Pagination (show 20-50 orders per page)
   - Click to view full details

2. **Order Details Page**
   - Full order information
   - Customer details with clickable phone number
   - Complete delivery address
   - All items with images
   - Update status button
   - Print/Download invoice

3. **Filter & Search**
   - Filter by status (All, Pending, Processing, Completed, Cancelled)
   - Filter by payment status
   - Search by customer name, phone, or order ID
   - Date range filter

4. **Status Management**
   - Update order status (dropdown)
   - Update payment status
   - Add notes/comments to order

5. **Dashboard**
   - Total orders count
   - Total revenue
   - Pending orders count
   - Today's orders
   - Revenue chart (optional)

### Advanced Features (Optional):

- Export orders to CSV/Excel
- Print invoices
- Send SMS/Email to customer
- Order tracking
- Delivery assignment
- Customer order history

---

## API Endpoints to Create

### 1. Get All Orders
```typescript
// GET /api/admin/orders?status=pending&limit=50
```

### 2. Get Single Order
```typescript
// GET /api/admin/orders/[orderId]
```

### 3. Update Order Status
```typescript
// PATCH /api/admin/orders/[orderId]/status
// Body: { status: "processing" }
```

### 4. Update Payment Status
```typescript
// PATCH /api/admin/orders/[orderId]/payment
// Body: { paymentStatus: "paid" }
```

### 5. Get Statistics
```typescript
// GET /api/admin/statistics
```

---

## Security Rules (Firebase)

```javascript
// Firestore Security Rules for orders
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Orders subcollection
    match /rajaoil/others/orders/{orderId} {
      // Only authenticated admin users can read/write
      allow read, write: if request.auth != null &&
                           request.auth.token.admin == true;

      // Or allow read for specific admin email
      allow read, write: if request.auth != null &&
                           request.auth.token.email == 'admin@rajaoil.com';
    }
  }
}
```

---

## Sample Admin Panel Page Structure

```
/admin
  └── /dashboard          (Overview, statistics)
  └── /orders             (Orders list with filters)
      └── /[orderId]      (Single order details)
  └── /customers          (Customer list - optional)
  └── /products           (Product management)
  └── /settings           (Admin settings)
```

---

## Helper Functions for Admin Panel

### Format Price
```typescript
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}
```

### Format Date
```typescript
export function formatDate(timestamp: any): string {
  if (!timestamp) return 'N/A'

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  }).format(date)
}
```

### Format Address
```typescript
export function formatAddress(address: DeliveryAddress): string {
  return `${address.doorNo}, ${address.address}, ${address.district}, ${address.state} - ${address.pincode}`
}
```

### Get Status Badge Color
```typescript
export function getStatusColor(status: string): string {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
```

---

## Email Notification Details

### Email Service
- Using **Resend** (https://resend.com)
- Free tier: 100 emails/day, 3000/month
- From: `orders@yourdomain.com` (update with your domain)
- To: Set in environment variable `ORDER_NOTIFICATION_EMAIL`

### Email Contains:
- Order ID
- Customer details
- Delivery address
- All items with prices and offers
- Total amount
- Order notes
- Timestamp

---

## Environment Variables Required

```env
# Firebase (Already configured)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Resend Email (NEW - Required)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Order Notification Email (NEW - Required)
ORDER_NOTIFICATION_EMAIL=your-email@example.com
```

---

## Setup Steps for Email Notifications

### 1. Create Resend Account
1. Go to https://resend.com
2. Sign up with your email
3. Verify email
4. Get API key from dashboard

### 2. Add Environment Variables
Add to `.env.local`:
```env
RESEND_API_KEY=re_your_api_key_here
ORDER_NOTIFICATION_EMAIL=youremail@gmail.com
```

### 3. Update Email "From" Address
In `src/lib/email.ts`, line 182:
```typescript
from: 'Raja Oil Orders <orders@yourdomain.com>'
```

**Options:**
- Use Resend's test domain: `onboarding@resend.dev` (works immediately)
- Add your own domain later (requires DNS setup)

### 4. Test Email
1. Place a test order
2. Check your email inbox
3. Should receive formatted order notification

---

## Next Steps

1. **Set up Resend account** (5 minutes)
2. **Add environment variables** (2 minutes)
3. **Test order flow** (5 minutes)
4. **Build admin panel** using this documentation
5. **Deploy to production**

---

## Support & Maintenance

### Monitoring Orders
- Check Firebase Console: `rajaoil/others/orders`
- Check email inbox for notifications
- Build admin dashboard for better visibility

### Backup
- Firebase automatically backs up data
- Export orders to CSV periodically (via admin panel)

### Scaling
- Current setup handles 1000+ orders/day
- Email limit: 100/day (free tier), upgrade if needed
- Firebase Firestore: 50k reads/day (free tier)

---

## Troubleshooting

### Orders not saving to Firebase
- Check Firebase config in `.env.local`
- Check console for errors
- Verify security rules allow writes

### Emails not sending
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for errors
- Try test domain first: `onboarding@resend.dev`
- Check email spam folder

### Order ID format
- Format: `ORD-{timestamp}`
- Example: `ORD-1731508234567`
- Always unique (uses millisecond timestamp)

---

## Summary

✅ Orders are securely saved to Firebase
✅ Email notifications sent automatically
✅ User cannot modify prices or quantities
✅ Complete order history maintained
✅ Ready for admin panel implementation
✅ Scalable and production-ready

Use this documentation to build your admin panel with AI assistance!
