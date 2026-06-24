'use client'

import { useState, useEffect, useCallback } from 'react'
import { Layers, Plus, Search, Send, Trash2, Eye, Package, Loader2, X, DollarSign, CheckCircle, ChevronRight } from 'lucide-react'
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

  const handleAddShipment = async () => {
    if (!selectedShipmentId) return
    setAdding(true)
    const { error } = await supabase.from('shipments').update({ shelf_id: shelf.id }).eq('id', selectedShipmentId)
    if (!error) {
      const newCount = (shelf.shipments_count || 0) + 1
      await supabase.from('shelves').update({ shipments_count: newCount }).eq('id', shelf.id)
      onUpdate({ ...shelf, shipments_count: newCount })
      setSelectedShipmentId('')
      fetchData()
    }
    setAdding(false)
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
  }

  const totalAmount = shipments.reduce((s, sh) => s + (sh.amount || 0), 0)
  const totalFee = shipments.reduce((s, sh) => s + (sh.delivery_fee || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200"><Layers size={20} className="text-gold" /></div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">تفاصيل الشلف</h2>
              <span className="font-mono font-bold text-gold text-sm">{shelf.code}</span>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg hover:bg-slate-200 text-slate-500"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'عدد الشحنات', value: shipments.length.toString(), color: 'text-slate-800' },
              { label: 'قيمة البضائع', value: formatCurrency(totalAmount), color: 'text-green-600' },
              { label: 'كلف التوصيل', value: formatCurrency(totalFee), color: 'text-slate-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-bold mb-1">{stat.label}</p>
                <p className={`font-extrabold text-sm ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Add Shipment */}
          {shelf.status === 'created' && (
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <h3 className="text-sm font-extrabold text-blue-800 mb-3 flex items-center gap-2"><Plus size={14} /> إضافة شحنة للشلف</h3>
              <div className="flex gap-3">
                <select value={selectedShipmentId} onChange={e => setSelectedShipmentId(e.target.value)} className="input-field flex-1 bg-white shadow-sm">
                  <option value="">اختر شحنة (الشحنات الجديدة غير المعينة)...</option>
                  {availableShipments.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code || s.number} - {s.recipient_name} ({s.client?.name})
                    </option>
                  ))}
                </select>
                <button onClick={handleAddShipment} disabled={!selectedShipmentId || adding} className="btn-primary px-5 shadow-sm disabled:opacity-50">
                  {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} إضافة
                </button>
              </div>
              {availableShipments.length === 0 && (
                <p className="text-xs text-blue-600 mt-2 font-bold">لا توجد شحنات جديدة متاحة للإضافة</p>
              )}
            </div>
          )}

          {/* Shipments List */}
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={28} className="text-gold animate-spin" /></div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">لا توجد شحنات في هذا الشلف بعد</p>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2"><Package size={14} className="text-gold" /> الشحنات ({shipments.length})</h3>
              <div className="space-y-2">
                {shipments.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">#{s.code || s.number}</span>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{s.recipient_name}</p>
                        <p className="text-xs text-slate-500">{s.client?.name} • {s.governorate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-green-600">{formatCurrency(s.amount || 0)}</span>
                      {shelf.status === 'created' && (
                        <button onClick={() => handleRemoveShipment(s.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <X size={14} />
                        </button>
                      )}
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
