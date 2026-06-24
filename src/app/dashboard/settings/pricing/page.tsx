'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit, ArrowRight, CreditCard, X } from 'lucide-react'
import Link from 'next/link'

interface PricingType {
  id: string
  name: string
}

const MOCK_PRICING: PricingType[] = [
  { id: '1', name: 'per_order' },
  { id: '2', name: 'per_kg' },
]

function AddPricingModal({ onClose, onAdd }: { onClose: () => void; onAdd: (s: Partial<PricingType>) => void }) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({ name })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="glass-card w-full max-w-sm animate-fade-in bg-white shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200">
              <Plus size={20} className="text-gold" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-800">إضافة نوع تسعير</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg hover:bg-slate-200 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-700">النوع *</label>
            <input type="text" placeholder="مثال: per_item" required
              value={name} onChange={e => setName(e.target.value)}
              className="input-field shadow-sm bg-white font-mono" />
          </div>

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

export default function PricingTypesPage() {
  const [types, setTypes] = useState(MOCK_PRICING)
  const [showAddModal, setShowAddModal] = useState(false)

  const handleAdd = (s: Partial<PricingType>) => {
    setTypes(prev => [{ ...s, id: String(Date.now()) } as PricingType, ...prev])
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings" className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-gold hover:border-amber-200 transition-colors">
            <ArrowRight size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200">
              <CreditCard size={20} className="text-gold" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800">أنواع التسعير</h1>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary shadow-sm">
          <Plus size={18} /> إضافة نوع
        </button>
      </div>

      {/* List */}
      <div className="flex flex-wrap gap-4 items-center justify-end">
        {types.map(t => (
          <div key={t.id} className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-6 min-w-[200px]">
            <div className="flex gap-1.5 flex-wrap">
              <button className="btn-action delete"
                onClick={() => setTypes(p => p.filter(x => x.id !== t.id))}>
                <Trash2 size={14} /> <span>حذف</span>
              </button>
              <button className="btn-action edit">
                <Edit size={14} /> <span>تعديل</span>
              </button>
            </div>
            <span className="font-mono font-bold text-sm text-slate-700 ml-auto">{t.name}</span>
          </div>
        ))}
      </div>

      {showAddModal && (
        <AddPricingModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}
    </div>
  )
}
