'use client'

import { useState, useEffect } from 'react'
import { Warehouse as WarehouseIcon, Plus, Edit, Trash2, MapPin, Phone, Search, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Warehouse } from '@/types'
import { formatDate } from '@/lib/utils'

function AddWarehouseModal({ onClose, onAdd }: { onClose: () => void; onAdd: (w: Warehouse) => void }) {
  const [form, setForm] = useState({
    name: '', country: 'العراق', notes: ''
  })
  const [features, setFeatures] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('warehouses').insert([{ ...form, features }]).select().single()
    if (data) onAdd(data as Warehouse)
    setLoading(false)
    onClose()
  }

  const addFeature = () => setFeatures([...features, ''])
  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features]
    newFeatures[index] = value
    setFeatures(newFeatures)
  }
  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">البلد</label>
                <input required value={form.country} onChange={e => setForm({...form, country: e.target.value})} type="text" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">اسم المستودع <span className="text-red-500">*</span></label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} type="text" className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">الوصف</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input-field resize-none h-20" placeholder="وصف المستودع (اختياري)" />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <button type="button" onClick={addFeature} className="text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                  <Plus size={14} /> إضافة خاصية
                </button>
                <h3 className="font-bold text-slate-800">الخصائص</h3>
              </div>
              
              {features.length === 0 ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center text-sm font-bold text-slate-500">
                  لا توجد خصائص. اضغط على "إضافة خاصية" لإضافة خصائص جديدة
                </div>
              ) : (
                <div className="space-y-2">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={feature} 
                        onChange={(e) => updateFeature(idx, e.target.value)} 
                        className="input-field flex-1" 
                        placeholder="مثال: رقم الهاتف: 559862261" 
                        required
                      />
                      <button type="button" onClick={() => removeFeature(idx)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Grid -> Table */}
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-orange-600" size={32} /></div>
      ) : filteredWarehouses.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <WarehouseIcon size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-700">لا توجد مستودعات</h3>
          <p className="text-sm text-slate-500 mt-1">قم بإضافة المستودع الأول للبدء في تنظيم شحناتك</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <tr>
                  <th className="p-4 font-bold text-center w-12">#</th>
                  <th className="p-4 font-bold">اسم المستودع</th>
                  <th className="p-4 font-bold">البلد</th>
                  <th className="p-4 font-bold">الخصائص</th>
                  <th className="p-4 font-bold">تاريخ الإنشاء</th>
                  <th className="p-4 font-bold text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWarehouses.map((warehouse, index) => (
                  <tr key={warehouse.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 text-center text-slate-500 font-mono text-sm">{index + 1}</td>
                    <td className="p-4">
                      <div className="font-extrabold text-slate-800">{warehouse.name}</div>
                      {warehouse.notes && <div className="text-xs text-slate-500 mt-1 max-w-[200px] leading-tight">{warehouse.notes}</div>}
                    </td>
                    <td className="p-4">
                      {warehouse.country && (
                        <span className="inline-flex items-center px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded">
                          {warehouse.country}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {warehouse.features && warehouse.features.length > 0 ? (
                        <div className="flex flex-col gap-1 text-xs">
                          {warehouse.features.slice(0, 3).map((feat, i) => (
                            <div key={i} className="font-bold text-slate-700">{feat}</div>
                          ))}
                          {warehouse.features.length > 3 && (
                            <div className="inline-flex items-center px-2 py-1 bg-teal-50 text-teal-700 text-[10px] font-bold rounded w-max mt-1">
                              +{warehouse.features.length - 3} أخرى
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">لا توجد خصائص</span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-mono text-slate-600">
                      {formatDate(warehouse.created_at)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100 bg-white shadow-sm"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(warehouse.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100 bg-white shadow-sm"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && <AddWarehouseModal onClose={() => setShowAddModal(false)} onAdd={(w) => fetchWarehouses()} />}
    </div>
  )
}
