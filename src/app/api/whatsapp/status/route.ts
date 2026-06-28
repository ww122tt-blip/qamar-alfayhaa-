import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: settings } = await supabase.from('whatsapp_settings').select('*').limit(1).single()
    if (!settings?.api_url) return NextResponse.json({ connected: false })

    const url = settings.api_url.endsWith('/') ? settings.api_url.slice(0, -1) : settings.api_url
    const instanceName = settings.instance_name || 'qamar_main'
    const apiKey = settings.api_key || 'QamarAlFayhaa2026'

    const response = await fetch(`${url}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': apiKey }
    })
    const data = await response.json()
    
    // In Evolution API v1, state is inside data.instance.state
    const isConnected = data?.instance?.state === 'open' || data?.state === 'open'

    // Update DB
    await supabase.from('whatsapp_settings').update({ is_connected: isConnected }).eq('id', settings.id)

    return NextResponse.json({ connected: isConnected, raw: data })
  } catch (error) {
    return NextResponse.json({ connected: false, error: 'Failed to connect to VPS' })
  }
}
