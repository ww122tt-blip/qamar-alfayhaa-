import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { waseetLogin, waseetCreateOrder, mapWaseetStatusToLocal } from '@/lib/waseet'

// Server-side Supabase client (uses service role for full access)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ====== GET VALID WASEET TOKEN ======
async function getWaseetToken(): Promise<string | null> {
  const { data: settings } = await supabase
    .from('waseet_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (!settings?.is_active || !settings?.username || !settings?.password) {
    return null
  }

  // Check if token is still valid (refresh if older than 23 hours)
  const tokenAge = settings.token_updated_at
    ? Date.now() - new Date(settings.token_updated_at).getTime()
    : Infinity
  const TOKEN_TTL = 23 * 60 * 60 * 1000 // 23 hours

  if (settings.token && tokenAge < TOKEN_TTL) {
    return settings.token
  }

  // Re-login to get new token
  const newToken = await waseetLogin(settings.username, settings.password)
  if (newToken) {
    await supabase
      .from('waseet_settings')
      .update({ token: newToken, token_updated_at: new Date().toISOString() })
      .eq('id', 1)
    return newToken
  }
  return null
}

// ====== SEND SHIPMENT TO WASEET ======
async function sendShipmentToWaseet(shipmentId: string): Promise<void> {
  // Fetch shipment with client info
  const { data: shipment } = await supabase
    .from('shipments')
    .select('*, client:clients(*)')
    .eq('id', shipmentId)
    .single()

  if (!shipment || shipment.waseet_qr_id) return // Already sent

  const token = await getWaseetToken()
  if (!token) {
    console.error('[Waseet] No valid token - check waseet_settings')
    return
  }

  // Map governorate to city_id - default to Baghdad (1) if not found
  // We'll use a simple mapping; in production this should come from waseet_cities table
  const CITY_MAP: Record<string, number> = {
    'بغداد': 1, 'البصرة': 2, 'نينوى': 3, 'أربيل': 4,
    'كركوك': 5, 'الأنبار': 6, 'ديالى': 7, 'صلاح الدين': 8,
    'بابل': 9, 'النجف': 10, 'كربلاء': 11, 'واسط': 12,
    'ميسان': 13, 'ذي قار': 14, 'المثنى': 15, 'القادسية': 16,
    'دهوك': 17, 'السليمانية': 18
  }

  const cityId = CITY_MAP[shipment.governorate] || 1

  const payload = {
    token,
    client_name: shipment.recipient_name,
    client_mobile: `+964${String(shipment.recipient_phone).replace(/^0/, '')}`,
    city_id: cityId,
    region_id: 1, // Default to first region; ideally map district
    location: shipment.district || shipment.governorate,
    type_name: 'بضاعة',
    items_number: 1,
    price: Math.round(shipment.delivery_fee || 0),
    package_size: 1, // Default to small
    merchant_notes: shipment.notes || '',
    replacement: 0 as 0 | 1,
  }

  const result = await waseetCreateOrder(payload)

  if (result) {
    // Save qr_id, sent_at, and update status to at_waseet_office
    await supabase
      .from('shipments')
      .update({
        status: 'at_waseet_office',
        waseet_qr_id: String(result.qr_id),
        waseet_status_id: String(result.status_id || '1'),
        waseet_status_text: result.status || 'في مكتب الوسيط',
        waseet_sent_at: new Date().toISOString(),
      })
      .eq('id', shipmentId)

    // Log the status history
    await supabase.from('status_history').insert([{ 
      shipment_id: shipmentId, 
      status: 'at_waseet_office', 
      notes: `إرسال للوسيط (رقم QR: ${result.qr_id})` 
    }])

    // Log Activity
    await supabase.from('activity_logs').insert([{
      action: 'إرسال للوسيط',
      entity_type: 'shipment',
      entity_id: shipment.code || shipmentId,
      details: `تم إرسال الشحنة للوسيط وتحديث الحالة إلى في مكتب الوسيط. رقم QR: ${result.qr_id}`,
      user_name: 'System'
    }])

    console.log(`[Waseet] Shipment ${shipmentId} sent. QR ID: ${result.qr_id}`)
  } else {
    console.error(`[Waseet] Failed to send shipment ${shipmentId}`)
    throw new Error('فشل الإرسال للوسيط، قد تكون هناك مشكلة في بيانات الشحنة أو في حساب الوسيط')
  }
}

