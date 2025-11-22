// Contact Form Interface
export interface ContactForm {
  id: string                              // Firebase document ID
  name: string
  mobile: string
  email: string
  product: string
  message: string
  status: 'new' | 'contacted' | 'archived'
  contacted: boolean
  contactedVia: string
  adminNotes: string
  assignedTo: string
  createdAt: string | null               // ISO string from Firebase Timestamp
  contactedAt: string | null             // ISO string from Firebase Timestamp
  updatedAt: string | null               // ISO string from Firebase Timestamp
}

// Contact Form Statistics Interface
export interface ContactFormStatistics {
  totalMessages: number
  newMessages: number
  contactedMessages: number
  archivedMessages: number
}
