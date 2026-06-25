'use client'

import { useState, useEffect } from 'react'
import { Warehouse as WarehouseIcon, Plus, Edit, Trash2, MapPin, Phone, Search, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Warehouse } from '@/types'
import { formatDate } from '@/lib/utils'

function AddWarehouseModal({ onClose, onAdd }: { onClose: () => void; onAdd: (w: Warehouse) => void }) {
  const [form, setForm] = useState({
    name: '', country: 'العراق', governorate: '', district: '', address: '', phone: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('warehouses').insert([{ ...form }]).select().single()
    if (data) onAdd(data as Warehouse)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Plus size={18} className="text-blue-600" /> إضافة مستودع جديد
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form id="addWarehouseForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">اسم المستودع <span className="text-red-500">*</span></label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} type="text" className="input-field" placeholder="مثال: مخزن البصرة الرئيسي" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الدولة</label>
                <input value={form.country} onChange={e => setForm({...form, country: e.target.value})} type="text" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">المحافظة</label>
                <input value={form.governorate} onChange={e => setForm({...form, governorate: e.target.value})} type="text" className="input-field" placeholder="مثال: البصرة" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">العنوان التفصيلي</label>
              <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} type="text" className="input-field" placeholder="المنطقة، الشارع، أقرب نقطة دالة" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">رقم الهاتف</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} type="text" className="input-field" placeholder="07XXXXXXXXX" dir="ltr" />
            </div>
          </form>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">إلغاء</button>
          <button type="submit" form="addWarehouseForm" disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'حفظ وإضافة'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const fetchWarehouses = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('warehouses').select('*').order('created_at', { ascending: false })
    if (data) setWarehouses(data as Warehouse[])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المستودع؟')) {
      await supabase.from('warehouses').delete().eq('id', id)
      setWarehouses(warehouses.filter(w => w.id !== id))
    }
  }

  const filteredWarehouses = warehouses.filter(w => 
    w.name.includes(searchTerm) || w.governorate?.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
            <WarehouseIcon size={24} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">إدارة المستودعات</h1>
            <p className="text-sm text-slate-500 font-bold">إضافة، تعديل ومتابعة المستودعات ومراكز التوزيع</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">
          <Plus size={18} /> إضافة مستودع
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="البحث باسم المستودع أو المحافظة..." 
            className="input-field pl-4 pr-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-orange-600" size={32} /></div>
      ) : filteredWarehouses.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <WarehouseIcon size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-700">لا توجد مستودعات</h3>
          <p className="text-sm text-slate-500 mt-1">قم بإضافة المستودع الأول للبدء في تنظيم شحناتك</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWarehouses.map((warehouse) => (
            <div key={warehouse.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <WarehouseIcon size={20} className="text-slate-600" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(warehouse.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-1">{warehouse.name}</h3>
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <span className="font-medium">{warehouse.governorate} {warehouse.district && `- ${warehouse.district}`} <br/><span className="text-xs text-slate-500">{warehouse.address}</span></span>
                </div>
                {warehouse.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={16} className="text-slate-400 shrink-0" />
                    <span className="font-medium font-mono" dir="ltr">{warehouse.phone}</span>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-400">
                <span>تاريخ الإضافة</span>
                <span>{formatDate(warehouse.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && <AddWarehouseModal onClose={() => setShowAddModal(false)} onAdd={(w) => setWarehouses([w, ...warehouses])} />}
    </div>
  )
}
