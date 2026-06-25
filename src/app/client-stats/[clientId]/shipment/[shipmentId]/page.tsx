'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Shipment, Client, Warehouse } from '@/types'
import { Package, MapPin, User, Calendar, Truck, CheckCircle2, AlertCircle, Clock, FileText, Phone, Building2, Store, Image as ImageIcon } from 'lucide-react'
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils'
import Link from 'next/link'

interface StatusHistory {
  id: string
  status: string
  notes: string | null
  created_at: string
}

export default function ClientShipmentTrackingPage() {
  const { clientId, shipmentId } = useParams()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [history, setHistory] = useState<StatusHistory[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchShipment() {
      try {
        const { data: shipmentData, error: shipmentError } = await supabase
          .from('shipments')
          .select('*, client:clients(*), warehouse:warehouses(*)')
          .eq('id', shipmentId as string)
          .single()

        if (shipmentError) throw shipmentError

        setShipment(shipmentData as unknown as Shipment)
        setClient(shipmentData.client as unknown as Client)

        const { data: historyData } = await supabase
          .from('status_history')
          .select('*')
          .eq('shipment_id', shipmentId as string)
          .order('created_at', { ascending: true })

        if (historyData) setHistory(historyData)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (shipmentId) {
      fetchShipment()
    }
  }, [shipmentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">الشحنة غير موجودة</h1>
        <p className="text-slate-500 mb-6">عذراً، لم نتمكن من العثور على معلومات هذه الشحنة.</p>
        <Link href={`/client-stats/${clientId}`} className="px-6 py-3 bg-[#6b0f1a] text-white rounded-xl font-bold">
          العودة للقائمة
        </Link>
      </div>
    )
  }

  // Map history to timeline logic
  const allStatuses = [
    { key: 'new', label: 'تم استلام الطلب', icon: Package, desc: 'تم استلام شحنتك بنجاح' },
    { key: 'at_waseet_office', label: 'في المستودع', icon: Store, desc: 'جاري تجهيز الشحنة للشحن' },
    { key: 'picked_up', label: 'قيد الشحن', icon: Truck, desc: 'تم شحن الشحنة' },
    { key: 'out_for_delivery', label: 'عند مندوب الاستلام', icon: User, desc: 'الشحنة مع مندوب الاستلام للتسليم' },
    { key: 'delivered', label: 'تم التسليم', icon: CheckCircle2, desc: 'تم تسليم الشحنة بنجاح' }
  ]

  // Find current index
  const currentIndex = allStatuses.findIndex(s => s.key === shipment.status)

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans pb-10" dir="rtl">
      {/* Header */}
      <div className="bg-[#6b0f1a] pt-6 pb-20 px-6 rounded-b-[40px] relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#c9a84c 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2 shadow-lg border-2 border-[#c9a84c]">
              <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                <path d="M65 20 C45 20 30 35 30 55 C30 75 45 90 65 90 C50 82 40 68 40 55 C40 42 50 28 65 20Z" fill="#C9A84C" />
                <circle cx="65" cy="40" r="8" fill="#C9A84C" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-extrabold text-xl tracking-tight">قمر الفيحاء</h1>
              <p className="text-[#c9a84c] text-xs font-bold tracking-widest">للخدمات اللوجستية</p>
            </div>
          </div>
          <div className="text-left">
            <h2 className="text-white font-bold text-lg">تتبع شحنتك بسهولة</h2>
            <p className="text-white/70 text-xs mt-0.5">رابط تتبع الشحنة</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-12 space-y-4 relative z-20">
        
        {/* Welcome & Client Info Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
          <div className="flex items-start justify-between mb-6">
            <div className="pr-2">
              <h3 className="text-xl font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                مرحباً {client?.name} <span className="text-xl">👋</span>
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                شحنتك حالياً {shipment.warehouse ? `في ${shipment.warehouse.name}` : 'قيد المعالجة'}.
                <br />يرجى متابعة الصفحة لمعرفة آخر تحديثات الشحنة.
              </p>
            </div>
            <div className="w-14 h-14 bg-[#6b0f1a] rounded-full flex items-center justify-center flex-shrink-0 text-[#c9a84c] shadow-inner shadow-black/20 border-2 border-white">
              <User size={28} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-5 border-t border-slate-100">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 mb-1 flex justify-center"><FileText size={14} /></p>
              <p className="text-xs font-bold text-slate-700 font-mono">الكود</p>
              <p className="text-xs font-extrabold text-slate-900 mt-1">{client?.code}</p>
            </div>
            <div className="text-center border-r border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 mb-1 flex justify-center"><Phone size={14} /></p>
              <p className="text-xs font-bold text-slate-700">رقم الهاتف</p>
              <p className="text-xs font-extrabold text-slate-900 mt-1 font-mono" dir="ltr">{client?.phones?.[0]}</p>
            </div>
            <div className="text-center border-r border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 mb-1 flex justify-center"><Package size={14} /></p>
              <p className="text-xs font-bold text-slate-700">الوزن</p>
              <p className="text-xs font-extrabold text-slate-900 mt-1">{shipment.weight ? `${shipment.weight} كغ` : '-'}</p>
            </div>
            <div className="text-center border-r border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 mb-1 flex justify-center"><Calendar size={14} /></p>
              <p className="text-xs font-bold text-slate-700">آخر تحديث</p>
              <p className="text-[10px] font-extrabold text-slate-900 mt-1 leading-tight">{formatDate(shipment.updated_at).replace(' ', '\n')}</p>
            </div>
          </div>
        </div>

        {/* Timeline Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-50 flex items-center gap-2">
            <Truck size={20} className="text-[#6b0f1a]" />
            <h3 className="font-extrabold text-slate-800 text-lg">حالة الشحنة</h3>
          </div>
          
          <div className="p-6">
            <div className="relative border-r-2 border-slate-100 pr-6 space-y-8">
              {allStatuses.map((s, index) => {
                const isCompleted = index <= currentIndex;
                const isCurrent = index === currentIndex;
                const hEntry = history.find(h => h.status === s.key) || (isCurrent ? { created_at: shipment.updated_at } : null);

                return (
                  <div key={s.key} className="relative">
                    {/* Circle Indicator */}
                    <div className={`absolute -right-[35px] w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors duration-500
                      ${isCurrent ? 'bg-[#c9a84c] text-white scale-110 shadow-lg shadow-[#c9a84c]/30' : 
                        isCompleted ? 'bg-[#6b0f1a] text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {isCompleted && !isCurrent ? <CheckCircle2 size={16} /> : <s.icon size={14} />}
                    </div>

                    <div className={`transition-all duration-300 ${isCurrent ? 'bg-amber-50/80 p-3 rounded-2xl -mx-3 border border-amber-100/50 shadow-sm' : ''}`}>
                      <h4 className={`text-sm font-extrabold mb-1 ${isCurrent ? 'text-amber-900' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                        {s.label}
                      </h4>
                      <p className={`text-xs ${isCurrent ? 'text-amber-700/80 font-medium' : 'text-slate-500'}`}>
                        {s.desc}
                      </p>
                      {hEntry && (
                        <p className="text-[10px] font-bold text-slate-400 mt-2 font-mono bg-white inline-block px-2 py-0.5 rounded border border-slate-100">
                          {formatDate(hEntry.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Current Status Footer Bar */}
          <div className="bg-[#6b0f1a] p-4 text-center">
            <p className="text-white font-bold text-sm flex items-center justify-center gap-2">
              <Building2 size={16} className="text-[#c9a84c]" />
              الحالة الحالية: <span className="text-[#c9a84c]">{shipment.warehouse ? `في ${shipment.warehouse.name}` : getStatusLabel(shipment.status)}</span>
            </p>
          </div>
        </div>

        {/* Shipment Details Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-[#6b0f1a]" />
              <h3 className="font-extrabold text-slate-800 text-lg">تفاصيل الشحنة</h3>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-lg border border-slate-200">
              #{shipment.code || shipment.number}
            </span>
          </div>

          <div className="p-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">المستلم</p>
              <p className="text-sm font-extrabold text-slate-800">{shipment.recipient_name}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">العنوان</p>
              <p className="text-sm font-extrabold text-slate-800">{shipment.governorate} {shipment.district && `- ${shipment.district}`}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">قيمة البضاعة</p>
              <p className="text-sm font-extrabold text-[#6b0f1a]">{formatCurrency(shipment.amount || 0)}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">تاريخ الاستلام</p>
              <p className="text-sm font-extrabold text-slate-800">{new Date(shipment.created_at).toLocaleDateString('ar-IQ')}</p>
            </div>
            
            {(shipment.notes || (shipment as any).image_url) && (
              <div className="col-span-2 mt-2 pt-4 border-t border-slate-100 space-y-4">
                {shipment.notes && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-1">ملاحظات</p>
                    <p className="text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">{shipment.notes}</p>
                  </div>
                )}
                {(shipment as any).image_url && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1"><ImageIcon size={14} /> صورة الشحنة</p>
                    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={(shipment as any).image_url} alt="Shipment" className="w-full h-auto max-h-64 object-contain" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 pb-6">
          <button className="flex-1 bg-[#c9a84c] hover:bg-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2">
            <MapPin size={18} />
            موقع المكتب / تعليمات
          </button>
          <button className="flex-1 bg-[#6b0f1a] hover:bg-red-900 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2">
            <Phone size={18} />
            تواصل مع خدمة العملاء
          </button>
        </div>
        
        {/* Footer */}
        <p className="text-center text-xs font-bold text-slate-400">
          جميع الحقوق محفوظة © قمر الفيحاء للخدمات اللوجستية
        </p>

      </div>
    </div>
  )
}
