'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Shipment } from '@/types'
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils'
import { ArrowRight, Box, Loader2, Circle, CheckCircle2 } from 'lucide-react'

export default function ClientShipmentDetail() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string
  const shipmentId = params.shipmentId as string

  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!clientId || !shipmentId) return
      
      const { data } = await supabase.from('shipments').select('*').eq('id', shipmentId).eq('client_id', clientId).single()
      if (data) setShipment(data as unknown as Shipment)
      
      setLoading(false)
    }
    fetchData()
  }, [clientId, shipmentId])

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-12 h-12 text-red-600 animate-spin" /></div>
  }

  if (!shipment) {
    return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 text-xl font-bold gap-4">
      الشحنة غير موجودة أو ليس لديك صلاحية للوصول إليها
      <button onClick={() => router.push(`/client-stats/${clientId}`)} className="text-red-600 text-sm hover:underline font-normal">العودة لبوابة العميل</button>
    </div>
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-6">
          <div className="w-10"></div> {/* Spacer for centering */}
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-wider text-slate-900">QAMAR AL-FAYHAA</h1>
            <div className="text-sm text-slate-500">تفاصيل الشحنة</div>
          </div>
          <button onClick={() => router.push(`/client-stats/${clientId}`)} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
            <ArrowRight size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Detail Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm relative">
          
          <div className="absolute top-4 right-4 bg-slate-100 border border-slate-200 text-slate-700 font-bold px-4 py-1.5 rounded-lg text-sm shadow-sm">
            {getStatusLabel(shipment.status)}
          </div>

          <div className="p-6 pt-16 flex flex-col items-center text-center border-b border-slate-200">
            <div className="text-lg font-bold text-slate-800 mb-6 tracking-widest">{shipment.tracking_number}</div>
            
            <div className="w-full max-w-sm aspect-[4/3] bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden mb-8 relative shadow-inner">
              {shipment.label_url ? (
                <img src={shipment.label_url} alt="Shipment Label" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <Box size={48} className="mb-2 opacity-30" />
                  <span>لا توجد صورة للبولصة</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-y-6 w-full text-right mb-6">
              <div>
                <div className="text-slate-500 text-sm mb-1 font-bold">النوع</div>
                <div className="text-cyan-600 font-bold">{shipment.type || 'بوكس'}</div>
              </div>
              <div>
                <div className="text-slate-500 text-sm mb-1 font-bold">الوزن</div>
                <div className="text-slate-700 font-bold">{shipment.weight || 0} كغ</div>
              </div>
              <div>
                <div className="text-slate-500 text-sm mb-1 font-bold">سعر الوحدة</div>
                <div className="text-slate-700 font-bold">{formatCurrency((shipment.amount || 0) - (shipment.delivery_price || 0)).split(' ')[0]}</div>
              </div>
              <div>
                <div className="text-slate-500 text-sm mb-1 font-bold">سعر التوصيل</div>
                <div className="text-slate-700 font-bold">{formatCurrency(shipment.delivery_price || 0).split(' ')[0]}</div>
              </div>
            </div>

            <div className="w-full bg-slate-50 rounded-xl p-4 flex flex-col items-center justify-center border border-red-100 mb-6 shadow-inner">
              <div className="text-slate-500 text-sm mb-1 font-bold">الإجمالي</div>
              <div className="text-3xl font-bold text-red-600">{formatCurrency(shipment.amount || 0).split(' ')[0]}</div>
            </div>

            <div className="grid grid-cols-2 gap-y-6 w-full text-right">
              <div>
                <div className="text-slate-500 text-sm mb-1 font-bold">رقم التتبع</div>
                <div className="text-slate-700 font-bold font-mono">{shipment.id.slice(0, 8)}</div>
              </div>
              <div>
                <div className="text-slate-500 text-sm mb-1 font-bold">تتبع شركة التوصيل</div>
                <div className="text-slate-700 font-bold font-mono">{shipment.tracking_number}</div>
              </div>
              <div className="col-span-2 text-center">
                <div className="text-slate-500 text-sm mb-1 font-bold">المستودع</div>
                <div className="text-slate-700 font-bold">مستودع بغداد</div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-6 text-center flex justify-center gap-6 text-slate-400 text-xs font-mono">
            <span>{formatDate(shipment.created_at)}</span>
            <span>{formatDate(shipment.updated_at || shipment.created_at)}</span>
          </div>

        </div>

        {/* Timeline */}
        <div className="pt-8 relative px-4 pb-12">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-50 px-4 text-sm text-slate-500 font-bold">سجل التتبع</div>
          
          <div className="mt-8 space-y-6">
            <div className="flex flex-row-reverse items-start gap-4">
              <div className="relative flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1 z-10 ring-4 ring-yellow-50"></div>
                <div className="w-px h-full bg-slate-200 absolute top-4 bottom-[-24px]"></div>
              </div>
              <div className="text-left w-full">
                <div className="font-bold text-slate-800 text-lg">تم الاستلام في مستودع بغداد</div>
                <div className="text-slate-500 text-xs mt-1 font-mono">{formatDate(shipment.created_at)}</div>
              </div>
            </div>

            {shipment.status !== 'new' && (
              <div className="flex flex-row-reverse items-start gap-4">
                <div className="relative flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-cyan-500 mt-1 z-10 ring-4 ring-cyan-50"></div>
                  <div className="w-px h-full bg-slate-200 absolute top-4 bottom-[-24px]"></div>
                </div>
                <div className="text-left w-full">
                  <div className="font-bold text-slate-800 text-lg">قيد المعالجة</div>
                  <div className="text-slate-500 text-xs mt-1 font-mono">{formatDate(shipment.updated_at || shipment.created_at)}</div>
                </div>
              </div>
            )}

            <div className="flex flex-row-reverse items-start gap-4">
              <div className="relative flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-slate-400 mt-1 z-10 ring-4 ring-slate-100"></div>
              </div>
              <div className="text-left w-full">
                <div className="font-bold text-slate-800 text-lg">{getStatusLabel(shipment.status)}</div>
                <div className="text-slate-500 text-xs mt-1 font-mono">{formatDate(shipment.updated_at || shipment.created_at)}</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
