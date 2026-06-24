'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { ScanLine, Save, Trash2, AlertCircle, CheckCircle2, Package, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Shipment, ShipmentStatus } from '@/types'
import { getStatusClass, getStatusLabel, formatCurrency } from '@/lib/utils'

const STATUS_OPTIONS: { value: ShipmentStatus; label: string }[] = [
  { value: 'picked_up', label: 'تم الاستلام في المخزن' },
  { value: 'at_waseet_office', label: 'تم التسليم للوسيط' },
  { value: 'out_for_delivery', label: 'خرجت للتوصيل' },
  { value: 'delivered', label: 'تم التسليم بنجاح' },
  { value: 'returned', label: 'مرتجعة للمخزن' },
]

export default function BarcodeScannerPage() {
  const [targetStatus, setTargetStatus] = useState<ShipmentStatus>('picked_up')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [scannedShipments, setScannedShipments] = useState<Shipment[]>([])
  const [loadingCode, setLoadingCode] = useState(false)
  const [savingAll, setSavingAll] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)

  // Keep focus on input automatically
  useEffect(() => {
    inputRef.current?.focus()
  }, [scannedShipments, targetStatus])

  // Click anywhere on the background to refocus
  const handleContainerClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'SELECT') {
      inputRef.current?.focus()
    }
  }

  // Handle barcode submission (usually triggered by 'Enter' key from the scanner)
  const handleScan = async (e: FormEvent) => {
    e.preventDefault()
    const code = barcodeInput.trim()
    if (!code) return

    setBarcodeInput('') // clear immediately for next scan
    setErrorMsg('')
    setSuccessMsg('')
    setLoadingCode(true)

    // Check if already scanned
    if (scannedShipments.some(s => s.code === code || s.id.startsWith(code))) {
      setErrorMsg(`الشحنة ${code} ممسوحة مسبقاً في القائمة!`)
      setLoadingCode(false)
      // Beep sound for error
      playBeep(false)
      return
    }

    // Fetch shipment from DB
    const { data, error } = await supabase
      .from('shipments')
      .select('*, client:clients(name)')
      .or(`code.eq.${code},id.eq.${code}`)
      .single()

    if (error || !data) {
      setErrorMsg(`لم يتم العثور على شحنة بالرقم: ${code}`)
      playBeep(false)
    } else {
      // Prevent scanning if status is already the target status
      if (data.status === targetStatus) {
         setErrorMsg(`الشحنة ${code} هي بالفعل بحالة: ${getStatusLabel(targetStatus)}!`)
         playBeep(false)
      } else {
         setScannedShipments(prev => [data as unknown as Shipment, ...prev])
         playBeep(true)
      }
    }
    
    setLoadingCode(false)
  }

  const removeShipment = (id: string) => {
    setScannedShipments(prev => prev.filter(s => s.id !== id))
    inputRef.current?.focus()
  }

  // Simple Beep function
  const playBeep = (success: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      
      if (success) {
        oscillator.type = 'sine'
        oscillator.frequency.value = 800 // High pitch beep for success
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
        oscillator.start()
        oscillator.stop(audioCtx.currentTime + 0.1)
      } else {
        oscillator.type = 'sawtooth'
        oscillator.frequency.value = 300 // Low pitch buzz for error
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
        oscillator.start()
        oscillator.stop(audioCtx.currentTime + 0.3)
      }
    } catch (e) {
      // ignore audio errors
    }
  }

  // Bulk Save
  const handleSaveAll = async () => {
    if (scannedShipments.length === 0) return
    setSavingAll(true)
    setErrorMsg('')
    
    try {
      const ids = scannedShipments.map(s => s.id)
      
      // 1. Update all shipments status
      const { error: updateError } = await supabase
        .from('shipments')
        .update({ 
          status: targetStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', ids)

      if (updateError) throw updateError

      // 2. Insert into status history for all
      const historyPayload = scannedShipments.map(s => ({
        shipment_id: s.id,
        status: targetStatus,
        notes: `العمليات الجماعية (تم تغيير الحالة من ${getStatusLabel(s.status)} إلى ${getStatusLabel(targetStatus)})`
      }))
      await supabase.from('status_history').insert(historyPayload)

      // 3. Log Activity
      await supabase.from('activity_logs').insert([{
        action: 'تحديث جماعي',
        entity_type: 'bulk_shipments',
        entity_id: `Count: ${scannedShipments.length}`,
        details: `تم تحديث ${scannedShipments.length} شحنة إلى حالة: ${getStatusLabel(targetStatus)} بواسطة القارئ الآلي.`,
        user_name: 'Admin'
      }])

      // Success!
      setSuccessMsg(`تم بنجاح تحديث ${scannedShipments.length} شحنة إلى حالة: ${getStatusLabel(targetStatus)}`)
      setScannedShipments([])
      playBeep(true)
      setTimeout(() => playBeep(true), 150) // Double beep for mega success

    } catch (err: any) {
      setErrorMsg('حدث خطأ أثناء حفظ الشحنات: ' + err.message)
    }
    
    setSavingAll(false)
    inputRef.current?.focus()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" onClick={handleContainerClick}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
            <ScanLine size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">العمليات الجماعية</h1>
            <p className="text-sm text-slate-500 font-bold">تحديث الشحنات بسرعة عبر القارئ الآلي (الباركود)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Scanner Control Panel */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
            
            {/* Status Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">1. اختر الحالة الهدف</label>
              <select 
                value={targetStatus}
                onChange={e => {
                  setTargetStatus(e.target.value as ShipmentStatus)
                  setScannedShipments([]) // Clear list when changing target
                }}
                className="input-field w-full text-sm font-bold text-slate-800 bg-slate-50">
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">تنبيه: سيتم مسح القائمة الحالية عند تغيير الحالة.</p>
            </div>

            <hr className="border-slate-100" />

            {/* Barcode Input Form */}
            <form onSubmit={handleScan}>
              <label className="block text-sm font-bold text-slate-700 mb-2">2. امسح الباركود الآن</label>
              <div className="relative">
                <input 
                  ref={inputRef}
                  type="text" 
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  placeholder="جاهز للقراءة..."
                  dir="ltr"
                  className="w-full text-center font-mono text-xl py-4 bg-slate-100 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:bg-blue-50 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                  autoFocus
                />
                {loadingCode && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={20} className="animate-spin text-blue-500" />
                  </div>
                )}
              </div>
            </form>

            {/* Error / Success Messages */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-xs font-bold animate-fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 text-green-700 text-xs font-bold animate-fade-in">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <p>{successMsg}</p>
              </div>
            )}

            {/* Bulk Save Action */}
            <div className="pt-4 mt-2 border-t border-slate-100">
              <button 
                onClick={handleSaveAll}
                disabled={scannedShipments.length === 0 || savingAll}
                className="w-full btn-primary bg-blue-600 hover:bg-blue-700 border-none py-3 text-sm justify-center shadow-md disabled:opacity-50">
                {savingAll ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                تحديث {scannedShipments.length} شحنة
              </button>
            </div>

          </div>

          <div className="bg-slate-100 rounded-xl p-4 text-xs font-medium text-slate-500 leading-relaxed border border-slate-200">
            <p className="font-bold text-slate-700 mb-1">تعليمات:</p>
            1. تأكد من أن لغة الكيبورد إنجليزية (EN).<br/>
            2. ضع المؤشر في المربع الرمادي.<br/>
            3. اضرب الباركود باستخدام جهاز القارئ الآلي.<br/>
            4. ستضاف الشحنة للقائمة مع صوت نجاح.<br/>
            5. اضغط على "تحديث" عند الانتهاء.
          </div>
        </div>

        {/* Scanned List */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-slate-700 flex items-center gap-2">
                <Package size={18} className="text-slate-400" /> قائمة الشحنات الممسوحة
              </h2>
              <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">
                العدد الممسوح: {scannedShipments.length}
              </span>
            </div>
            
            <div className="p-0 flex-1 overflow-y-auto bg-slate-50/30">
              {scannedShipments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-10 opacity-40">
                  <ScanLine size={64} className="mb-4 text-slate-400" />
                  <p className="font-extrabold text-slate-500 text-lg">لم يتم مسح أي شحنة بعد</p>
                  <p className="text-sm font-medium mt-1">امسح أول باركود للبدء في القائمة</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {scannedShipments.map((s, index) => (
                    <li key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors animate-fade-in group">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-200">
                          {scannedShipments.length - index}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-800">#{s.code || s.id.slice(0,8)}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {(s as any).client?.name || 'عميل غير معروف'} — {s.recipient_name}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                         <div className="text-left">
                           <div className="font-bold text-green-700 text-sm">{formatCurrency(s.amount || 0)}</div>
                           <div className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1 border inline-block ${getStatusClass(s.status)}`}>
                             كانت: {getStatusLabel(s.status)}
                           </div>
                         </div>
                         <button 
                           onClick={() => removeShipment(s.id)}
                           className="w-8 h-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors">
                           <Trash2 size={16} />
                         </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
