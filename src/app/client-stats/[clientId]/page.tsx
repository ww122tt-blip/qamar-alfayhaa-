'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client, Shipment } from '@/types'
import { formatCurrency, formatDate, getStatusClass, getStatusLabel } from '@/lib/utils'
import { Search, Package, MapPin, ExternalLink, Loader2, Phone, Home } from 'lucide-react'

export default function ClientPortal() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string

  const [client, setClient] = useState<Client | null>(null)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active'>('all')

  useEffect(() => {
    async function fetchData() {
      if (!clientId) return
      const [clientRes, shipmentsRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', clientId).eq('is_active', true).single(),
        supabase.from('shipments').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
      ])
      const clientResData = clientRes as any
      const shipmentsResData = shipmentsRes as any

      if (!clientResData.data) {
        setNotFound(true)
      } else {
        setClient(clientResData.data as unknown as Client)
      }
      if (shipmentsResData.data) setShipments(shipmentsResData.data as unknown as Shipment[])
      setLoading(false)
    }
    fetchData()
  }, [clientId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <Package size={64} className="text-slate-300" />
        <h1 className="text-2xl font-extrabold text-slate-700">الرابط غير صالح</h1>
        <p className="text-slate-400">هذا الرابط غير موجود أو تم إلغاؤه من قبل المتجر</p>
      </div>
    )
  }

  if (!client) return null

  const activeShipments = shipments.filter(s => s.status !== 'delivered' && s.status !== 'returned' && s.status !== 'cancelled')
  const displayedShipments = filter === 'all' ? shipments : activeShipments

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans" dir="rtl">

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-5 h-5" fill="none">
                <path d="M65 20 C45 20 30 35 30 55 C30 75 45 90 65 90 C50 82 40 68 40 55 C40 42 50 28 65 20Z" fill="#C9A84C" />
              </svg>
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-sm leading-tight">قمر الفيحاء للشحنات</div>
              <div className="text-xs text-slate-400">بوابة متابعة الطلبات</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-800">{client.name}</div>
            <div className="text-xs font-mono text-slate-400">{client.code}</div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Client Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center font-extrabold text-xl text-red-600">
                {client.name.substring(0, 2)}
              </div>
              <div>
                <h2 className="font-extrabold text-slate-800 text-lg">{client.name}</h2>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {client.phones?.[0] && (
                    <span className="flex items-center gap-1.5 text-sm text-slate-500 font-mono" dir="ltr">
                      <Phone size={13} className="text-slate-400" /> {client.phones[0]}
                    </span>
                  )}
                  {client.governorate && (
                    <span className="flex items-center gap-1.5 text-sm text-slate-500 font-bold">
                      <MapPin size={13} className="text-slate-400" /> {client.governorate}{client.district ? ' - ' + client.district : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {[
                { label: 'إجمالي', value: shipments.length, color: 'text-slate-800', bg: 'bg-slate-100' },
                { label: 'فعالة', value: activeShipments.length, color: 'text-amber-700', bg: 'bg-amber-50' },
                { label: 'مسلّمة', value: shipments.filter(s => s.status === 'delivered').length, color: 'text-green-700', bg: 'bg-green-50' },
              ].map(stat => (
                <div key={stat.label} className={`${stat.bg} rounded-xl px-4 py-2 text-center min-w-[60px]`}>
                  <p className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-slate-400 font-bold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-extrabold text-slate-700 text-lg flex items-center gap-2">
            <Package size={18} className="text-red-500" /> الشحنات
          </h3>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'الكل', count: shipments.length },
              { value: 'active', label: 'فعالة', count: activeShipments.length },
            ].map(f => (
              <button key={f.value} onClick={() => setFilter(f.value as 'all' | 'active')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all ${filter === f.value ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {f.label}
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${filter === f.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Shipments Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold">التاريخ</th>
                  <th className="p-4 font-bold">رمز الشحنة</th>
                  <th className="p-4 font-bold">المستلم</th>
                  <th className="p-4 font-bold">المحافظة</th>
                  <th className="p-4 font-bold">الحالة</th>
                  <th className="p-4 font-bold">قيمة البضاعة</th>
                  <th className="p-4 font-bold">التوصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedShipments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-16 text-center">
                      <Package size={48} className="mx-auto mb-4 text-slate-200" />
                      <p className="font-bold text-slate-400">لا توجد شحنات بعد</p>
                    </td>
                  </tr>
                ) : displayedShipments.map(s => (
                  <tr key={s.id}
                    onClick={() => router.push(`/client-stats/${clientId}/shipment/${s.id}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <td className="p-4 text-slate-400 font-mono text-xs">{formatDate(s.created_at)}</td>
                    <td className="p-4">
                      <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 border border-slate-200">
                        #{s.code || s.number || s.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{s.recipient_name}</div>
                      <div className="text-xs text-slate-400 font-mono" dir="ltr">{s.recipient_phone}</div>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {s.governorate}{s.district ? ' - ' + s.district : ''}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getStatusClass(s.status)}`}>
                        {getStatusLabel(s.status)}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-green-700">{formatCurrency(s.amount || 0)}</td>
                    <td className="p-4 font-bold text-slate-500">{formatCurrency(s.delivery_fee || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs pb-4">
          قمر الفيحاء للشحنات — جميع الحقوق محفوظة © 2026
        </p>
      </div>
    </div>
  )
}
