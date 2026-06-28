import { supabase } from './supabase'

/**
 * دالة مساعدة لتهيئة رقم الهاتف (إزالة الصفر في البداية وإضافة مفتاح العراق إذا لم يكن موجوداً)
 */
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '') // إزالة أي رموز غير رقمية
  if (cleaned.startsWith('00')) cleaned = cleaned.substring(2)
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1) // إزالة الصفر في 07...
  if (!cleaned.startsWith('964') && cleaned.length === 10) {
    cleaned = '964' + cleaned
  }
  return cleaned
}

/**
 * جلب إعدادات الواتساب من قاعدة البيانات
 */
export async function getWhatsAppSettings() {
  const { data, error } = await supabase.from('whatsapp_settings').select('*').single()
  if (error || !data) return null
  return data
}

/**
 * إرسال رسالة واتساب عبر سيرفرنا الخارجي
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string,
  shipmentId?: string
) {
  try {
    // 1. التأكد من الإعدادات
    const settings = await getWhatsAppSettings()
    if (!settings || !settings.is_connected || !settings.api_url) {
      console.warn('WhatsApp is not connected or settings missing.')
      return false
    }

    const formattedPhone = formatPhoneNumber(phone)
    const apiUrl = settings.api_url.endsWith('/') ? settings.api_url.slice(0, -1) : settings.api_url

    // 2. تسجيل الرسالة في قاعدة البيانات (قيد الإرسال)
    const { data: logData, error: logError } = await supabase
      .from('whatsapp_logs')
      .insert([{
        shipment_id: shipmentId || null,
        recipient_phone: formattedPhone,
        message,
        status: 'pending'
      }])
      .select()
      .single()

    const logId = logData?.id

    // 3. الاتصال بسيرفر الواتساب عبر الوسيط (Proxy) لتجنب مشاكل المتصفح (CORS)
    // We can check if we are in browser (window) or server, but since this might run in browser, use absolute or relative path
    const isBrowser = typeof window !== 'undefined'
    const baseUrl = isBrowser ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    
    const response = await fetch(`${baseUrl}/api/whatsapp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message,
        shipmentId
      })
    })

    const result = await response.json()

    // 4. تحديث حالة الرسالة في السجل
    if (response.ok && result.success) {
      if (logId) {
        await supabase.from('whatsapp_logs').update({ status: 'sent' }).eq('id', logId)
      }
      return true
    } else {
      throw new Error(result.error || 'فشل الإرسال من السيرفر الخارجي')
    }

  } catch (error: any) {
    console.error('WhatsApp Error:', error)
    // تحديث السجل كفشل
    if (shipmentId) {
      // Find log by shipment ID and phone to update it
      await supabase.from('whatsapp_logs')
        .update({ status: 'failed', error: error.message || 'Unknown error' })
        .eq('shipment_id', shipmentId)
        .eq('status', 'pending')
    }
    return false
  }
}
