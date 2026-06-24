'use client'

import { useState, useEffect } from 'react'
import { Warehouse, Plus, Search, Edit, Trash2, Eye, Globe, Phone, MapPin, X, AlignLeft, Info, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Warehouse as WarehouseType } from '@/types'

// ====== ADD WAREHOUSE MODAL ======
function AddWarehouseModal({ onClose, onAdd }: { onClose: () => void; onAdd: (w: WarehouseType) => void }) {
  const [form, setForm] = useState({
    name: '', country: '', governorate: '', address: '', phone: '',
  })
  const [features, setFeatures] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const newWarehouseData = {
      name: form.name,
      country: form.country,
      governorate: form.governorate || null,
      address: form.address || null,
      phone: form.phone || null,
      features: features.filter(f => f.trim() !== ''),
    }

    const { data, error } = await supabase.from('warehouses').insert([newWarehouseData]).select().single()
    
    if (data && !error) {
      onAdd(data as unknown as WarehouseType)
      onClose()
    } else {
      console.error('Failed to add warehouse:', error)
      alert('حدث خطأ أثناء الإضافة')
    }
    setLoading(false)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="glass-card w-full max-w-2xl animate-fade-in shadow-2xl bg-[#1e1e1e] border border-red-900/30 overflow-hidden rounded-2xl">
        
        {/* Header (Red matching screenshot) */}
        <div className="flex items-center justify-between p-5 bg-[#c81e1e] text-white">
          <button onClick={onClose} disabled={loading} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
          <h2 className="text-lg font-extrabold">إضافة مستودع جديد</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-[#252525]">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Globe size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="البلد" required
                value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                disabled={loading} className="input-field bg-[#2e2e2e] border-none text-white placeholder-slate-400 pr-11 shadow-inner h-12" />
            </div>
            <div className="relative">
              <Warehouse size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="اسم المستودع" required
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                disabled={loading} className="input-field bg-[#2e2e2e] border-none text-white placeholder-slate-400 pr-11 shadow-inner h-12" />
            </div>
          </div>

          <div className="relative">
            <MapPin size={18} className="absolute right-4 top-4 text-slate-400" />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="المحافظة / المقاطعة (اختياري)"
                value={form.governorate} onChange={e => setForm(p => ({ ...p, governorate: e.target.value }))}
                disabled={loading} className="input-field bg-[#2e2e2e] border-none text-white placeholder-slate-400 pr-11 shadow-inner h-12" />
              <input type="text" placeholder="العنوان الدقيق (اختياري)"
                value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                disabled={loading} className="input-field bg-[#2e2e2e] border-none text-white placeholder-slate-400 px-4 shadow-inner h-12" />
            </div>
          </div>

          <div className="relative">
            <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="tel" placeholder="رقم الهاتف (اختياري)"
              value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              disabled={loading} className="input-field bg-[#2e2e2e] border-none text-white placeholder-slate-400 pr-11 shadow-inner h-12" />
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-white">الخصائص</h3>
              <button type="button" onClick={addFeature} disabled={loading} className="text-xs font-bold text-[#c81e1e] bg-[#c81e1e]/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-[#c81e1e]/20 transition-colors">
                <Plus size={14} /> إضافة خاصية
              </button>
            </div>

            {features.length === 0 ? (
              <div className="bg-[#173a41] border border-[#215a63] text-[#4fd1c5] p-4 rounded-xl flex items-center gap-3 text-sm font-semibold">
                <Info size={18} className="flex-shrink-0" />
                <span>لا توجد خصائص. اضغط على "إضافة خاصية" لإضافة خصائص جديدة.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="text" placeholder="اكتب الخاصية هنا..."
                      value={f} onChange={e => updateFeature(i, e.target.value)}
                      disabled={loading} className="input-field bg-[#2e2e2e] border-none text-white placeholder-slate-500 shadow-inner h-11 flex-1" />
                    <button type="button" onClick={() => removeFeature(i)} disabled={loading} className="p-2.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-6 flex-row-reverse">
            <button type="submit" disabled={loading} className="bg-[#c81e1e] hover:bg-[#a01818] text-white px-8 py-2.5 rounded-xl font-bold shadow-md transition-colors flex items-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />} حفظ
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="bg-[#3e3e3e] hover:bg-[#4a4a4a] text-white px-6 py-2.5 rounded-xl font-bold transition-colors">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    async function fetchWarehouses() {
      const { data, error } = await supabase.from('warehouses').select('*').order('created_at', { ascending: false })
      if (data) setWarehouses(data as unknown as WarehouseType[])
      if (error) console.error('Error fetching warehouses:', error)
      setLoading(false)
    }
    fetchWarehouses()
  }, [])

  const handleDelete = async (id: string) => {
    if(!confirm('هل أنت متأكد من حذف هذا المستودع؟')) return
    const { error } = await supabase.from('warehouses').delete().eq('id', id)
    if(!error) {
      setWarehouses(p => p.filter(w => w.id !== id))
    }
  }

  const filtered = warehouses.filter(w =>
    (!search || w.name.includes(search)) &&
    (countryFilter === 'all' || w.country === countryFilter)
  )

  const countries = Array.from(new Set(warehouses.map(w => w.country)))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="page-header">
        <div className="page-title">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200">
            <Warehouse size={20} className="text-[#c81e1e]" />
          </div>
          <span className="text-slate-800 dark:text-white">المستودعات الجديدة</span>
          <span className="badge badge-transit shadow-sm text-xs mr-2">{filtered.length} مستودع</span>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary shadow-sm !bg-[#c81e1e] hover:!bg-[#a01818] border-none">
          <Plus size={18} /> إضافة مستودع
        </button>
      </div>

      <div className="flex gap-4 flex-row-reverse sm:flex-row">
        <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}
          className="input-field w-40 shadow-sm font-semibold text-slate-700 dark:text-slate-200 dark:bg-[#1a1a1a] dark:border-slate-800">
          <option value="all">كل البلدان</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="relative flex-1 max-w-sm ml-auto sm:ml-0">
          <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="بحث في المستودعات بالاسم..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pr-11 shadow-sm dark:bg-[#1a1a1a] dark:border-slate-800 dark:text-white" />
        </div>
      </div>

      <div className="glass-card overflow-hidden shadow-sm dark:bg-[#1a1a1a]/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>اسم المستودع</th>
                <th>البلد</th>
                <th>الخصائص والعنوان</th>
                <th>تاريخ الإنشاء</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20">
                  <Loader2 size={32} className="mx-auto text-[#c81e1e] animate-spin" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-400">
                  <Warehouse size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                  <p className="font-semibold text-lg text-slate-500">لا يوجد مستودعات</p>
                </td></tr>
              ) : filtered.map((w, i) => (
                <tr key={w.id}>
                  <td className="text-slate-400 font-bold">{i + 1}</td>
                  <td>
                    <div className="font-extrabold text-slate-800 dark:text-white text-sm">{w.name}</div>
                  </td>
                  <td>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-sm">
                      {w.country}
                    </span>
                  </td>
                  <td>
                    <div className="space-y-1.5 text-xs font-medium" style={{ maxWidth: '320px' }}>
                      {w.phone && (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Phone size={12} className="text-slate-400 dark:text-slate-500" />
                          رقم الهاتف: <span className="font-bold text-slate-800 dark:text-slate-200">{w.phone}</span>
                        </div>
                      )}
                      {w.governorate && (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <MapPin size={12} className="text-slate-400 dark:text-slate-500" />
                          محافظة: <span className="font-bold text-slate-800 dark:text-slate-200">{w.governorate}</span>
                        </div>
                      )}
                      {w.address && (
                        <div className="text-slate-600 dark:text-slate-400">
                          العنوان: <span className="font-bold text-slate-800 dark:text-slate-200">{w.address}</span>
                        </div>
                      )}
                      
                      {/* Features */}
                      {w.features && w.features.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {w.features.slice(0, 2).map((f, fi) => (
                            <div key={fi} className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400">
                              <span className="text-gold mt-0.5">•</span><span>{f}</span>
                            </div>
                          ))}
                          {w.features.length > 2 && (
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 px-2 py-0.5 rounded-md cursor-pointer shadow-sm mt-1 inline-block">
                              +{w.features.length - 2} خصائص إضافية
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="text-slate-500 dark:text-slate-400 text-xs font-medium">{formatDate(w.created_at)}</td>
                  <td>
                    <div className="flex items-center gap-1.5 flex-wrap w-[200px]">
                      <button className="btn-action edit dark:bg-slate-800 dark:text-blue-400 dark:border-blue-900/30 dark:hover:bg-blue-900/20" title="تعديل">
                        <Edit size={14} />
                      </button>
                      <button className="btn-action view dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700" title="عرض">
                        <Eye size={14} />
                      </button>
                      <button className="btn-action delete dark:bg-slate-800 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/20" title="حذف" onClick={() => handleDelete(w.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddWarehouseModal
          onClose={() => setShowAddModal(false)}
          onAdd={w => setWarehouses(p => [w, ...p])}
        />
      )}
    </div>
  )
}
