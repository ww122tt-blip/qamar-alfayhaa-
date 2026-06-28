import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { instanceName } = await request.json()

    // Get settings from database securely from the server
    const { data: settings, error: dbError } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .limit(1)
      .single()

    if (dbError || !settings?.api_url) {
      return NextResponse.json({ error: 'لا توجد إعدادات للسيرفر في قاعدة البيانات' }, { status: 400 })
    }

    const url = settings.api_url.endsWith('/') ? settings.api_url.slice(0, -1) : settings.api_url

    // Call Evolution API
    const response = await fetch(`${url}/instance/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'apikey': settings.api_key || 'QamarAlFayhaa2026'
      },
      body: JSON.stringify({ 
        instanceName: instanceName || settings.instance_name || 'qamar_main',
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      })
    })

    const data = await response.json()

    if (!response.ok) {
       return NextResponse.json({ error: data.message || data.error || 'فشل الاتصال بـ Evolution API' }, { status: 400 })
    }

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('WhatsApp QR Proxy Error:', error)
    return NextResponse.json({ error: error.message || 'حدث خطأ في السيرفر الوسيط' }, { status: 500 })
  }
}
