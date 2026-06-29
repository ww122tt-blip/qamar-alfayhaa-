'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Shipment } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, Printer, Package, User, MapPin, Phone } from 'lucide-react'
import Barcode from 'react-barcode'
import Image from 'next/image'

export default function PrintShipmentLabel({ params }: { params: { id: string } }) {
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('shipments')
      .select('*, client:clients(*)')
      .eq('id', params.id)
      .single()
      .then(({ data }) => {
        if (data) setShipment(data as unknown as Shipment)
        setLoading(false)
      })
  }, [params.id])

  if (loading) return <div className="flex justify-center p-20"><Loader2 size={32} className="animate-spin text-gold" /></div>
  if (!shipment) return <div className="p-20 text-center text-red-500 font-bold">لم يتم العثور على الشحنة</div>

  return (
    <div className="bg-white min-h-screen font-sans" dir="rtl">
      {/* Non-printable controls */}
      <div className="print:hidden p-4 bg-slate-100 border-b flex justify-between items-center">
        <h1 className="font-bold text-slate-700">معاينة الطباعة</h1>
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700">
          <Printer size={18} /> طباعة
        </button>
      </div>

      {/* Printable Area (A6 size usually good for shipping labels: 105 x 148 mm) */}
      <div className="print-container w-full max-w-md mx-auto p-4 sm:p-6 bg-white print:p-0 print:max-w-none">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-black">قمر الفيحاء</h2>
            <p className="text-sm font-bold text-slate-600 tracking-wider">للشحن والتوصيل السريع</p>
          </div>
          <div className="text-left" dir="ltr">
            <Barcode value={shipment.tracking_number || shipment.code || shipment.id.slice(0,8)} width={1.8} height={40} fontSize={14} font="monospace" margin={0} />
          </div>
        </div>

        {/* Sender & Receiver Info */}
        <div className="grid grid-cols-2 gap-4 border-b-2 border-black pb-4 mb-4">
          
          {/* Receiver */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><MapPin size={12}/> إلى (المستلم):</h3>
            <p className="font-bold text-black text-lg">{shipment.recipient_name}</p>
            <p className="text-black font-semibold mt-1 flex items-center gap-1"><Phone size={12}/> {shipment.recipient_phone}</p>
            <p className="text-black font-bold mt-1 text-sm">{shipment.governorate} {shipment.district ? `- ${shipment.district}` : ''}</p>
          </div>

          {/* Sender */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><User size={12}/> من (المرسل):</h3>
            <p className="font-bold text-black text-sm">{shipment.client?.name}</p>
            <p className="text-black font-semibold mt-1 text-xs" dir="ltr">{shipment.client?.phones?.[0]}</p>
            <p className="text-xs text-slate-500 mt-2 font-mono">كود العميل: {shipment.client?.code}</p>
          </div>

        </div>

        {/* Financials & Details */}
        <div className="grid grid-cols-2 gap-4 border-b-2 border-black pb-4 mb-4">
          <div className="border-l-2 border-dashed border-slate-300 pl-4">
            <p className="text-xs font-bold text-slate-500 mb-1">المبلغ المطلوب (التوصيل):</p>
            <p className="text-2xl font-extrabold text-black bg-slate-100 inline-block px-3 py-1 rounded">{formatCurrency(shipment.delivery_fee)}</p>
          </div>
          <div>
             <p className="text-xs font-bold text-slate-500 mb-1">تاريخ الإصدار:</p>
             <p className="text-sm font-bold text-black">{formatDate(shipment.created_at)}</p>
             <p className="text-xs font-bold text-slate-500 mb-1 mt-2">نوع الشحنة:</p>
             <p className="text-sm font-bold text-black">{shipment.type === 'per_kg' ? `بالوزن (${shipment.weight} كغم)` : shipment.type === 'carton' ? 'كارتون' : shipment.type === 'bag' ? 'كيس' : 'طلب عادي'}</p>
          </div>
        </div>

        {/* QR Code / Waseet Info if available */}
        {shipment.waseet_qr_id && (
          <div className="border border-slate-300 rounded-lg p-3 text-center bg-slate-50 mb-4">
            <p className="text-xs font-bold text-slate-500 mb-1">QR الوسيط (Waseet):</p>
            <p className="font-mono font-bold text-black">{shipment.waseet_qr_id}</p>
          </div>
        )}

        {/* Notes */}
        {shipment.notes && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-4">
            <p className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1">ملاحظات هامة:</p>
            <p className="text-sm font-bold text-black">{shipment.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-slate-200">
           <p className="text-xs font-bold text-slate-400">تتبع شحنتك عبر موقعنا: qamar-alfayhaa.vercel.app</p>
        </div>

      </div>

      <style jsx global>{\`
        @media print {
          body { background: white; margin: 0; padding: 0; }
          .print\\\\:hidden { display: none !important; }
          .print-container { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
        }
      \`}</style>
    </div>
  )
}
