'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Package, Plus, Search, Filter, Printer, Trash2, Edit, Eye,
  RefreshCw, Send, X, Phone, MapPin, Scale, DollarSign,
  CheckCircle, MessageSquare, AlertCircle, Loader2, ChevronDown,
  ArrowUpDown, Clock, Truck, RotateCcw, CheckCircle2, XCircle, AlertTriangle, Image as ImageIcon, Warehouse as WarehouseIcon
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
    client_id: '', recipient_name: '', recipient_phone: '',
    governorate: '', district: '', weight: '', item_price: '',
    delivery_fee: '5000', cod_amount: '', notes: '', warehouse_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    supabase.from('clients').select('*').eq('is_active', true).then(({ data }) => {
      if (data) setClients(data as unknown as Client[])
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    let imageUrl = null
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

    const newShipmentData = {
      code: generateShipmentNumber(Math.floor(Math.random() * 9999)),
      client_id: form.client_id,
      recipient_name: form.recipient_name,
      recipient_phone: form.recipient_phone,
      governorate: form.governorate,
      district: form.district || null,
      amount: parseFloat(form.item_price) || 0,
      delivery_fee: parseFloat(form.delivery_fee) || 5000,
      notes: form.notes,
      status: 'new',
      warehouse_id: form.warehouse_id || null,
      image_url: imageUrl
    }
    
    try {
      const { data, error } = await supabase.from('shipments').insert([newShipmentData]).select('*, client:clients(*), warehouse:warehouses(*)').single()
      if (data && !error) {
        await logActivity('إنشاء شحنة', 'shipment', data.code, `تم إنشاء شحنة جديدة: ${data.code} للمستلم ${form.recipient_name}`)
        await addNotification('شحنة جديدة', `تم إنشاء الشحنة ${data.code}`, 'shipment', data.code)
        
        // WhatsApp Notification
        const { data: settings } = await supabase.from('whatsapp_settings').select('notify_new_shipment').single()
        if (settings?.notify_new_shipment && data.client?.phones?.[0]) {
          const msg = `مرحباً ${data.client.name} 👋\nتم استلام شحنتك بنجاح!\n\n📦 رقم الشحنة: #${data.code}\n👤 المستلم: ${form.recipient_name}\n📍 المحافظة: ${form.governorate}\n💰 المبلغ: ${formatCurrency(data.amount)}\n\n🔗 تتبع شحنتك: ${window.location.origin}/client-stats/${data.client_id}\n\nقمر الفيحاء للشحنات 🌙`
          await sendWhatsAppMessage(data.client.phones[0], msg, data.id)
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
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200">
              <Plus size={20} className="text-gold" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-800">إضافة شحنة جديدة</h2>
          </div>
          <button onClick={onClose} disabled={loading} className="btn-ghost p-2 rounded-lg hover:bg-slate-200 text-slate-500"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-700">العميل المرسل *</label>
              <select required value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} className="input-field bg-white shadow-sm" disabled={loading}>
                <option value="">اختر العميل...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} - {c.code}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-700">المستودع (المكان الحالي)</label>
              <select value={form.warehouse_id} onChange={e => setForm(p => ({ ...p, warehouse_id: e.target.value }))} className="input-field bg-white shadow-sm" disabled={loading}>
                <option value="">غير محدد</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <h3 className="text-xs font-extrabold uppercase mb-4 flex items-center gap-2 text-gold tracking-widest"><Phone size={14} /> بيانات المستلم</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-600">اسم المستلم *</label>
                <input type="text" placeholder="الاسم الكامل" required value={form.recipient_name} onChange={e => setForm(p => ({ ...p, recipient_name: e.target.value }))} disabled={loading} className="input-field bg-white shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-600">هاتف المستلم *</label>
                <input type="tel" placeholder="07XXXXXXXX" required value={form.recipient_phone} onChange={e => setForm(p => ({ ...p, recipient_phone: e.target.value }))} disabled={loading} className="input-field bg-white shadow-sm" />
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <h3 className="text-xs font-extrabold uppercase mb-4 flex items-center gap-2 text-gold tracking-widest"><MapPin size={14} /> العنوان</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-600">المحافظة *</label>
                <select required value={form.governorate} onChange={e => setForm(p => ({ ...p, governorate: e.target.value }))} disabled={loading} className="input-field bg-white shadow-sm">
                  <option value="">اختر المحافظة</option>
                  {IRAQI_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-600">المنطقة</label>
                <input type="text" placeholder="المنطقة / الحي" value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} disabled={loading} className="input-field bg-white shadow-sm" />
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <h3 className="text-xs font-extrabold uppercase mb-4 flex items-center gap-2 text-gold tracking-widest"><DollarSign size={14} /> التسعير</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-600">قيمة البضاعة *</label>
                <input type="number" placeholder="0" required value={form.item_price} onChange={e => setForm(p => ({ ...p, item_price: e.target.value }))} disabled={loading} className="input-field bg-white shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-600">كلفة التوصيل *</label>
                <input type="number" placeholder="5000" required value={form.delivery_fee} onChange={e => setForm(p => ({ ...p, delivery_fee: e.target.value }))} disabled={loading} className="input-field bg-white shadow-sm" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-600">صورة الشحنة (اختياري)</label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer bg-white border border-slate-200 border-dashed rounded-xl px-3 py-2 flex items-center justify-center text-xs text-slate-500 hover:bg-slate-50 transition-colors">
                  <ImageIcon size={16} className="mr-2" />
                  {imageFile ? imageFile.name : 'اختر صورة'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} disabled={loading} />
                </label>
                {imageFile && (
                  <button type="button" onClick={() => setImageFile(null)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-600">ملاحظات</label>
              <textarea placeholder="ملاحظات إضافية..." rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} disabled={loading} className="input-field resize-none shadow-sm h-[38px]" />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3 text-base shadow-md disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Package size={18} />} إضافة الشحنة
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="btn-ghost flex-1 justify-center py-3 text-base">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ====== EDIT SHIPMENT MODAL ======
function EditShipmentModal({ shipment, onClose, onUpdate, warehouses }: { shipment: Shipment; onClose: () => void; onUpdate: (s: Shipment) => void; warehouses: Warehouse[] }) {
  const [form, setForm] = useState({
    recipient_name: shipment.recipient_name,
    recipient_phone: shipment.recipient_phone,
    governorate: shipment.governorate,
    district: shipment.district || '',
    amount: String(shipment.amount || ''),
    delivery_fee: String(shipment.delivery_fee || ''),
    notes: shipment.notes || '',
    status: shipment.status,
    warehouse_id: shipment.warehouse_id || '',
  })
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const oldStatus = shipment.status
    let imageUrl = shipment.label_url || null // Reusing label_url or using new image_url column if needed. Wait, we added image_url to the DB! Let's assume we use image_url if available.
    
    // For now we will only append to updateData if image is uploaded
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
      amount: parseFloat(form.amount) || 0,
      delivery_fee: parseFloat(form.delivery_fee) || 0,
      notes: form.notes || null,
      status: form.status as ShipmentStatus,
      warehouse_id: form.warehouse_id || null,
      updated_at: new Date().toISOString(),
    }
    if (imageUrl) updateData.image_url = imageUrl

    const { data, error } = await supabase.from('shipments').update(updateData).eq('id', shipment.id).select('*, client:clients(*), warehouse:warehouses(*)').single()
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
          }).catch(err => console.error('[Waseet] Auto-send failed:', err))
        }

        // WhatsApp Notification (only if not going to waseet - waseet will handle its own notifications)
        if (form.status !== 'at_waseet_office' || shipment.waseet_qr_id) {
          const { data: settings } = await supabase.from('whatsapp_settings').select('notify_status_change').single()
          if (settings?.notify_status_change && data.client?.phones?.[0]) {
            const statusName = getStatusLabel(form.status as ShipmentStatus)
            let msg = `تحديث شحنتك #${data.code || shipment.id.slice(0,8)} 🔄\n\n📊 الحالة الجديدة: ${statusName}\n👤 المستلم: ${form.recipient_name}\n\n`
            
            if (form.status === 'delivered') {
              msg = `🎉 تم تسليم شحنتك بنجاح!\n\n📦 الشحنة: #${data.code || shipment.id.slice(0,8)}\n👤 المستلم: ${form.recipient_name}\n💰 المبلغ المحصّل: ${formatCurrency(data.amount)}\n\nشكراً لثقتكم بقمر الفيحاء 🌙`
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Status Change - LOCKED if shipment is with Waseet */}
          <div className={`p-4 rounded-2xl border ${shipment.waseet_qr_id ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-extrabold uppercase text-gold tracking-widest">تغيير الحالة</label>
              {shipment.waseet_qr_id && (
                <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                  <Truck size={12} /> يتحكم بها الوسيط • QR: {shipment.waseet_qr_id}
                </span>
              )}
            </div>
            {shipment.waseet_qr_id ? (
              <p className="text-xs text-amber-700 font-medium bg-amber-100 px-4 py-3 rounded-xl border border-amber-200">
                🔒 هذه الشحنة مع شركة الوسيط. يتم تحديث حالتها تلقائياً من الوسيط كل 30 دقيقة ولا يمكن تغييرها يدوياً.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STATUS_STEPS.map(s => (
                  <button key={s.value} type="button" onClick={() => setForm(p => ({ ...p, status: s.value }))}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${form.status === s.value ? 'text-white border-transparent shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                    style={form.status === s.value ? { background: s.color, borderColor: s.color } : {}}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-600">اسم المستلم</label>
              <input type="text" value={form.recipient_name} onChange={e => setForm(p => ({ ...p, recipient_name: e.target.value }))} disabled={loading} className="input-field bg-white shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-600">هاتف المستلم</label>
              <input type="tel" value={form.recipient_phone} onChange={e => setForm(p => ({ ...p, recipient_phone: e.target.value }))} disabled={loading} className="input-field bg-white shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-600">المحافظة</label>
              <select value={form.governorate} onChange={e => setForm(p => ({ ...p, governorate: e.target.value }))} disabled={loading} className="input-field bg-white shadow-sm">
                {IRAQI_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-600">المنطقة</label>
              <input type="text" value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} disabled={loading} className="input-field bg-white shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-600">قيمة البضاعة</label>
              <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} disabled={loading} className="input-field bg-white shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-600">كلفة التوصيل</label>
              <input type="number" value={form.delivery_fee} onChange={e => setForm(p => ({ ...p, delivery_fee: e.target.value }))} disabled={loading} className="input-field bg-white shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-600">المستودع الحالي</label>
              <select value={form.warehouse_id} onChange={e => setForm(p => ({ ...p, warehouse_id: e.target.value }))} className="input-field bg-white shadow-sm" disabled={loading}>
                <option value="">غير محدد</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-600">تحديث صورة الشحنة (اختياري)</label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer bg-white border border-slate-200 border-dashed rounded-xl px-3 py-2 flex items-center justify-center text-xs text-slate-500 hover:bg-slate-50 transition-colors">
                  <ImageIcon size={16} className="mr-2" />
                  {imageFile ? imageFile.name : 'اختر صورة جديدة'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} disabled={loading} />
                </label>
                {imageFile && (
                  <button type="button" onClick={() => setImageFile(null)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-600">ملاحظات</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} disabled={loading} className="input-field resize-none shadow-sm h-[38px]" />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3 shadow-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Edit size={18} />} حفظ التعديلات
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="btn-ghost flex-1 justify-center py-3">إلغاء</button>
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
              { label: 'قيمة البضاعة', value: formatCurrency(shipment.amount || 0) },
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
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
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
  const [warehouseFilter, setWarehouseFilter] = useState('all')

  const fetchShipmentsAndWarehouses = useCallback(async () => {
    setLoading(true)
    try {
      const [shipmentsRes, warehousesRes] = await Promise.all([
        supabase.from('shipments').select('*, client:clients(*), warehouse:warehouses(*)').order('created_at', { ascending: false }),
        supabase.from('warehouses').select('*')
      ])
      if (shipmentsRes.data) setShipments(shipmentsRes.data as unknown as Shipment[])
      if (warehousesRes.data) setWarehouses(warehousesRes.data as Warehouse[])
      if (shipmentsRes.error) console.error(shipmentsRes.error)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchShipmentsAndWarehouses() }, [fetchShipmentsAndWarehouses])

  const handleDelete = async (id: string, code: string) => {
    if(!confirm('هل أنت متأكد من حذف هذه الشحنة؟')) return
    const { error } = await supabase.from('shipments').delete().eq('id', id)
    if(!error) {
      setShipments(p => p.filter(s => s.id !== id))
      setSelectedIds(p => p.filter(x => x !== id))
      await logActivity('حذف شحنة', 'shipment', code, `تم حذف الشحنة ${code}`)
    }
  }

  const filteredShipments = shipments.filter(s => {
    const matchSearch = !search ||
      (s.code || s.number || '').toLowerCase().includes(search.toLowerCase()) ||
      s.recipient_name?.includes(search) ||
      s.client?.name?.includes(search) ||
      s.recipient_phone?.includes(search)
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    const matchGov = governorateFilter === 'all' || s.governorate === governorateFilter
    const matchWarehouse = warehouseFilter === 'all' || s.warehouse_id === warehouseFilter
    const matchFrom = !dateFrom || new Date(s.created_at) >= new Date(dateFrom)
    const matchTo = !dateTo || new Date(s.created_at) <= new Date(dateTo + 'T23:59:59')
    return matchSearch && matchStatus && matchGov && matchWarehouse && matchFrom && matchTo
  })

  const totalPages = Math.ceil(filteredShipments.length / PAGE_SIZE)
  const pagedShipments = filteredShipments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
          <span className="text-sm font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md mr-2">{filteredShipments.length} شحنة</span>
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
                {STATUS_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select value={governorateFilter} onChange={e => { setGovernorateFilter(e.target.value); setPage(1) }} className="input-field w-full sm:w-40 shadow-sm font-semibold flex-1">
                <option value="all">كل المحافظات</option>
                {IRAQI_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={warehouseFilter} onChange={e => { setWarehouseFilter(e.target.value); setPage(1) }} className="input-field w-full sm:w-40 shadow-sm font-semibold flex-1">
                <option value="all">المكان (الكل)</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
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
                <button className="btn-primary py-2 px-4 text-xs shadow-sm bg-blue-600 hover:bg-blue-700"><Send size={14} /> إرسال للوسيط</button>
                <button className="btn-ghost py-2 px-4 text-xs shadow-sm"><Printer size={14} /> طباعة</button>
              </div>
            )}
            <div className="mr-auto flex gap-2">
              {(search || statusFilter !== 'all' || governorateFilter !== 'all' || warehouseFilter !== 'all' || dateFrom || dateTo) && (
                <button onClick={() => { setSearch(''); setStatusFilter('all'); setGovernorateFilter('all'); setWarehouseFilter('all'); setDateFrom(''); setDateTo(''); setPage(1) }} className="btn-ghost py-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 border-red-100">
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
                <th>المكان الحالي</th>
                <th>الحالة</th>
                <th>المدفوعات</th>
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
                    {s.warehouse ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100">
                        <WarehouseIcon size={12} /> {s.warehouse.name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">—</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${getStatusClass(s.status)} shadow-sm whitespace-nowrap`}>
                      <span className="w-2 h-2 rounded-full bg-current opacity-75" />
                      {getStatusLabel(s.status)}
                    </span>
                  </td>
                  <td>
                    <div className="text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500 font-semibold">المبلغ:</span>
                        <span className={`font-bold ${(s.amount || 0) > 0 ? 'text-green-600 bg-green-50 px-2 py-0.5 rounded' : 'text-slate-400'}`}>
                          {(s.amount || 0) > 0 ? formatCurrency(s.amount || 0) : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-1">
                        <span className="text-slate-500 font-semibold">التوصيل:</span>
                        <span className="text-slate-700 font-bold">{formatCurrency(s.delivery_fee)}</span>
                      </div>
                    </div>
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
      {editingShipment && <EditShipmentModal shipment={editingShipment} onClose={() => setEditingShipment(null)} onUpdate={s => setShipments(shipments.map(x => x.id === s.id ? s : x))} warehouses={warehouses} />}
      {viewingShipment && <ViewShipmentModal shipment={viewingShipment} onClose={() => setViewingShipment(null)} />}
    </div>
  )
}
