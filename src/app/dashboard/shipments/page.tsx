'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Package, Plus, Search, Filter, Printer, Trash2, Edit, Eye,
  RefreshCw, Send, X, Phone, MapPin, Scale, DollarSign,
  CheckCircle, MessageSquare, AlertCircle, Loader2, ChevronDown,
  ArrowUpDown, Clock, Truck, RotateCcw, CheckCircle2, XCircle, AlertTriangle, Image as ImageIcon, Warehouse as WarehouseIcon,
  Flag, Lock, Info, Tag, Box, Weight, Users, Calculator, GitCommit, Barcode, User
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusClass, getStatusLabel, IRAQI_GOVERNORATES, generateShipmentNumber } from '@/lib/utils'
import type { ShipmentStatus, Shipment, Client, Warehouse } from '@/types'
import { supabase } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import imageCompression from 'browser-image-compression'

const STATUS_FILTER_OPTIONS: { value: ShipmentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'new', label: 'جديدة' },
  { value: 'picked_up', label: 'تم الاستلام' },
  { value: 'at_waseet_office', label: 'في مكتب الوسيط' },
  { value: 'out_for_delivery', label: 'في التوصيل' },
  { value: 'delivered', label: 'تم التسليم' },
  { value: 'returned', label: 'مرتجعة' },
  { value: 'failed_delivery', label: 'فشل التسليم' },
  { value: 'cancelled', label: 'ملغاة' },
]

const STATUS_STEPS: { value: ShipmentStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'new', label: 'جديدة', icon: Package, color: '#6366f1' },
  { value: 'picked_up', label: 'تم الاستلام', icon: CheckCircle, color: '#3b82f6' },
  { value: 'at_waseet_office', label: 'في مكتب الوسيط', icon: Clock, color: '#eab308' },
  { value: 'out_for_delivery', label: 'في التوصيل', icon: Truck, color: '#f97316' },
  { value: 'delivered', label: 'تم التسليم', icon: CheckCircle2, color: '#22c55e' },
  { value: 'returned', label: 'مرتجعة', icon: RotateCcw, color: '#ef4444' },
  { value: 'failed_delivery', label: 'فشل التسليم', icon: XCircle, color: '#dc2626' },
  { value: 'cancelled', label: 'ملغاة', icon: AlertTriangle, color: '#94a3b8' },
]

// ====== HELPER: LOG ACTIVITY ======
async function logActivity(action: string, entityType: string, entityId: string, details: string) {
  await supabase.from('activity_logs').insert([{ action, entity_type: entityType, entity_id: entityId, details, user_name: 'Admin' }])
}

// ====== HELPER: ADD NOTIFICATION ======
async function addNotification(title: string, content: string, type: string, entityId?: string) {
  await supabase.from('notifications').insert([{ title, content, type, entity_id: entityId, entity_type: 'shipment', is_read: false, is_archived: false }])
}

