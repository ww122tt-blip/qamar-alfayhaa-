import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { phone, message, shipmentId } = await request.json()

    if (!phone || !message) {
      return NextResponse.json({ error: 'phone and message are required' }, { status: 400 })
    }

    const { data: settings } = await supabase.from('whatsapp_settings').select('*').limit(1).single()
    if (!settings || !settings.is_connected || !settings.api_url) {
      return NextResponse.json({ error: 'WhatsApp is not connected' }, { status: 400 })
    }

    const apiUrl = settings.api_url.endsWith('/') ? settings.api_url.slice(0, -1) : settings.api_url
    const instanceName = settings.instance_name || 'qamar_main'
    const apiKey = settings.api_key || 'QamarAlFayhaa2026'

    const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        number: phone,
        options: { delay: 1200, presence: 'composing' },
        textMessage: { text: message }
      })
    })

    const result = await response.json()

    if (response.ok && (result.key?.id || result.messageId || result?.id)) {
      return NextResponse.json({ success: true, result })
    } else {
      return NextResponse.json({ error: result.error || result.message || 'فشل الإرسال' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('WhatsApp Proxy Send Error:', error)
    return NextResponse.json({ error: error.message || 'حدث خطأ داخلي' }, { status: 500 })
  }
}
