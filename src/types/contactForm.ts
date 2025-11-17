// Contact Form Interface
export interface ContactForm {
  id: string                              // Firebase document ID
  name: string
  phone: string
  subject: string
  message: string
  status: 'new' | 'replied' | 'archived'
  replied: boolean
  replyMessage?: string
  adminNotes?: string
  createdAt: string | null               // ISO string from Firebase Timestamp
  updatedAt: string | null               // ISO string from Firebase Timestamp
}

// Contact Form Statistics Interface
export interface ContactFormStatistics {
  totalMessages: number
  newMessages: number
  repliedMessages: number
  archivedMessages: number
}