// ====== ADD SHIPMENT MODAL ======
function AddShipmentModal({ onClose, onAdd, warehouses }: { onClose: () => void; onAdd: (s: Shipment) => void; warehouses: Warehouse[] }) {
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState({
    client_id: '',
    tracking_number: '',
    warehouse_id: '',
    type: 'per_order' as PricingType,
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [clientSearch, setClientSearch] = useState('')

  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setClientSearch(val)
    const found = clients.find(c => `${c.name} - ${c.code}` === val)
    setForm(p => ({ ...p, client_id: found ? found.id : '' }))
  }

  useEffect(() => {
    supabase.from('clients').select('*').eq('is_active', true).then(({ data }) => {
      if (data) setClients(data as unknown as Client[])
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_id) return alert('يجب اختيار العميل')
    if (!imageFile) return alert('يجب رفع صورة واحدة للشحنة')
    
    setLoading(true)
    
    let imageUrl = null
    try {
      const compressedFile = await imageCompression(imageFile, { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true })
      const fileName = `${Math.random().toString(36).substring(2)}-${compressedFile.name}`
      const { error: uploadError } = await supabase.storage.from('shipment_images').upload(fileName, compressedFile)
      if (!uploadError) {
        const { data } = supabase.storage.from('shipment_images').getPublicUrl(fileName)
        imageUrl = data.publicUrl
      }
    } catch (err) {
      console.error('Image compression/upload failed', err)
      alert('فشل رفع الصورة')
      setLoading(false)
      return
    }

    const newShipmentData = {
      code: generateShipmentNumber(Math.floor(Math.random() * 9999)),
      client_id: form.client_id,
      tracking_number: form.tracking_number,
      type: form.type,
      warehouse_id: form.warehouse_id && form.warehouse_id !== 'none' ? form.warehouse_id : null,
      notes: form.notes,
      status: 'new',
      label_url: imageUrl, // Storing in label_url since it's the image field in this project
      // Default empty values for now, to be filled in Edit
      recipient_name: null,
      recipient_phone: null,
      governorate: null,
      delivery_fee: 0,
    }
    
    try {
      const { data, error } = await supabase.from('shipments').insert([newShipmentData]).select('*, client:clients(*)').single()
      
      if (data && !error) {
        await logActivity('إنشاء شحنة سريع', 'shipment', data.code, `تم إنشاء شحنة جديدة (سريعة): ${data.code}`)
        
        // WhatsApp Notification for New Shipment
        try {
          const { data: settings } = await supabase.from('whatsapp_settings').select('notify_new_shipment').single()
          if (settings?.notify_new_shipment && data.client?.phones?.[0]) {
            const storeUrl = typeof window !== 'undefined' ? window.location.origin : 'https://qamar-alfayhaa.vercel.app'
            const msg = `مرحباً ${data.client.name} 👋\n\nتم تسجيل شحنة جديدة في حسابك بنجاح.\n\n📦 *رقم التتبع:* ${data.tracking_number || data.code}\n\nيمكنك متابعة حالة شحناتك في أي وقت عبر بوابتك:\n${storeUrl}/client-stats/${data.client_id}\n\nقمر الفيحاء للشحنات 🌙`
            sendWhatsAppMessage(data.client.phones[0], msg, data.id).catch(console.error)
          }
        } catch (err) {
          console.error('Error sending WhatsApp for new shipment:', err)
        }

        onAdd(data as unknown as Shipment)
        onClose()
      } else {
        alert('حدث خطأ أثناء الإضافة: ' + error?.message)
      }
    } catch (err) {
      console.error(err)
      alert('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl bg-[#1e1e1e] border border-slate-700/50">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <button onClick={onClose} disabled={loading} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 border border-slate-700 transition-colors">
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">إضافة شحنة جديدة</h2>
            <Truck size={24} className="text-red-500" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tracking Number */}
            <div className="space-y-2" dir="rtl">
              <div className="relative">
                <input 
                  type="text" 
                  value={form.tracking_number}
                  onChange={e => setForm(p => ({ ...p, tracking_number: e.target.value }))}
                  className="w-full bg-[#2a2a2a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-right" 
                  placeholder="* رقم التتبع"
                />
              </div>
            </div>

            {/* Client */}
            <div className="space-y-2" dir="rtl">
              <div className="relative">
                <input 
                  type="text"
                  required
                  list="clients-list"
                  value={clientSearch}
                  onChange={handleClientChange}
                  className={`w-full bg-[#2a2a2a] border ${!form.client_id ? 'border-red-500' : 'border-slate-700'} rounded-xl px-4 py-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-right`}
                  placeholder="* ابحث عن العميل (الاسم أو الكود)"
                />
                <datalist id="clients-list">
                  {clients.map(c => <option key={c.id} value={`${c.name} - ${c.code}`} />)}
                </datalist>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search size={16} className="text-slate-400" />
                </div>
              </div>
              {!form.client_id && <p className="text-red-500 text-xs mt-1 text-right">يجب اختيار العميل من القائمة</p>}
            </div>

            {/* Warehouse */}
            <div className="space-y-2" dir="rtl">
              <div className="relative">
                <select 
                  value={form.warehouse_id} 
                  onChange={e => setForm(p => ({ ...p, warehouse_id: e.target.value }))} 
                  className="w-full bg-[#2a2a2a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-right appearance-none"
                >
                  <option value="" disabled>* المستودع</option>
                  <option value="none">بدون مستودع</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={16} className="text-slate-400" />
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <WarehouseIcon size={18} className="text-slate-400" />
                </div>
              </div>
            </div>

            {/* Shipment Type */}
            <div className="space-y-2" dir="rtl">
              <div className="relative">
                <select 
                  value={form.type} 
                  onChange={e => setForm(p => ({ ...p, type: e.target.value as PricingType }))} 
                  className="w-full bg-[#2a2a2a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-right appearance-none"
                >
                  <option value="per_order">بالطلب (Per Order)</option>
                  <option value="per_kg">بالوزن / الكيلو</option>
                  <option value="carton">بالكارتون (Carton)</option>
                  <option value="bag">بالكيس (Bag)</option>
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={16} className="text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload Area */}
          <div className="space-y-2 mt-8">
            <div className="relative">
              <label className={`w-full flex flex-col items-center justify-center h-32 bg-[#2a2a2a] border-2 border-dashed ${!imageFile ? 'border-red-500/50' : 'border-slate-700'} rounded-xl cursor-pointer hover:bg-[#333] transition-colors`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {imageFile ? (
                    <span className="text-white font-medium">{imageFile.name}</span>
                  ) : (
                    <div className="flex gap-4 text-red-500/80">
                      <ImageIcon size={24} />
                      <div className="flex gap-1"><span className="w-1.5 h-4 bg-red-500/80 rounded-full"></span><span className="w-1 h-4 bg-red-500/80 rounded-full"></span></div>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} disabled={loading} />
              </label>
            </div>
            {!imageFile && <p className="text-red-500 text-xs text-right">يجب رفع صورة واحدة للشحنة</p>}
            <p className="text-slate-400 text-xs text-right mt-3 leading-relaxed">
              أنواع الملفات المدعومة: JPEG, PNG, JPG, WEBP - سيتم ضغط الصورة تلقائياً إلى أقل من 2MB (حد أقصى 50MB)<br/>
              ملفات PNG الكبيرة سيتم تحويلها إلى JPEG لضغط أفضل
            </p>
          </div>

          <div className="flex justify-between pt-6 border-t border-slate-700/50">
             <button type="button" onClick={onClose} disabled={loading} className="px-8 py-3 rounded-xl border border-slate-600 text-white hover:bg-slate-700 transition-colors">
              إلغاء
            </button>
            <button type="submit" disabled={loading} className="px-8 py-3 rounded-xl bg-red-400 hover:bg-red-500 text-white font-bold transition-colors flex items-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              حفظ الشحنة
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ====== EDIT SHIPMENT MODAL ======
function EditShipmentModal({ shipment, onClose, onUpdate, clients, warehouses, shippingStatuses }: { shipment: Shipment, onClose: () => void, onUpdate: (s: Shipment) => void, clients: Client[], warehouses: Warehouse[], shippingStatuses: {id: string, name: string, can_edit_shipment: boolean}[] }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    recipient_name: shipment.recipient_name || '',
    recipient_phone: shipment.recipient_phone || '',
    governorate: shipment.governorate || '',
    district: shipment.district || '',
    weight: shipment.weight ? String(shipment.weight) : '',
    delivery_fee: shipment.delivery_fee ? String(shipment.delivery_fee) : '',
    notes: shipment.notes || '',
    status: shipment.status,
    type: shipment.type || 'per_order',
    warehouse_id: shipment.warehouse_id || '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [settings, setSettings] = useState<Record<string, number>>({})

  const currentStatusObj = shippingStatuses.find(s => s.name === shipment.status)
  const isLockedByStatus = currentStatusObj && currentStatusObj.can_edit_shipment === false
  const isLocked = !!shipment.waseet_qr_id || isLockedByStatus

  // Fetch Settings on mount
  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      if (data) {
        const s: Record<string, number> = {}
        data.forEach(x => { if (x.type === 'number') s[x.key] = Number(x.value) })
        setSettings(s)
      }
    })
  }, [])

  // Auto-calculate Delivery Fee when relevant fields change
  useEffect(() => {
    if (Object.keys(settings).length === 0) return

    const weight = parseFloat(form.weight) || 0
    let localDelivery = settings.governorates_delivery_price || 8000
    if (form.governorate === 'البصرة') localDelivery = settings.basra_delivery_price || 5000
    if (form.governorate === 'بغداد') localDelivery = settings.baghdad_delivery_price || 4000

    const client = shipment.client
    const defaultCarton = settings.default_carton_price || 30000
    const defaultBag = settings.default_bag_price || 15000
    const defaultKilo = settings.default_kilo_price || 1000

    const cartonPrice = client?.carton_price || defaultCarton
    const bagPrice = client?.bag_price || defaultBag
    const kiloPrice = client?.kilo_price || defaultKilo

    let finalFee = 0

    if (form.type === 'carton') {
      finalFee = cartonPrice + localDelivery
    } else if (form.type === 'bag') {
      finalFee = bagPrice + localDelivery
    } else if (form.type === 'per_kg') {
      finalFee = (weight * kiloPrice) + localDelivery
    } else if (form.type === 'per_order') {
      if (weight > 8) {
        finalFee = cartonPrice + localDelivery
      } else {
        finalFee = (weight * kiloPrice) + localDelivery
      }
    }

    // Only update if it's different and if it's not a manual override (we can just auto-update it always for now)
    setForm(p => ({ ...p, delivery_fee: String(finalFee) }))
  }, [form.weight, form.type, form.governorate, settings, shipment.client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const oldStatus = shipment.status
    let imageUrl = shipment.label_url || null 
    
    if (imageFile) {
      try {
        const compressedFile = await imageCompression(imageFile, { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true })
        const fileName = `${Math.random().toString(36).substring(2)}-${compressedFile.name}`
        const { error: uploadError } = await supabase.storage.from('shipment_images').upload(fileName, compressedFile)
        if (!uploadError) {
          const { data } = supabase.storage.from('shipment_images').getPublicUrl(fileName)
          imageUrl = data.publicUrl
        }
      } catch (err) {
        console.error('Image compression/upload failed', err)
      }
    }

    const updateData: any = {
      recipient_name: form.recipient_name,
      recipient_phone: form.recipient_phone,
      governorate: form.governorate,
      district: form.district || null,
      delivery_fee: parseFloat(form.delivery_fee) || 0,
      weight: parseFloat(form.weight) || 0,
      type: form.type,
      notes: form.notes || null,
      status: form.status as ShipmentStatus,
      warehouse_id: form.warehouse_id && form.warehouse_id !== 'none' ? form.warehouse_id : null,
      updated_at: new Date().toISOString(),
    }
    if (imageUrl) updateData.image_url = imageUrl

    const { data, error } = await supabase.from('shipments').update(updateData).eq('id', shipment.id).select('*, client:clients(*)').single()
    if (data && !error) {
      if (oldStatus !== form.status) {
        // Log status change in status_history
        await supabase.from('status_history').insert([{ shipment_id: shipment.id, status: form.status, notes: `تغيير من ${getStatusLabel(oldStatus)} إلى ${getStatusLabel(form.status as ShipmentStatus)}` }])
        await logActivity('تحديث حالة', 'shipment', shipment.code || shipment.id, `تغيير حالة ${shipment.code} من "${getStatusLabel(oldStatus)}" إلى "${getStatusLabel(form.status as ShipmentStatus)}"`)
        await addNotification('تحديث حالة شحنة', `تم تغيير حالة الشحنة ${shipment.code} إلى: ${getStatusLabel(form.status as ShipmentStatus)}`, 'shipment', shipment.code)
        
        // ❤️ AUTO-SEND TO WASEET when status changes to at_waseet_office
        if (form.status === 'at_waseet_office' && !shipment.waseet_qr_id) {
          fetch('/api/waseet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send_shipment', shipmentId: shipment.id }),
          })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({}))
              alert(`تنبيه: تم تغيير الحالة، لكن فشل الإرسال الفعلي للوسيط. السبب: ${err.error || 'غير معروف'}`)
            }
          })
          .catch(err => console.error('[Waseet] Auto-send failed:', err))
        }

        // WhatsApp Notification (only if not going to waseet - waseet will handle its own notifications)
        if (form.status !== 'at_waseet_office' || shipment.waseet_qr_id) {
          const { data: settings } = await supabase.from('whatsapp_settings').select('notify_status_change').single()
          if (settings?.notify_status_change && data.client?.phones?.[0]) {
            const statusName = getStatusLabel(form.status as ShipmentStatus)
            let msg = `تحديث شحنتك #${data.code || shipment.id.slice(0,8)} 🔄\n\n📊 الحالة الجديدة: ${statusName}\n👤 المستلم: ${form.recipient_name}\n\n`
            
            if (form.status === 'delivered') {
              msg = `🎉 تم تسليم شحنتك بنجاح!\n\n📦 الشحنة: #${data.code || shipment.id.slice(0,8)}\n👤 المستلم: ${form.recipient_name}\n\nشكراً لثقتكم بقمر الفيحاء 🌙`
            } else if (form.status === 'returned') {
              msg = `⚠️ تم إرجاع شحنتك\n\n📦 الشحنة: #${data.code || shipment.id.slice(0,8)}\n👤 المستلم: ${form.recipient_name}\n\nللاستفسار يرجى التواصل معنا.\nقمر الفيحاء 🌙`
            } else {
              msg += `🔗 تتبع شحنتك عبر بوابتك:\n${window.location.origin}/client-stats/${data.client_id}\n\nقمر الفيحاء للشحنات 🌙`
            }
            
            await sendWhatsAppMessage(data.client.phones[0], msg, shipment.id)
          }
        }
      }
      onUpdate(data as unknown as Shipment)
      onClose()
    } else {
      alert('حدث خطأ: ' + error?.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200">
              <Edit size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">تعديل الشحنة</h2>
              <p className="text-xs font-mono text-slate-400">#{shipment.code || shipment.id.slice(0,8)}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} className="btn-ghost p-2 rounded-lg hover:bg-slate-200 text-slate-500"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Status Change */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
              <Flag size={16} className="text-red-500" />
              <h3 className="font-bold text-slate-800">تغيير الحالة</h3>
            </div>
            <div className="p-4 space-y-4">
              <select 
                value={form.status} 
                onChange={e => setForm(p => ({ ...p, status: e.target.value as ShipmentStatus }))} 
                className="input-field w-full"
              >
                {STATUS_STEPS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                {shippingStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>

              {isLocked ? (
                <>
                  <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm flex items-center gap-2 border border-amber-200">
                    <Lock size={16} /> 
                    <span className="font-medium">تحذير: الحالة المختارة لا تسمح بتعديل تفاصيل الشحنة. سيتم تغيير الحالة فقط.</span>
                  </div>
                  <div className="bg-cyan-50 text-cyan-800 p-3 rounded-lg text-sm flex items-center gap-2 border border-cyan-200">
                    <Info size={16} /> 
                    <span className="font-medium">الحالة الحالية أو المختارة لا تسمح بتعديل تفاصيل الشحنة. يمكنك فقط تغيير الحالة.</span>
                  </div>
                </>
              ) : (
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-sm flex items-center gap-2 border border-emerald-200">
                  <CheckCircle size={16} /> 
                  <span className="font-medium">الحالة المختارة تسمح بتعديل تفاصيل الشحنة.</span>
                </div>
              )}
            </div>
          </div>

          {!isLocked && (
            <>
              {/* Section 2: Basic Information */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                  <Info size={16} className="text-red-500" />
                  <h3 className="font-bold text-slate-800">المعلومات الأساسية</h3>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                      <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><Tag size={12}/> نوع التسعير</p>
                      <p className="font-bold text-slate-700">{shipment.type}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                      <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><MapPin size={12}/> المستودع</p>
                      <p className="font-bold text-slate-700">{shipment.warehouse?.name || '—'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-600 flex items-center gap-1"><Box size={14}/> نوع الشحنة</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as PricingType }))} disabled={loading} className="input-field bg-white w-full">
                      <option value="per_order">بالطلب (Per Order)</option>
                      <option value="per_kg">بالوزن / الكيلو</option>
                      <option value="carton">بالكارتون (Carton)</option>
                      <option value="bag">بالكيس (Bag)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-600 flex items-center gap-1"><Weight size={14}/> الوزن (كغ)</label>
                    <input type="number" step="0.1" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} disabled={loading} className="input-field bg-white w-full text-left" dir="ltr" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold mb-1.5 text-slate-600">المستودع (اختياري)</label>
                    <select value={form.warehouse_id} onChange={e => setForm(p => ({ ...p, warehouse_id: e.target.value }))} disabled={loading} className="input-field bg-white w-full">
                      <option value="none">بدون مستودع</option>
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Pricing Information */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                  <DollarSign size={16} className="text-red-500" />
                  <h3 className="font-bold text-slate-800">معلومات التسعير</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="bg-slate-800 text-white rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold flex items-center gap-2"><Users size={16}/> إعدادات التسعير للعميل</h4>
                      <Tag size={16} className="text-red-400" />
                    </div>
                    <div className="text-sm space-y-1 text-slate-300">
                      <p>نوع التسعير: <span className="text-white font-medium">{shipment.type}</span></p>
                      <p>السعر المحدد: <span className="text-white font-medium">0 د.ع</span></p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-slate-600 text-left">سعر الوحدة (د.ع)</label>
                      <input type="text" value="0" disabled className="input-field bg-slate-50 w-full text-left font-mono" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-slate-600 text-left">سعر التوصيل (د.ع)</label>
                      <input type="number" value={form.delivery_fee} onChange={e => setForm(p => ({ ...p, delivery_fee: e.target.value }))} disabled={loading} className="input-field bg-white w-full text-left font-mono" dir="ltr" />
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-bold text-emerald-800 flex items-center gap-2">إجمالي السعر المحسوب <Calculator size={16}/></h4>
                        <p className="text-xs text-emerald-600">محسوب حسب نوع التسعير ووزن الشحنة</p>
                      </div>
                      <span className="text-lg font-bold text-emerald-600">{formatCurrency(parseFloat(form.delivery_fee) || 0)} د.ع</span>
                    </div>
                    <div className="text-xs space-y-1 mt-3 text-slate-600">
                      <p className="font-bold text-red-500">طريقة الحساب: سعر ثابت (أكبر من أو يساوي الحد الأدنى)</p>
                      <p>الحساب: سعر الطلب الثابت + سعر التوصيل</p>
                      <p className="font-mono text-left w-full mt-1 bg-white p-1 rounded text-slate-800">{formatCurrency(parseFloat(form.delivery_fee) || 0)} + 0</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Tracking Information */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                  <GitCommit size={16} className="text-red-500" />
                  <h3 className="font-bold text-slate-800">معلومات التتبع</h3>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-600 text-left flex items-center justify-end gap-1"><Barcode size={14}/> رقم التتبع</label>
                    <input type="text" value={shipment.code || ''} disabled className="input-field bg-slate-50 w-full text-left font-mono" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-600 text-left flex items-center justify-end gap-1"><Truck size={14}/> تتبع شركة التوصيل</label>
                    <input type="text" value={shipment.waseet_qr_id || ''} disabled className="input-field bg-slate-50 w-full text-left font-mono" dir="ltr" />
                  </div>
                </div>
              </div>

              {/* Section 5: Client Information (Read Only) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-red-500" />
                    <h3 className="font-bold text-slate-800">معلومات العميل (للعرض فقط)</h3>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50">
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <p className="text-xs text-slate-400 mb-1 text-left flex items-center justify-end gap-1"><User size={12}/> اسم العميل</p>
                    <p className="font-bold text-slate-700 text-left">{shipment.client?.name || '—'}</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <p className="text-xs text-slate-400 mb-1 text-left flex items-center justify-end gap-1"><Phone size={12}/> رقم الهاتف الأساسي</p>
                    <p className="font-bold text-slate-700 text-left" dir="ltr">{shipment.client?.phones?.[0] || '—'}</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <p className="text-xs text-slate-400 mb-1 text-left flex items-center justify-end gap-1"><Tag size={12}/> علامة الشحن</p>
                    <p className="font-bold text-slate-700 text-left">{shipment.code}</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <p className="text-xs text-slate-400 mb-1 text-left flex items-center justify-end gap-1"><Tag size={12}/> نوع التسعير</p>
                    <p className="font-bold text-slate-700 text-left">{shipment.type}</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <p className="text-xs text-slate-400 mb-1 text-left flex items-center justify-end gap-1"><MapPin size={12}/> المحافظة</p>
                    <p className="font-bold text-slate-700 text-left">{shipment.governorate}</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <p className="text-xs text-slate-400 mb-1 text-left flex items-center justify-end gap-1"><Truck size={12}/> تكلفة التوصيل المحلي (د.ع)</p>
                    <p className="font-bold text-slate-700 text-left">{formatCurrency(shipment.delivery_fee)}</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <p className="text-xs text-slate-400 mb-1 text-left flex items-center justify-end gap-1"><MapPin size={12}/> المنطقة</p>
                    <p className="font-bold text-slate-700 text-left">{shipment.district || '—'}</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <p className="text-xs text-slate-400 mb-1 text-left flex items-center justify-end gap-1"><MapPin size={12}/> العنوان الكامل</p>
                    <p className="font-bold text-slate-700 text-left">{shipment.district || '—'}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button type="submit" disabled={loading} className={`btn-primary flex-1 justify-center py-3 shadow-md transition-all ${isLocked ? 'bg-red-500 hover:bg-red-600' : 'bg-red-500 hover:bg-red-600'} disabled:opacity-50`}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : null} 
              {isLocked ? 'تغيير الحالة فقط' : 'تعديل الشحنة'}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="bg-slate-800 text-white hover:bg-slate-700 rounded-lg px-6 flex items-center justify-center py-3">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ====== VIEW SHIPMENT MODAL ======
function ViewShipmentModal({ shipment, onClose }: { shipment: Shipment; onClose: () => void }) {
  const [history, setHistory] = useState<{ id: string; status: string; notes: string | null; created_at: string }[]>([])

  useEffect(() => {
    supabase.from('status_history').select('*').eq('shipment_id', shipment.id).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setHistory(data)
    })
  }, [shipment.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="glass-card w-full max-w-xl max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200">
              <Eye size={20} className="text-gold" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">تفاصيل الشحنة</h2>
              <p className="text-xs font-mono text-slate-400 font-bold">#{shipment.code || shipment.id.slice(0,8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg hover:bg-slate-200 text-slate-500"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className={`badge ${getStatusClass(shipment.status)} shadow-sm text-sm px-4 py-2`}>
              <span className="w-2 h-2 rounded-full bg-current opacity-75" />
              {getStatusLabel(shipment.status)}
            </span>
            <span className="text-xs text-slate-400 font-medium">{formatDate(shipment.created_at)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'العميل', value: shipment.client?.name || '—' },
              { label: 'المستلم', value: shipment.recipient_name },
              { label: 'هاتف المستلم', value: shipment.recipient_phone },
              { label: 'المحافظة', value: `${shipment.governorate}${shipment.district ? ' - ' + shipment.district : ''}` },
              { label: 'كلفة التوصيل', value: formatCurrency(shipment.delivery_fee) },
            ].map(item => (
              <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs text-slate-400 font-bold mb-1">{item.label}</p>
                <p className="font-bold text-slate-800 text-sm">{item.value}</p>
              </div>
            ))}
          </div>
          {shipment.notes && (
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-xs text-amber-600 font-bold mb-1">ملاحظات</p>
              <p className="text-sm text-slate-700 font-medium">{shipment.notes}</p>
            </div>
          )}
          {/* Status History */}
          {history.length > 0 && (
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2"><Clock size={14} className="text-gold" /> سجل الحالات</h3>
              <div className="space-y-2">
                {history.map(h => (
                  <div key={h.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-gold mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-bold text-slate-700">{getStatusLabel(h.status as ShipmentStatus)}</span>
                      {h.notes && <span className="text-slate-400 text-xs mr-2">- {h.notes}</span>}
                      <p className="text-xs text-slate-400">{formatDate(h.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ====== MAIN PAGE ======
export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [totalShipments, setTotalShipments] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all')
  const [governorateFilter, setGovernorateFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null)
  const [viewingShipment, setViewingShipment] = useState<Shipment | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [shippingStatuses, setShippingStatuses] = useState<{id: string, name: string, can_edit_shipment: boolean}[]>([])

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)
    return () => clearTimeout(handler)
  }, [search])

  const fetchStaticData = useCallback(async () => {
    try {
      const [warehousesRes, statusesRes] = await Promise.all([
        supabase.from('warehouses').select('*'),
        supabase.from('shipping_statuses').select('id, name, can_edit_shipment').order('created_at', { ascending: true })
      ])
      if (warehousesRes.data) setWarehouses(warehousesRes.data as Warehouse[])
      if (statusesRes.data) setShippingStatuses(statusesRes.data as {id: string, name: string, can_edit_shipment: boolean}[])
    } catch (err) {
      console.error('Failed to fetch static data:', err)
    }
  }, [])

  const fetchShipments = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase.from('shipments').select('*, client:clients(*), warehouse:warehouses(*)', { count: 'exact' })

      if (statusFilter !== 'all') query = query.eq('status', statusFilter)
      if (governorateFilter !== 'all') query = query.eq('governorate', governorateFilter)
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')
      
      if (debouncedSearch) {
        query = query.or(`code.ilike.%${debouncedSearch}%,number.ilike.%${debouncedSearch}%,recipient_name.ilike.%${debouncedSearch}%,recipient_phone.ilike.%${debouncedSearch}%`)
      }

      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      query = query.order('created_at', { ascending: false }).range(from, to)

      const { data, count, error } = await query

      if (error) throw error
      if (data) setShipments(data as unknown as Shipment[])
      if (count !== null) setTotalShipments(count)
      
    } catch (err) {
      console.error('Failed to fetch shipments:', err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, governorateFilter, dateFrom, dateTo, debouncedSearch])

  useEffect(() => { fetchStaticData() }, [fetchStaticData])
  useEffect(() => { fetchShipments() }, [fetchShipments])

  const handleDelete = async (id: string, code: string) => {
    if(!confirm('هل أنت متأكد من حذف هذه الشحنة؟')) return
    const { error } = await supabase.from('shipments').delete().eq('id', id)
    if(!error) {
      setShipments(p => p.filter(s => s.id !== id))
      setSelectedIds(p => p.filter(x => x !== id))
      await logActivity('حذف شحنة', 'shipment', code, `تم حذف الشحنة ${code}`)
      fetchShipments()
    }
  }

  const totalPages = Math.ceil(totalShipments / PAGE_SIZE) || 1
  const pagedShipments = shipments

  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const selectAll = () => setSelectedIds(selectedIds.length === pagedShipments.length ? [] : pagedShipments.map(s => s.id))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="page-header">
        <div className="page-title">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200">
            <Package size={20} className="text-gold" />
          </div>
          <span>قائمة الشحنات</span>
          <span className="text-sm font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md mr-2">{totalShipments} شحنة</span>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary shadow-sm">
          <Plus size={18} /> إضافة شحنة
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
            <div className="relative w-full sm:flex-1 min-w-[200px]">
              <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="البحث بالرقم، العميل، المستلم..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="input-field pr-11 shadow-sm w-full" />
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as ShipmentStatus | 'all'); setPage(1) }} className="input-field w-full sm:w-48 shadow-sm font-semibold flex-1">
                <option value="all">جميع الحالات</option>
                {STATUS_FILTER_OPTIONS.filter(o => o.value !== 'all').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                {shippingStatuses.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
              <select value={governorateFilter} onChange={e => { setGovernorateFilter(e.target.value); setPage(1) }} className="input-field w-full sm:w-40 shadow-sm font-semibold flex-1">
                <option value="all">كل المحافظات</option>
                {IRAQI_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          {/* Date Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">من:</label>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="input-field text-xs py-2 px-3 shadow-sm" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">إلى:</label>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="input-field text-xs py-2 px-3 shadow-sm" />
            </div>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 border-r border-slate-200 pr-3 mr-1">
                <span className="text-sm font-bold text-gold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">{selectedIds.length} محدد</span>
                <button 
                  onClick={async (e) => {
                    if (!confirm('هل أنت متأكد من إرسال الشحنات المحددة للوسيط؟')) return
                    
                    // Simple loop to send one by one
                    let successCount = 0
                    const originalBtnText = e.currentTarget.innerText
                    e.currentTarget.innerText = 'جاري الإرسال...'
                    e.currentTarget.disabled = true
                    
                    try {
                      for (const id of selectedIds) {
                        const res = await fetch('/api/waseet', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'send_shipment', shipmentId: id })
                        })
                        if (res.ok) {
                          successCount++
                        } else {
                          const errorData = await res.json().catch(() => ({}))
                          alert(`فشل إرسال شحنة للوسيط: ${errorData.error || 'خطأ غير معروف'}`)
                        }
                      }
                      if (successCount > 0) {
                        alert(`تم إرسال ${successCount} شحنة للوسيط بنجاح!`)
                      }
                      fetchShipmentsAndWarehouses()
                      setSelectedIds([])
                    } catch (err) {
                      console.error(err)
                      alert('حدث خطأ أثناء الإرسال للوسيط')
                    } finally {
                      e.currentTarget.innerText = 'إرسال للوسيط'
                      e.currentTarget.disabled = false
                    }
                  }}
                  className="btn-primary py-2 px-4 text-xs shadow-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={14} /> إرسال للوسيط
                </button>
                <button className="btn-ghost py-2 px-4 text-xs shadow-sm"><Printer size={14} /> طباعة</button>
              </div>
            )}
            <div className="mr-auto flex gap-2">
              {(search || statusFilter !== 'all' || governorateFilter !== 'all' || dateFrom || dateTo) && (
                <button onClick={() => { setSearch(''); setStatusFilter('all'); setGovernorateFilter('all'); setDateFrom(''); setDateTo(''); setPage(1) }} className="btn-ghost py-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 border-red-100">
                  <X size={14} /> مسح الكل
                </button>
              )}
              <button onClick={fetchShipmentsAndWarehouses} className="btn-ghost py-2 text-xs gap-1.5 shadow-sm">
                <RefreshCw size={14} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} /> تحديث
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="glass-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12 pl-0">
                  <input type="checkbox" checked={selectedIds.length === pagedShipments.length && pagedShipments.length > 0} onChange={selectAll} className="w-4 h-4 rounded border-slate-300 text-gold focus:ring-gold cursor-pointer" />
                </th>
                <th>الرقم</th>
                <th>المستلم</th>
                <th>العميل</th>
                <th>الحالة</th>
                <th>التوصيل</th>
                <th>التاريخ</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-20"><Loader2 size={32} className="mx-auto text-gold animate-spin" /></td></tr>
              ) : pagedShipments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <Package size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="font-semibold text-lg text-slate-500">لا توجد شحنات مطابقة</p>
                    <p className="text-sm">قم بتغيير فلاتر البحث أو أضف شحنة جديدة</p>
                  </td>
                </tr>
              ) : pagedShipments.map(s => (
                <tr key={s.id} className={selectedIds.includes(s.id) ? 'bg-amber-50/50' : ''}>
                  <td className="pl-0">
                    <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} className="w-4 h-4 rounded border-slate-300 text-gold focus:ring-gold cursor-pointer" />
                  </td>
                  <td>
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                      #{s.code || s.number}
                    </span>
                  </td>
                  <td>
                    <div className="text-sm space-y-1">
                      <div className="font-bold text-slate-800">{s.recipient_name}</div>
                      <div className="text-slate-500 text-xs font-medium bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-100">
                        {s.governorate}{s.district ? ' - ' + s.district : ''}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="font-bold text-slate-800 text-sm">{s.client?.name || '—'}</div>
                    <div className="text-xs text-slate-500 font-mono" dir="ltr">{s.client?.code || ''}</div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusClass(s.status)} shadow-sm whitespace-nowrap`}>
                      <span className="w-2 h-2 rounded-full bg-current opacity-75" />
                      {getStatusLabel(s.status)}
                    </span>
                  </td>
                  <td>
                    <span className="text-slate-800 font-bold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                      {formatCurrency(s.delivery_fee)}
                    </span>
                  </td>
                  <td><span className="text-xs font-medium text-slate-500">{formatDate(s.created_at)}</span></td>
                  <td>
                    <div className="flex items-center gap-1.5 flex-wrap min-w-[180px]">
                      <button className="btn-action edit" title="تعديل" onClick={() => setEditingShipment(s)}>
                        <Edit size={14} /> <span>تعديل</span>
                      </button>
                      <button className="btn-action view" title="عرض" onClick={() => setViewingShipment(s)}>
                        <Eye size={14} /> <span>عرض</span>
                      </button>
                      <button className="btn-action delete" title="حذف" onClick={() => handleDelete(s.id, s.code || s.number || '')}>
                        <Trash2 size={14} /> <span>حذف</span>
                      </button>
                      <a href={`/print/${s.id}`} target="_blank" rel="noopener noreferrer" className="btn-action view" title="طباعة">
                        <Printer size={14} /> <span>طباعة</span>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <span className="text-sm font-semibold text-slate-500">
            عرض {Math.min((page-1)*PAGE_SIZE+1, filteredShipments.length)}-{Math.min(page*PAGE_SIZE, filteredShipments.length)} من {filteredShipments.length} شحنة
          </span>
          <div className="flex items-center gap-2">
            <button className="btn-ghost py-2 px-4 text-xs shadow-sm bg-white" disabled={page === 1} onClick={() => setPage(p => p - 1)}>السابق</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = page <= 3 ? i + 1 : page - 2 + i
              if (pageNum < 1 || pageNum > totalPages) return null
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)}
                  className={`py-2 px-3 text-xs rounded-lg font-bold border ${page === pageNum ? 'bg-gold text-white border-gold shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {pageNum}
                </button>
              )
            })}
            <button className="btn-ghost py-2 px-4 text-xs shadow-sm bg-white" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>التالي</button>
          </div>
        </div>
      </div>

      {showAddModal && <AddShipmentModal onClose={() => setShowAddModal(false)} onAdd={s => { setShipments([s, ...shipments]); setPage(1) }} warehouses={warehouses} />}
      {editingShipment && <EditShipmentModal shipment={editingShipment} onClose={() => setEditingShipment(null)} onUpdate={s => setShipments(shipments.map(x => x.id === s.id ? s : x))} warehouses={warehouses} shippingStatuses={shippingStatuses} />}
      {viewingShipment && <ViewShipmentModal shipment={viewingShipment} onClose={() => setViewingShipment(null)} />}
    </div>
  )
}
