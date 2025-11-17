import { ContactForm } from '@/types/contactForm'

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Invalid Date'
  }
}

export function getStatusColor(status: ContactForm['status']): string {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'replied':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'archived':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function truncateMessage(message: string, maxLength: number = 100): string {
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength) + '...'
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\d{10,}$/
  return phoneRegex.test(phone.replace(/\D/g, ''))
}