// ====== SYNC STATUS FROM WASEET ======
async function syncStatusFromWaseet(): Promise<{ synced: number }> {
  const token = await getWaseetToken()
  if (!token) return { synced: 0 }

  // Get all shipments that are at waseet (have qr_id but not delivered/returned)
  const { data: shipments } = await supabase
    .from('shipments')
    .select('id, code, waseet_qr_id, waseet_status_id, status, client:clients(*)')
    .not('waseet_qr_id', 'is', null)
    .not('status', 'in', '("delivered","returned","cancelled")')

  if (!shipments?.length) return { synced: 0 }

  // Split into batches of 25
  let synced = 0
  const batchSize = 25

  for (let i = 0; i < shipments.length; i += batchSize) {
    const batch = shipments.slice(i, i + batchSize)
    const qrIds = batch.map(s => s.waseet_qr_id!)

    const { waseetGetOrdersByIds } = await import('@/lib/waseet')
    const waseetOrders = await waseetGetOrdersByIds(token, qrIds)

    for (const waseetOrder of waseetOrders) {
      const localShipment = batch.find(s => s.waseet_qr_id === String(waseetOrder.id || waseetOrder.qr_id))
      if (!localShipment) continue

      const newStatusId = waseetOrder.status_id
      const newLocalStatus = mapWaseetStatusToLocal(newStatusId)

      // Only update if status changed
      if (newStatusId !== localShipment.waseet_status_id || newLocalStatus !== localShipment.status) {
        const oldStatus = localShipment.status

        await supabase
          .from('shipments')
          .update({
            status: newLocalStatus,
            waseet_status_id: newStatusId,
            waseet_status_text: waseetOrder.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', localShipment.id)

        // Log status change
        await supabase.from('status_history').insert([{
          shipment_id: localShipment.id,
          status: newLocalStatus,
          notes: `[الوسيط] ${waseetOrder.status}`,
        }])

        await supabase.from('activity_logs').insert([{
          action: 'تحديث حالة من الوسيط',
          entity_type: 'shipment',
          entity_id: localShipment.code || localShipment.id,
          details: `تغيرت الحالة من "${oldStatus}" إلى "${waseetOrder.status}" (الوسيط)`,
          user_name: 'System'
        }])

        // Send WhatsApp notification for important status changes
        if (['delivered', 'returned', 'out_for_delivery'].includes(newLocalStatus)) {
          const { data: wSettings } = await supabase
            .from('whatsapp_settings')
            .select('notify_status_change')
            .single()

          if (wSettings?.notify_status_change && localShipment.client?.phones?.[0]) {
            const { sendWhatsAppMessage } = await import('@/lib/whatsapp')
            const msg = newLocalStatus === 'delivered'
              ? `🎉 تم تسليم شحنتك بنجاح!\n\n📦 رقم الشحنة: ${localShipment.code}\n\nشكراً لثقتكم بقمر الفيحاء 🌙`
              : newLocalStatus === 'returned'
              ? `⚠️ تم إرجاع شحنتك\n\n📦 رقم الشحنة: ${localShipment.code}\n\nللاستفسار يرجى التواصل معنا.\nقمر الفيحاء 🌙`
              : `📦 تحديث شحنتك #${localShipment.code}\n\n📊 الحالة: ${waseetOrder.status}\n\nقمر الفيحاء للشحنات 🌙`
            await sendWhatsAppMessage(localShipment.client.phones[0], msg, localShipment.id)
          }
        }

        synced++
      }
    }
  }

  return { synced }
}

// ====== MAIN API HANDLER ======

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const action = body.action

    if (action === 'send_shipment') {
      const { shipmentId } = body
      if (!shipmentId) return NextResponse.json({ error: 'shipmentId required' }, { status: 400 })
      await sendShipmentToWaseet(shipmentId)
      return NextResponse.json({ success: true })
    }

    if (action === 'sync_status') {
      const result = await syncStatusFromWaseet()
      return NextResponse.json({ success: true, ...result })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    console.error('[Waseet API] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  // Called by Vercel Cron to sync statuses automatically
  const result = await syncStatusFromWaseet()
  return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() })
}
