import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import { Order } from "@/types/order"

type FirestoreDate = {
  toDate?: () => Date
}

interface FetchOrdersOptions {
  status?: string
  searchTerm?: string
  limitCount?: number
}

function toIsoDate(value: FirestoreDate | string | number | Date | null | undefined) {
  if (!value) return null

  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString()
  }

  const date = new Date(value as string | number | Date)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function orderFromSnapshot(docSnapshot: DocumentSnapshot<DocumentData>): Order {
  const data = docSnapshot.data() || {}

  return {
    id: docSnapshot.id,
    orderId: data.orderId || docSnapshot.id,
    items: data.items || [],
    total: data.total || 0,
    customerName: data.customerName || "",
    customerPhone: data.customerPhone || "",
    deliveryAddress: data.deliveryAddress || {
      doorNo: "",
      address: "",
      district: "",
      state: "",
      pincode: "",
    },
    notes: data.notes || "",
    status: data.status || "pending",
    paymentStatus: data.paymentStatus || "pending",
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
  }
}

export async function fetchOrdersFromFirestore({
  status = "all",
  searchTerm = "",
  limitCount = 100,
}: FetchOrdersOptions = {}) {
  const ordersRef = collection(db, "rajaoil", "others", "orders")
  const ordersQuery = query(ordersRef, orderBy("createdAt", "desc"), limit(limitCount))
  const querySnapshot = await getDocs(ordersQuery)

  let orders = querySnapshot.docs.map(orderFromSnapshot)

  if (status !== "all") {
    const statusLower = status.toLowerCase()
    orders = orders.filter((order) => order.status?.toLowerCase() === statusLower)
  }

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

  return orders
}

export async function fetchOrderFromFirestore(orderId: string) {
  const orderRef = doc(db, "rajaoil", "others", "orders", orderId)
  const orderSnap = await getDoc(orderRef)

  if (!orderSnap.exists()) {
    return null
  }

  return orderFromSnapshot(orderSnap)
}

export async function updateOrderInFirestore(
  orderId: string,
  updates: Partial<Pick<Order, "status" | "paymentStatus">>
) {
  const orderRef = doc(db, "rajaoil", "others", "orders", orderId)
  await updateDoc(orderRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteOrderFromFirestore(orderId: string) {
  const orderRef = doc(db, "rajaoil", "others", "orders", orderId)
  await deleteDoc(orderRef)
}
