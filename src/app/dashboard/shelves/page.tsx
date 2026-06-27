'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Layers, Plus, Search, Send, Trash2, Eye, Package, Loader2, X, DollarSign, CheckCircle, ChevronRight, ScanLine, AlertCircle } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Shelf, Shipment } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  created: 'تم الإنشاء',
  sent: 'أُرسل للوسيط',
  received_by_waseet: 'استلمه الوسيط',
  completed: 'مكتمل',
}
const STATUS_CLASSES: Record<string, string> = {
  created: 'badge-new',
  sent: 'badge-transit',
  received_by_waseet: 'badge-pending',
  completed: 'badge-delivered',
}

// ====== CREATE SHELF MODAL ======
function CreateShelfModal({ onClose, onAdd }: { onClose: () => void; onAdd: (s: Shelf) => void }) {
  const [code, setCode] = useState(`SHF_${String(Date.now()).slice(-5)}`)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('shelves').insert([{ code: code.toUpperCase(), status: 'created' }]).select().single()
    if (data && !error) {
      await supabase.from('activity_logs').insert([{ action: 'إنشاء شلف', entity_type: 'shelf', entity_id: code.toUpperCase(), details: `تم إنشاء الشلف ${code.toUpperCase()}`, user_name: 'Admin' }])
      onAdd(data as Shelf)
      onClose()
    } else {
      alert('حدث خطأ: ' + (error?.message || 'رمز الشلف مستخدم مسبقاً'))
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="glass-card w-full max-w-md animate-fade-in shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200"><Layers size={20} className="text-gold" /></div>
            <h2 className="text-lg font-extrabold text-slate-800">إنشاء شلف جديد</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg hover:bg-slate-200 text-slate-500"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-700">رمز الشلف *</label>
            <input type="text" required value={code} onChange={e => setCode(e.target.value.toUpperCase())} disabled={loading} className="input-field bg-white shadow-sm font-mono text-center text-lg font-bold tracking-widest" placeholder="SHF_001" dir="ltr" />
            <p className="text-xs text-slate-400 mt-1 font-medium">يجب أن يكون الرمز فريداً</p>
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3 shadow-md">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} إنشاء الشلف
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="btn-ghost flex-1 justify-center py-3">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ====== SHELF DETAIL MODAL (View + Add Shipments) ======
function ShelfDetailModal({ shelf, onClose, onUpdate }: { shelf: Shelf; onClose: () => void; onUpdate: (s: Shelf) => void }) {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [availableShipments, setAvailableShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedShipmentId, setSelectedShipmentId] = useState('')
  
  // Scanner States
  const [barcodeInput, setBarcodeInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [scanning, setScanning] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [shelfShipments, freeShipments] = await Promise.all([
      supabase.from('shipments').select('*, client:clients(*)').eq('shelf_id', shelf.id),
      supabase.from('shipments').select('*, client:clients(*)').is('shelf_id', null).eq('status', 'new'),
    ])
    if (shelfShipments.data) setShipments(shelfShipments.data as unknown as Shipment[])
    if (freeShipments.data) setAvailableShipments(freeShipments.data as unknown as Shipment[])
    setLoading(false)
  }, [shelf.id])

  useEffect(() => { fetchData() }, [fetchData])

  // Keep focus on input automatically
  useEffect(() => {
    if (shelf.status === 'created') {
      inputRef.current?.focus()
    }
  }, [shipments, shelf.status])

  const handleContainerClick = (e: React.MouseEvent) => {
    if (shelf.status === 'created' && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'SELECT' && (e.target as HTMLElement).tagName !== 'INPUT') {
      inputRef.current?.focus()
    }
  }

  const playBeep = (success: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      if (success) {
        oscillator.type = 'sine'
        oscillator.frequency.value = 800
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
        oscillator.start()
        oscillator.stop(audioCtx.currentTime + 0.1)
      } else {
        oscillator.type = 'sawtooth'
        oscillator.frequency.value = 300
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
        oscillator.start()
        oscillator.stop(audioCtx.currentTime + 0.3)
      }
    } catch (e) {}
  }

  const handleAddShipmentId = async (shipmentId: string) => {
    setAdding(true)
    const { error } = await supabase.from('shipments').update({ shelf_id: shelf.id }).eq('id', shipmentId)
    if (!error) {
      const newCount = (shelf.shipments_count || 0) + 1
      await supabase.from('shelves').update({ shipments_count: newCount }).eq('id', shelf.id)
      onUpdate({ ...shelf, shipments_count: newCount })
      setSelectedShipmentId('')
      await fetchData()
    }
    setAdding(false)
  }

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = barcodeInput.trim()
    if (!code) return

    setBarcodeInput('')
    setErrorMsg('')
    setSuccessMsg('')
    setScanning(true)

    // Check if already in this shelf
    if (shipments.some(s => s.code === code || s.tracking_number === code || s.id.startsWith(code))) {
      setErrorMsg(`الشحنة ${code} موجودة مسبقاً في هذا الشليف!`)
      playBeep(false)
      setScanning(false)
      return
    }

    // Fetch shipment
    const { data, error } = await supabase
      .from('shipments')
      .select('*, client:clients(name)')
      .or(`code.eq.${code},tracking_number.eq.${code},id.eq.${code}`)
      .single()

    if (error || !data) {
      setErrorMsg(`لم يتم العثور على شحنة بالرقم: ${code}`)
      playBeep(false)
    } else {
      if (data.shelf_id) {
        setErrorMsg(`الشحنة ${code} مضافة مسبقاً لشليف آخر!`)
        playBeep(false)
      } else if (data.status !== 'new') {
         setErrorMsg(`الشحنة ${code} حالتها الحالية تمنع إضافتها للشليف!`)
         playBeep(false)
      } else {
        // Valid, add it
        await handleAddShipmentId(data.id)
        setSuccessMsg(`تمت إضافة الشحنة ${code} بنجاح`)
        playBeep(true)
      }
    }
    setScanning(false)
    inputRef.current?.focus()
  }

  const handleRemoveShipment = async (shipmentId: string) => {
    if (!confirm('إزالة هذه الشحنة من الشلف؟')) return
    const { error } = await supabase.from('shipments').update({ shelf_id: null }).eq('id', shipmentId)
    if (!error) {
      const newCount = Math.max(0, (shelf.shipments_count || 0) - 1)
      await supabase.from('shelves').update({ shipments_count: newCount }).eq('id', shelf.id)
      onUpdate({ ...shelf, shipments_count: newCount })
      fetchData()
    }
    inputRef.current?.focus()
  }

  const printBarcode = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${shelf.code}&code=Code128&translate-esc=on`
    printWindow.document.write(`
      <html>
        <head>
          <title>طباعة شليف ${shelf.code}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 20px; }
            .label-container { width: 400px; margin: 0 auto; border: 2px solid #000; padding: 20px; border-radius: 10px; }
            img { max-width: 100%; height: 120px; margin-bottom: 15px; }
            h1 { font-size: 24px; margin: 0 0 10px 0; }
            p { font-size: 18px; margin: 5px 0; font-weight: bold; }
            .date { font-size: 14px; font-weight: normal; margin-top: 20px; color: #555; }
            @media print {
              body { margin: 0; padding: 0; }
              .label-container { border: none; width: 100%; height: 100%; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="label-container">
            <h1>شليف / تجميعة شحنات</h1>
            <img src="${barcodeUrl}" alt="Barcode" />
            <p>رمز الشليف: ${shelf.code}</p>
            <p>عدد الشحنات: ${shelf.shipments_count || shipments.length}</p>
            <div class="date">تاريخ الإنشاء: ${new Date(shelf.created_at).toLocaleString('ar-IQ')}</div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const totalAmount = shipments.reduce((s, sh) => s + (sh.amount || 0), 0)
  const totalFee = shipments.reduce((s, sh) => s + (sh.delivery_fee || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={handleContainerClick}>
      <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl bg-slate-50">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-200 shadow-sm">
              <Layers size={24} className="text-gold" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                تفاصيل الشليف 
                <span className="font-mono font-bold bg-gold/10 text-gold px-2 py-0.5 rounded text-sm">{shelf.code}</span>
              </h2>
              <p className="text-xs font-semibold text-slate-500">{STATUS_LABELS[shelf.status]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={printBarcode} className="btn-ghost text-slate-600 hover:text-slate-900 border border-slate-200 bg-white">
              <span className="flex items-center gap-2">🖨️ طباعة الباركود</span>
            </button>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'عدد الشحنات', value: shipments.length.toString(), color: 'text-slate-800', bg: 'bg-white' },
              { label: 'إجمالي قيمة البضائع', value: formatCurrency(totalAmount), color: 'text-green-600', bg: 'bg-green-50/50' },
              { label: 'إجمالي كلف التوصيل', value: formatCurrency(totalFee), color: 'text-blue-600', bg: 'bg-blue-50/50' },
            ].map(stat => (
              <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col justify-center`}>
                <p className="text-xs text-slate-500 font-bold mb-1">{stat.label}</p>
                <p className={`font-extrabold text-xl ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Scanner & Manual Add Area */}
          {shelf.status === 'created' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              
              {/* Scanner */}
              <div className="space-y-3">
                <label className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center"><ScanLine size={14} /></span>
                  الإضافة السريعة بالباركود
                </label>
                <form onSubmit={handleScan} className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)}
                    disabled={scanning}
                    autoFocus
                    placeholder="امسح باركود الشحنة للدمج..."
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-mono text-left dir-ltr shadow-inner"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    {scanning ? <Loader2 size={20} className="text-blue-500 animate-spin" /> : <ScanLine size={20} className="text-slate-400" />}
                  </div>
                  <button type="submit" className="hidden">Scan</button>
                </form>
                {/* Scanner Messages */}
                {errorMsg && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100 animate-fade-in font-bold">
                    <AlertCircle size={16} className="shrink-0" /> <p>{errorMsg}</p>
                  </div>
                )}
                {successMsg && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-100 animate-fade-in font-bold">
                    <CheckCircle size={16} className="shrink-0" /> <p>{successMsg}</p>
                  </div>
                )}
              </div>

              {/* Manual Selection */}
              <div className="space-y-3">
                <label className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center"><Plus size={14} /></span>
                  الإضافة اليدوية (من القائمة)
                </label>
                <div className="flex gap-2 h-[52px]">
                  <select 
                    value={selectedShipmentId} 
                    onChange={e => setSelectedShipmentId(e.target.value)} 
                    className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 outline-none focus:border-gold focus:ring-4 focus:ring-gold/20 transition-all font-bold text-sm text-slate-700"
                  >
                    <option value="">اختر شحنة لدمجها...</option>
                    {availableShipments.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.tracking_number || s.code} - {s.recipient_name || 'بدون اسم'}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={() => handleAddShipmentId(selectedShipmentId)} 
                    disabled={!selectedShipmentId || adding} 
                    className="w-14 bg-gold hover:bg-yellow-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-gold/20 transition-colors disabled:opacity-50"
                  >
                    {adding ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 font-bold px-1">
                  الشحنات المتاحة للإضافة اليدوية: {availableShipments.length}
                </p>
              </div>

            </div>
          )}

          {/* Shipments List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-4">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Package size={16} className="text-gold" /> قائمة الشحنات المدمجة ({shipments.length})
              </h3>
            </div>
            
            <div className="p-4">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 size={32} className="text-gold animate-spin" /></div>
              ) : shipments.length === 0 ? (
                <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4 border-2 border-dashed border-slate-200">
                    <Package size={32} className="opacity-50" />
                  </div>
                  <p className="font-extrabold text-slate-600 text-lg">الشليف فارغ حالياً</p>
                  <p className="text-sm font-medium mt-1">امسح باركود الشحنات لإضافتها هنا</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {shipments.map((s, index) => (
                    <div key={s.id} className="group flex items-center justify-between bg-white rounded-xl p-3 border border-slate-100 shadow-sm hover:shadow-md hover:border-gold/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 font-bold text-xs flex items-center justify-center border border-slate-100">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{s.tracking_number || s.code}</p>
                          <p className="text-xs text-slate-500 font-medium truncate max-w-[120px]">{s.recipient_name || 'بدون اسم'} • {s.client?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-green-600 bg-green-50 px-2 py-1 rounded-md">{formatCurrency(s.amount || 0)}</span>
                        {shelf.status === 'created' && (
                          <button 
                            onClick={() => handleRemoveShipment(s.id)} 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-50 group-hover:opacity-100"
                            title="إزالة الشحنة من الشليف"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ====== MAIN PAGE ======
export default function ShelvesPage() {
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewingShelf, setViewingShelf] = useState<Shelf | null>(null)

  const fetchShelves = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('shelves').select('*').order('created_at', { ascending: false })
    if (data) setShelves(data as Shelf[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchShelves() }, [fetchShelves])

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`هل أنت متأكد من حذف الشلف ${code}؟ سيتم تحرير جميع الشحنات الموجودة فيه.`)) return
    // First unlink all shipments from this shelf
    await supabase.from('shipments').update({ shelf_id: null }).eq('shelf_id', id)
    const { error } = await supabase.from('shelves').delete().eq('id', id)
    if (!error) {
      setShelves(p => p.filter(s => s.id !== id))
      await supabase.from('activity_logs').insert([{ action: 'حذف شلف', entity_type: 'shelf', entity_id: code, details: `تم حذف الشلف ${code}`, user_name: 'Admin' }])
    }
  }

  const filtered = shelves.filter(s => !search || s.code.includes(search.toUpperCase()))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="page-header">
        <div className="page-title">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200"><Layers size={20} className="text-gold" /></div>
          <span>التجميعات (الباللات)</span>
          <span className="text-sm font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md mr-2">{shelves.length} شلف</span>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary shadow-sm">
          <Plus size={18} /> إنشاء شلف جديد
        </button>
      </div>

      <div className="relative w-72">
        <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="بحث برمز التجميعة..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-11 shadow-sm" />
      </div>

      <div className="glass-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>رمز التجميعة</th>
                <th>الشحنات</th>
                <th>قيمة الشحنات</th>
                <th>كلفة التوصيل</th>
                <th>الحالة</th>
                <th>تتبع التوصيل</th>
                <th>تاريخ الإنشاء</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="py-12 text-center"><Loader2 size={32} className="mx-auto text-gold animate-spin" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16 text-slate-400">
                  <Layers size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="font-semibold text-lg text-slate-500">لا توجد باللات بعد</p>
                  <p className="text-sm">اضغط "إنشاء شلف جديد" لإضافة أول شلف</p>
                </td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id} className="cursor-pointer hover:bg-slate-50/50" onClick={() => setViewingShelf(s)}>
                  <td className="text-slate-400 font-bold">{i + 1}</td>
                  <td>
                    <span className="font-mono font-bold text-sm bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">{s.code}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <Package size={16} className="text-slate-400" />
                      <span>{s.shipments_count || 0} شحنة</span>
                    </div>
                  </td>
                  <td className="font-bold text-green-600">{formatCurrency((s.shipments_count || 0) * 8000)}</td>
                  <td className="font-bold text-slate-600">{formatCurrency((s.shipments_count || 0) * 5000)}</td>
                  <td>
                    <span className={`badge shadow-sm ${STATUS_CLASSES[s.status] || 'badge-new'}`}>
                      <span className="w-2 h-2 rounded-full bg-current opacity-75" />
                      {STATUS_LABELS[s.status] || s.status}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    {s.waseet_batch_id ? (
                      <span className="badge badge-transit text-xs shadow-sm block w-fit">الوسيط: {s.waseet_batch_id}</span>
                    ) : (
                      <button className="btn-primary py-1.5 px-3 text-xs shadow-sm bg-blue-600 hover:bg-blue-700">
                        <Send size={12} /> إرسال للوسيط
                      </button>
                    )}
                  </td>
                  <td className="text-slate-500 text-xs font-medium">{formatDate(s.created_at)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 flex-wrap w-[150px]">
                      <button className="btn-action view" title="عرض" onClick={() => setViewingShelf(s)}>
                        <Eye size={14} /> <span>عرض</span>
                      </button>
                      <button className="btn-action delete" title="حذف" onClick={() => handleDelete(s.id, s.code)}>
                        <Trash2 size={14} /> <span>حذف</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && <CreateShelfModal onClose={() => setShowCreateModal(false)} onAdd={s => { setShelves(p => [s, ...p]); setShowCreateModal(false) }} />}
      {viewingShelf && <ShelfDetailModal shelf={viewingShelf} onClose={() => setViewingShelf(null)} onUpdate={updated => setShelves(p => p.map(s => s.id === updated.id ? updated : s))} />}
    </div>
  )
}
