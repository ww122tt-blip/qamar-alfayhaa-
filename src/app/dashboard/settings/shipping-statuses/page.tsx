'use client'

import { useState } from 'react'
import { Layers, Plus, Trash2, Edit, Lock, Unlock, ArrowRight, X } from 'lucide-react'
import Link from 'next/link'

interface StatusItem {
  id: string
  name: string
  is_editable: boolean
  can_edit_shipment: boolean
}

const MOCK_STATUSES: StatusItem[] = [
  { id: '1', name: 'قيد التحميل والنقل', is_editable: false, can_edit_shipment: false },
  { id: '2', name: 'شحنات سلمت بنجاح', is_editable: false, can_edit_shipment: false },
  { id: '3', name: 'مندوب التوصيل', is_editable: false, can_edit_shipment: false },
  { id: '4', name: 'إعادة توصيل', is_editable: false, can_edit_shipment: false },
  { id: '5', name: 'في مكتب البصرة', is_editable: true, can_edit_shipment: true },
  { id: '6', name: 'تم الاستلام في مستودع الكويت', is_editable: false, can_edit_shipment: false },
  { id: '7', name: 'في الطريق الى العراق', is_editable: false, can_edit_shipment: false },
  { id: '8', name: 'وصلت الشحنة الى العراق', is_editable: false, can_edit_shipment: false },
]

function AddStatusModal({ onClose, onAdd }: { onClose: () => void; onAdd: (s: Partial<StatusItem>) => void }) {
  const [name, setName] = useState('')
  const [canEdit, setCanEdit] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({ name, can_edit_shipment: canEdit, is_editable: true })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="glass-card w-full max-w-lg animate-fade-in bg-white shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200">
              <Plus size={20} className="text-gold" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-800">إضافة حالة شحن</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg hover:bg-slate-200 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-700">اسم الحالة *</label>
            <input type="text" placeholder="مثال: قيد المراجعة" required
              value={name} onChange={e => setName(e.target.value)}
              className="input-field shadow-sm bg-white" />
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
            {canEdit ? <Unlock size={18} className="text-green-500" /> : <Lock size={18} className="text-amber-500" />}
            <span className="text-sm font-bold text-slate-700 flex-1">السماح بتعديل الشحنة عندما تكون في هذه الحالة</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={canEdit} onChange={e => setCanEdit(e.target.checked)} />
              <div className="w-11 h-6 rounded-full peer-checked:bg-green-500 bg-slate-300 after:absolute after:right-[2px] after:top-[2px] after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:after:-translate-x-full" />
            </label>
          </div>

          {!canEdit && (
            <p className="text-xs font-semibold text-slate-500 bg-slate-100 p-3 rounded-lg border border-slate-200">
              لا يمكن تعديل الشحنة عندما تكون في هذه الحالة.
            </p>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button type="submit" className="btn-primary flex-1 justify-center py-3 text-base shadow-md">
              إضافة
            </button>
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center py-3 text-base">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ShippingStatusesPage() {
  const [statuses, setStatuses] = useState(MOCK_STATUSES)
  const [showAddModal, setShowAddModal] = useState(false)

  const handleAdd = (s: Partial<StatusItem>) => {
    setStatuses(prev => [{ ...s, id: String(Date.now()) } as StatusItem, ...prev])
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings" className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-gold hover:border-amber-200 transition-colors">
            <ArrowRight size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200">
              <Layers size={20} className="text-gold" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800">حالات الشحن</h1>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary shadow-sm">
          <Plus size={18} /> إضافة حالة
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statuses.map(s => (
          <div key={s.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-1.5 flex-wrap">
                <button className="btn-action delete flex-1 justify-center" disabled={!s.is_editable} style={{ opacity: s.is_editable ? 1 : 0.5 }}>
                  <Trash2 size={14} /> <span>حذف</span>
                </button>
                <button className="btn-action edit flex-1 justify-center" disabled={!s.is_editable} style={{ opacity: s.is_editable ? 1 : 0.5 }}>
                  <Edit size={14} /> <span>تعديل</span>
                </button>
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 text-right w-full">{s.name}</h3>
            </div>
            
            <div className={`mt-auto text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-between border ${s.can_edit_shipment ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
              <span>{s.can_edit_shipment ? 'قابل للتعديل' : 'غير قابل للتعديل'}</span>
              {s.can_edit_shipment ? <Unlock size={14} /> : <Lock size={14} />}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <AddStatusModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}
    </div>
  )
}
