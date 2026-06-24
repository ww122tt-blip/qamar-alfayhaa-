'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserPlus, Check, X, Phone, MapPin, Search, RefreshCw, Loader2, Clock, Building } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { Client } from '@/types'

type PendingClient = Client & { notes?: string }

export default function RegistrationRequestsPage() {
  const [pending, setPending] = useState<PendingClient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchPending = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('is_active', false)
      .order('created_at', { ascending: false })
    if (data) setPending(data as unknown as PendingClient[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchPending() }, [fetchPending])

  const handleApprove = async (client: PendingClient) => {
    setActionLoading(client.id)
    const { error } = await supabase.from('clients').update({ is_active: true }).eq('id', client.id)
    if (!error) {
      setPending(p => p.filter(c => c.id !== client.id))
      // Archive the notification
      await supabase.from('notifications').update({ is_archived: true, is_read: true }).eq('entity_id', client.code).eq('type', 'system')
      // Log
      await supabase.from('activity_logs').insert([{
        action: 'قبول طلب تسجيل', entity_type: 'client', entity_id: client.code,
        details: `تم قبول طلب التسجيل للعميل ${client.name}`, user_name: 'Admin'
      }])
      // Add welcome notification
      await supabase.from('notifications').insert([{
        title: 'تم قبول حسابك',
        content: `مرحباً ${client.name}! تم قبول حسابك. يمكنك الآن الدخول لبوابتك.`,
        type: 'system', entity_type: 'client', entity_id: client.code, is_read: false, is_archived: false,
      }])
      
      // Send WhatsApp message with direct portal link
      if (client.phones?.[0]) {
        const portalUrl = `${window.location.origin}/client-stats/${client.id}`
        const msg = `مرحباً ${client.name} 👋\n\nتم قبول حسابك بنجاح وتفعيله في نظام قمر الفيحاء للشحنات.\nرابط بوابة المتجر الخاصة بك لمتابعة شحناتك هو:\n${portalUrl}\n\nملاحظة: يرجى الاحتفاظ بهذا الرابط، فهو الرابط الوحيد الخاص بك للدخول.\n\nقمر الفيحاء 🌙`
        await sendWhatsAppMessage(client.phones[0], msg)
      }
    }
    setActionLoading(null)
  }

  const handleReject = async (client: PendingClient) => {
    if (!confirm(`هل أنت متأكد من رفض طلب ${client.name}؟ سيتم حذف حسابه نهائياً.`)) return
    setActionLoading(client.id)
    await supabase.from('clients').delete().eq('id', client.id)
    setPending(p => p.filter(c => c.id !== client.id))
    setActionLoading(null)
  }

  const filtered = pending.filter(c =>
    !search || c.name.includes(search) || c.phones[0]?.includes(search) || c.governorate.includes(search)
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div className="page-title">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200">
            <UserPlus size={20} className="text-gold" />
          </div>
          <span className="text-slate-800">طلبات التسجيل</span>
          {pending.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
              {pending.length} جديد
            </span>
          )}
        </div>
        <button onClick={fetchPending} className="btn-ghost shadow-sm">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> تحديث
        </button>
      </div>

      {/* Search */}
      <div className="relative w-72">
        <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-11 shadow-sm" />
      </div>

      {/* List */}
      {loading ? (
        <div className="glass-card p-16 text-center"><Loader2 size={32} className="mx-auto text-gold animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center text-slate-400 shadow-sm">
          <UserPlus size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-bold text-lg text-slate-500">لا توجد طلبات تسجيل معلقة</p>
          <p className="text-sm mt-1">ستظهر هنا طلبات العملاء الجدد من صفحة التسجيل العامة</p>
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 inline-block">
            <p className="text-xs font-bold text-slate-600">رابط التسجيل العام:</p>
            <p className="text-xs font-mono text-gold mt-1 select-all">{typeof window !== 'undefined' ? window.location.origin : ''}/signup</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(client => (
            <div key={client.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 p-5">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-100 flex items-center justify-center font-extrabold text-xl text-gold flex-shrink-0 shadow-sm">
                  {client.name.substring(0, 2)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-extrabold text-slate-800 text-base">{client.name}</h3>
                    <span className="badge badge-pending shadow-sm text-xs">بانتظار المراجعة</span>
                    <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{client.code}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5 font-mono" dir="ltr">
                      <Phone size={12} className="text-slate-400" /> {client.phones[0]}
                      {client.phones[1] && <span className="text-slate-400"> / {client.phones[1]}</span>}
                    </span>
                    <span className="flex items-center gap-1.5 font-bold">
                      <MapPin size={12} className="text-slate-400" />
                      {client.governorate}{client.district ? ' - ' + client.district : ''}
                    </span>
                    {client.notes && (
                      <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                        <Building size={12} /> {client.notes}
                      </span>
                    )}
                  </div>
                  {client.address && (
                    <p className="text-xs text-slate-400 mt-1 font-medium">{client.address}</p>
                  )}
                </div>

                {/* Time */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
                    <Clock size={12} />
                    {formatDate(client.created_at)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex border-t border-slate-100">
                <button
                  onClick={() => handleApprove(client)}
                  disabled={actionLoading === client.id}
                  className="flex-1 flex items-center justify-center gap-2.5 py-3.5 text-sm font-extrabold text-green-700 bg-green-50 hover:bg-green-100 border-l border-slate-100 transition-colors disabled:opacity-50">
                  {actionLoading === client.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  قبول وتفعيل الحساب
                </button>
                <button
                  onClick={() => handleReject(client)}
                  disabled={actionLoading === client.id}
                  className="flex-1 flex items-center justify-center gap-2.5 py-3.5 text-sm font-extrabold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50">
                  {actionLoading === client.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                  رفض وحذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
