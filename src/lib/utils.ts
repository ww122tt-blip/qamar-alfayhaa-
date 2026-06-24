import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ShipmentStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// SHIPMENT STATUS HELPERS
// ============================================

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  new: 'جديدة',
  picked_up: 'تم الاستلام',
  at_waseet_office: 'في مكتب الوسيط',
  out_for_delivery: 'في التوصيل',
  delivered: 'تم التسليم',
  returned: 'مرتجعة',
  failed_delivery: 'فشل التسليم',
  cancelled: 'ملغاة',
}

export const SHIPMENT_STATUS_COLORS: Record<ShipmentStatus, string> = {
  new: 'badge-new',
  picked_up: 'badge-transit',
  at_waseet_office: 'badge-transit',
  out_for_delivery: 'badge-pending',
  delivered: 'badge-delivered',
  returned: 'badge-returned',
  failed_delivery: 'badge-returned',
  cancelled: 'badge-returned',
}

export const SHIPMENT_STATUS_DOT: Record<ShipmentStatus, string> = {
  new: '#c084fc',
  picked_up: '#60a5fa',
  at_waseet_office: '#60a5fa',
  out_for_delivery: '#facc15',
  delivered: '#4ade80',
  returned: '#f87171',
  failed_delivery: '#f87171',
  cancelled: '#6b7280',
}

export function getStatusLabel(status: ShipmentStatus): string {
  return SHIPMENT_STATUS_LABELS[status] || status
}

export function getStatusClass(status: ShipmentStatus): string {
  return SHIPMENT_STATUS_COLORS[status] || 'badge-new'
}

// ============================================
// CURRENCY FORMATTERS
// ============================================

export function formatCurrency(amount: number, currency = 'IQD'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

  const symbols: Record<string, string> = {
    IQD: 'د.ع',
    KWD: 'د.ك',
    USD: '$',
  }

  return `${formatted} ${symbols[currency] || currency}`
}

// ============================================
// DATE FORMATTERS
// ============================================

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'الآن'
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  if (hours < 24) return `منذ ${hours} ساعة`
  if (days < 7) return `منذ ${days} يوم`
  return formatDate(dateString)
}

// ============================================
// CODE GENERATORS
// ============================================

export function generateClientCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const letter1 = letters[Math.floor(Math.random() * letters.length)]
  const letter2 = letters[Math.floor(Math.random() * letters.length)]
  const numbers = Math.floor(1000 + Math.random() * 9000)
  return `${letter1}${letter2}${numbers}`
}

export function generateShipmentNumber(sequence: number): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const randomLetters = Array.from({ length: 3 }, () =>
    letters[Math.floor(Math.random() * letters.length)]
  ).join('')
  return `SHL_${randomLetters}${String(sequence).padStart(4, '0')}`
}

// ============================================
// WHATSAPP HELPERS
// ============================================

export function formatPhoneForWhatsApp(phone: string): string {
  // Remove spaces, dashes, and + signs
  let cleaned = phone.replace(/[\s\-\+\(\)]/g, '')
  
  // Add country code if not present (default Iraq: 964)
  if (cleaned.startsWith('07') || cleaned.startsWith('06')) {
    cleaned = '964' + cleaned.substring(1)
  } else if (cleaned.startsWith('0')) {
    cleaned = '964' + cleaned.substring(1)
  }
  
  return cleaned
}

export function buildWhatsAppMessage(
  template: string,
  variables: Record<string, string>
): string {
  let message = template
  Object.entries(variables).forEach(([key, value]) => {
    message = message.replace(new RegExp(`\\[${key}\\]`, 'g'), value)
  })
  return message
}

// ============================================
// PAGINATION
// ============================================

export function getPaginationRange(
  currentPage: number,
  totalPages: number
): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
}

// ============================================
// IRAQI GOVERNORATES
// ============================================

export const IRAQI_GOVERNORATES = [
  'بغداد',
  'البصرة',
  'نينوى',
  'أربيل',
  'النجف',
  'كربلاء',
  'الأنبار',
  'صلاح الدين',
  'ديالى',
  'واسط',
  'القادسية',
  'ذي قار',
  'ميسان',
  'المثنى',
  'بابل',
  'كركوك',
  'دهوك',
  'السليمانية',
]

export const COUNTRIES = [
  { value: 'IQ', label: 'العراق' },
  { value: 'KW', label: 'الكويت' },
  { value: 'SA', label: 'السعودية' },
  { value: 'AE', label: 'الإمارات' },
  { value: 'TR', label: 'تركيا' },
]
