/**
 * Al-Waseet API Integration Library
 * Base URL: https://api.alwaseet-iq.net/v1/merchant
 * 
 * IMPORTANT: Status changes are controlled ONLY by Al-Waseet.
 * Once a shipment is sent to Waseet (status=at_waseet_office),
 * its status can only be updated via Waseet API polling.
 */

const WASEET_BASE = 'https://api.alwaseet-iq.net/v1/merchant'

export interface WaseetOrder {
  qr_id: number
  id: number
  qr_link: string
  status_id: string
  status: string
  client_name: string
  client_mobile: string
  price: string
  delivery_price: string
  updated_at: string
  issue_notes: string
  merchant_notes: string
}

// ====== LOGIN & TOKEN MANAGEMENT ======

export async function waseetLogin(username: string, password: string): Promise<string | null> {
  try {
    const form = new FormData()
    form.append('username', username)
    form.append('password', password)

    const res = await fetch(`${WASEET_BASE}/login`, {
      method: 'POST',
      body: form,
    })
    const json = await res.json()
    if (json.status && json.data?.token) {
      return json.data.token
    }
    console.error('[Waseet] Login failed:', json.msg)
    return null
  } catch (err) {
    console.error('[Waseet] Login error:', err)
    return null
  }
}

// ====== GET CITIES ======

export async function waseetGetCities(token: string) {
  try {
    const res = await fetch(`${WASEET_BASE}/citys`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    return json.status ? json.data : []
  } catch {
    return []
  }
}

// ====== GET REGIONS BY CITY ======

export async function waseetGetRegions(token: string, cityId: string) {
  try {
    const res = await fetch(`${WASEET_BASE}/regions?city_id=${cityId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    return json.status ? json.data : []
  } catch {
    return []
  }
}

// ====== GET PACKAGE SIZES ======

export async function waseetGetPackageSizes(token: string) {
  try {
    const res = await fetch(`${WASEET_BASE}/package-sizes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    return json.status ? json.data : []
  } catch {
    return []
  }
}

// ====== CREATE ORDER ======

export interface CreateOrderPayload {
  token: string
  client_name: string
  client_mobile: string
  client_mobile2?: string
  city_id: number
  region_id: number
  location: string
  type_name: string
  items_number: number
  price: number
  package_size: number
  merchant_notes?: string
  replacement?: 0 | 1
}

export async function waseetCreateOrder(payload: CreateOrderPayload): Promise<WaseetOrder | null> {
  try {
    const form = new FormData()
    Object.entries(payload).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        form.append(key, String(val))
      }
    })

    const res = await fetch(`${WASEET_BASE}/create-order?token=${payload.token}`, {
      method: 'POST',
      body: form,
    })
    const json = await res.json()
    if (json.status && json.data?.[0]) {
      return json.data[0] as WaseetOrder
    }
    console.error('[Waseet] Create order failed:', json.msg)
    return null
  } catch (err) {
    console.error('[Waseet] Create order error:', err)
    return null
  }
}

// ====== GET ORDER STATUS BY IDs (batch, max 25) ======

export async function waseetGetOrdersByIds(token: string, qrIds: string[]): Promise<WaseetOrder[]> {
  if (!qrIds.length) return []
  try {
    const form = new FormData()
    form.append('ids', qrIds.slice(0, 25).join(','))

    const res = await fetch(`${WASEET_BASE}/get-orders-by-ids-bulk?token=${token}`, {
      method: 'POST',
      body: form,
    })
    const json = await res.json()
    return json.status ? json.data : []
  } catch (err) {
    console.error('[Waseet] Get orders error:', err)
    return []
  }
}

// ====== MAP WASEET STATUS TO LOCAL STATUS ======
// Waseet status_id -> our ShipmentStatus

export function mapWaseetStatusToLocal(statusId: string): string {
  // Based on Waseet status IDs observed in documentation
  // status_id=1: Order at merchant (new/pending)
  // status_id=2: Picked up by driver
  // status_id=3: At Waseet office
  // status_id=4: Out for delivery
  // status_id=5: Delivered
  // status_id=6: Failed delivery
  // status_id=7: Returned
  // etc.
  const mapping: Record<string, string> = {
    '1': 'at_waseet_office',   // Just created at waseet side
    '2': 'at_waseet_office',   // Picked up from merchant, in transit to waseet
    '3': 'at_waseet_office',   // At waseet main office
    '4': 'out_for_delivery',   // Out for delivery
    '5': 'delivered',          // Delivered
    '6': 'failed_delivery',    // Failed delivery attempt
    '7': 'returned',           // Returned to merchant
    '8': 'returned',           // Returned confirmed
    '9': 'at_waseet_office',   // Postponed
    '10': 'out_for_delivery',  // Re-attempted delivery
  }
  return mapping[statusId] || 'at_waseet_office'
}
