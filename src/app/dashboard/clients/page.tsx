'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Search, Edit, Trash2, MapPin, Store, FileText, DollarSign, X, Loader2, RefreshCcw, Lock, Tag, Home, Phone, Settings, FileSearch, Link } from 'lucide-react'
import { formatCurrency, formatDate, generateClientCode, IRAQI_GOVERNORATES } from '@/lib/utils'
import type { Client, PricingType, Warehouse, ClientPrice, ClientPricingRule } from '@/types'
import { supabase } from '@/lib/supabase'

// ====== 1. ADD CLIENT MODAL ======
function AddClientModal({ onClose, onAdd, warehouses }: { onClose: () => void; onAdd: (c: Client) => void; warehouses: Warehouse[] }) {
  const [form, setForm] = useState({
    name: '', phone1: '', password: '', phone2: '',
    shipping_tag: '', pricing_type: 'per_order' as PricingType,
    warehouse_id: '', governorate: '', district: '',
    delivery_price: '5000', address: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const newClientData = {
      code: generateClientCode(),
      name: form.name,
      phones: [form.phone1, form.phone2].filter(Boolean),
      password: form.password,
      shipping_tag: form.shipping_tag,
      pricing_type: form.pricing_type,
      warehouse_id: form.warehouse_id || null,
      governorate: form.governorate || 'بغداد',
      district: form.district || null,
      delivery_price: parseFloat(form.delivery_price) || 0,
      address: form.address || null,
      is_active: true,
    }

    const { data, error } = await supabase.from('clients').insert([newClientData]).select().single()
    
    if (data && !error) {
      onAdd(data as unknown as Client)
      onClose()
    } else {
      console.error('Failed to add client:', error)
      alert(error?.message || 'حدث خطأ أثناء إضافة العميل. يرجى التأكد من فرادة العلامة الشحنية.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-black/40">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 bg-red-600 text-white">
          <button onClick={onClose} disabled={loading} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold">إضافة عميل جديد</h2>
            <Users size={20} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Right Column */}
            <div className="space-y-5">
              <div>
                <div className="relative">
                  <Users size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="الاسم *" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    disabled={loading} className="input-field bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 pr-11 h-12 w-full text-right focus:ring-2 focus:ring-red-500 focus:border-transparent rounded-lg" />
                </div>
              </div>
              <div>
                <div className="relative">
                  <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="كلمة المرور *" required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    disabled={loading} className="input-field bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 pr-11 h-12 w-full text-right focus:ring-2 focus:ring-red-500 focus:border-transparent rounded-lg" />
                </div>
              </div>
              <div>
                <div className="relative">
                  <Tag size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="العلامة الشحنية * (يجب أن تكون فريدة)" required value={form.shipping_tag} onChange={e => setForm(p => ({ ...p, shipping_tag: e.target.value }))}
                    disabled={loading} className="input-field bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 pr-11 h-12 w-full text-right focus:ring-2 focus:ring-red-500 focus:border-transparent rounded-lg" />
                </div>
              </div>
              <div>
                <div className="relative">
                  <Store size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={form.warehouse_id} onChange={e => setForm(p => ({ ...p, warehouse_id: e.target.value }))}
                    disabled={loading} className="input-field bg-slate-50 border border-slate-200 text-slate-700 pr-11 h-12 w-full text-right focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none rounded-lg">
                    <option value="">المستودع (اختياري)</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div className="relative">
                  <MapPin size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="المنطقة (اختياري)" value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))}
                    disabled={loading} className="input-field bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 pr-11 h-12 w-full text-right focus:ring-2 focus:ring-red-500 focus:border-transparent rounded-lg" />
                </div>
              </div>
            </div>

            {/* Left Column */}
            <div className="space-y-5">
              <div>
                <div className="relative">
                  <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="tel" placeholder="الهاتف الرئيسي *" required value={form.phone1} onChange={e => setForm(p => ({ ...p, phone1: e.target.value }))}
                    disabled={loading} className="input-field bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 pr-11 h-12 w-full text-right focus:ring-2 focus:ring-red-500 focus:border-transparent rounded-lg" />
                </div>
              </div>
              <div>
                <div className="relative">
                  <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="tel" placeholder="الهاتف الثانوي (اختياري)" value={form.phone2} onChange={e => setForm(p => ({ ...p, phone2: e.target.value }))}
                    disabled={loading} className="input-field bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 pr-11 h-12 w-full text-right focus:ring-2 focus:ring-red-500 focus:border-transparent rounded-lg" />
                </div>
              </div>
              <div>
                <div className="relative">
                  <DollarSign size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={form.pricing_type} onChange={e => setForm(p => ({ ...p, pricing_type: e.target.value as PricingType }))}
                    disabled={loading} className="input-field bg-slate-50 border border-slate-200 text-slate-700 pr-11 h-12 w-full text-right focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none rounded-lg">
                    <option value="per_order">لكل طلب (per_order)</option>
                    <option value="per_kg">لكل كيلو (per_kg)</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="relative">
                  <Store size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={form.governorate} onChange={e => setForm(p => ({ ...p, governorate: e.target.value }))}
                    disabled={loading} className="input-field bg-slate-50 border border-slate-200 text-slate-700 pr-11 h-12 w-full text-right focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none rounded-lg">
                    <option value="">المدينة (اختياري)</option>
                    {IRAQI_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div className="relative">
                  <DollarSign size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" placeholder="سعر التوصيل المحلي (اختياري)" value={form.delivery_price} onChange={e => setForm(p => ({ ...p, delivery_price: e.target.value }))}
                    disabled={loading} className="input-field bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 pr-11 h-12 w-full text-right focus:ring-2 focus:ring-red-500 focus:border-transparent rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="relative">
              <Home size={18} className="absolute right-4 top-4 text-slate-400" />
              <textarea placeholder="العنوان الكامل (اختياري)" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                disabled={loading} rows={2} className="input-field resize-none bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 pr-11 py-3 w-full text-right focus:ring-2 focus:ring-red-500 focus:border-transparent rounded-lg" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <span className="text-xs text-red-500">* الحقول المطلوبة</span>
            <div className="flex gap-3 flex-row-reverse">
              <button type="button" onClick={onClose} disabled={loading} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2">
                <X size={16} /> إغلاق
              </button>
              <button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-md transition-colors flex items-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} إضافة
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ====== 2. MANAGE PRICES MODAL ======
function ManagePricesModal({ client, onClose, warehouses }: { client: Client; onClose: () => void; warehouses: Warehouse[] }) {
  const [prices, setPrices] = useState<ClientPrice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPrices() {
      const { data } = await supabase.from('client_prices').select('*').eq('client_id', client.id).order('created_at', { ascending: false })
      if (data) setPrices(data as ClientPrice[])
      setLoading(false)
    }
    fetchPrices()
  }, [client.id])

  const handleAddRow = async () => {
    if (!warehouses.length) return alert('لا يوجد مستودعات متاحة')
    const newPrice = { client_id: client.id, warehouse_id: warehouses[0].id, pricing_type: 'per_order', price: 0 }
    const { data } = await supabase.from('client_prices').insert([newPrice]).select().single()
    if (data) setPrices([data as ClientPrice, ...prices])
  }

  const handleUpdate = async (id: string, field: string, value: any) => {
    setPrices(p => p.map(x => x.id === id ? { ...x, [field]: value } : x))
    await supabase.from('client_prices').update({ [field]: value }).eq('id', id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('تأكيد الحذف؟')) return
    setPrices(p => p.filter(x => x.id !== id))
    await supabase.from('client_prices').delete().eq('id', id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-black/40">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-200">
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors">
            <X size={18} />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <DollarSign size={20} className="text-teal-600" />
              إدارة أسعار العميل: <span className="text-red-600">{client.name}</span>
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-end">
            <button onClick={handleAddRow} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2 text-sm">
              <Plus size={16} /> إضافة سعر جديد
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold">نوع التسعير</th>
                  <th className="p-4 font-bold">المستودع</th>
                  <th className="p-4 font-bold">السعر</th>
                  <th className="p-4 font-bold">تاريخ الإنشاء</th>
                  <th className="p-4 font-bold text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center"><Loader2 size={24} className="mx-auto text-red-500 animate-spin" /></td></tr>
                ) : prices.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">لا توجد أسعار مخصصة</td></tr>
                ) : prices.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <select value={p.pricing_type} onChange={e => handleUpdate(p.id, 'pricing_type', e.target.value)}
                        className="bg-transparent text-red-600 font-mono border border-slate-200 rounded px-2 py-1 outline-none focus:border-red-500">
                        <option value="per_order">per_order</option>
                        <option value="per_kg">per_kg</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <select value={p.warehouse_id} onChange={e => handleUpdate(p.id, 'warehouse_id', e.target.value)}
                        className="bg-transparent text-cyan-700 font-bold border border-slate-200 rounded px-2 py-1 outline-none focus:border-cyan-500">
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-green-600 font-bold">
                        <input type="number" value={p.price} onChange={e => handleUpdate(p.id, 'price', parseFloat(e.target.value) || 0)}
                          className="bg-transparent w-20 text-center border-b border-transparent focus:border-green-500 outline-none" />
                        د.ع
                      </div>
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-xs">{formatDate(p.created_at)}</td>
                    <td className="p-3 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-blue-500 hover:bg-blue-100 rounded"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-bold transition-colors">إغلاق</button>
            <span className="text-xs text-slate-500">عدد الأسعار: {prices.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ====== 3. PRICING RULES MODAL ======
function PricingRulesModal({ client, onClose, warehouses }: { client: Client; onClose: () => void; warehouses: Warehouse[] }) {
  const [rules, setRules] = useState<ClientPricingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    async function fetchRules() {
      const { data } = await supabase.from('client_pricing_rules').select('*').eq('client_id', client.id).order('created_at', { ascending: false })
      if (data) setRules(data as ClientPricingRule[])
      setLoading(false)
    }
    fetchRules()
  }, [client.id])

  const handleAddRow = async () => {
    if (!warehouses.length) return alert('لا يوجد مستودعات متاحة')
    const newRule = { client_id: client.id, warehouse_id: warehouses[0].id, pricing_type: 'per_kg', min_weight: 0, max_weight: 0 }
    const { data } = await supabase.from('client_pricing_rules').insert([newRule]).select().single()
    if (data) setRules([data as ClientPricingRule, ...rules])
  }

  const handleUpdate = async (id: string, field: string, value: any) => {
    setRules(p => p.map(x => x.id === id ? { ...x, [field]: value } : x))
    await supabase.from('client_pricing_rules').update({ [field]: value }).eq('id', id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('تأكيد الحذف؟')) return
    setRules(p => p.filter(x => x.id !== id))
    await supabase.from('client_pricing_rules').delete().eq('id', id)
  }

  const filteredRules = rules.filter(r => 
    (!warehouseFilter || r.warehouse_id === warehouseFilter) &&
    (!typeFilter || r.pricing_type === typeFilter)
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-black/40">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 bg-green-600 text-white">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
          <h2 className="text-lg font-extrabold text-white">
            قواعد تسعير العميل: {client.name}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex gap-3 w-full md:w-auto flex-row-reverse">
              <button onClick={handleAddRow} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2 text-sm flex-1 md:flex-none justify-center">
                <Plus size={16} /> إضافة قاعدة جديدة
              </button>
              <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2 text-sm flex-1 md:flex-none justify-center">
                <RefreshCcw size={16} /> إعادة تعيين التسعير
              </button>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-white text-slate-700 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 flex-1 md:w-40 text-right">
                <option value="">تصفية حسب نوع التسعير</option>
                <option value="per_order">per_order</option>
                <option value="per_kg">per_kg</option>
              </select>
              <select value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)} className="bg-white text-slate-700 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 flex-1 md:w-48 text-right">
                <option value="">تصفية حسب المستودع</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold">المستودع</th>
                  <th className="p-4 font-bold">نوع التسعير</th>
                  <th className="p-4 font-bold">الوزن الأدنى</th>
                  <th className="p-4 font-bold">الوزن الأقصى</th>
                  <th className="p-4 font-bold">تاريخ الإنشاء</th>
                  <th className="p-4 font-bold text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center"><Loader2 size={24} className="mx-auto text-red-500 animate-spin" /></td></tr>
                ) : filteredRules.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">لا توجد قواعد تسعير مخصصة</td></tr>
                ) : filteredRules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <select value={r.warehouse_id} onChange={e => handleUpdate(r.id, 'warehouse_id', e.target.value)}
                        className="bg-transparent text-cyan-700 font-bold border border-slate-200 rounded px-2 py-1 outline-none focus:border-cyan-500">
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </td>
                    <td className="p-3">
                      <select value={r.pricing_type} onChange={e => handleUpdate(r.id, 'pricing_type', e.target.value)}
                        className="bg-transparent text-red-600 font-mono border border-slate-200 rounded px-2 py-1 outline-none focus:border-red-500">
                        <option value="per_order">per_order</option>
                        <option value="per_kg">per_kg</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-slate-700">
                        <input type="number" step="0.01" value={r.min_weight} onChange={e => handleUpdate(r.id, 'min_weight', parseFloat(e.target.value) || 0)}
                          className="bg-transparent w-16 text-center border-b border-transparent focus:border-red-500 outline-none" />
                        كغ
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-slate-700">
                        <input type="number" step="0.01" value={r.max_weight} onChange={e => handleUpdate(r.id, 'max_weight', parseFloat(e.target.value) || 0)}
                          className="bg-transparent w-16 text-center border-b border-transparent focus:border-red-500 outline-none" />
                        كغ
                      </div>
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-xs">{formatDate(r.created_at)}</td>
                    <td className="p-3 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-blue-500 hover:bg-blue-100 rounded"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-bold transition-colors">إغلاق</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ====== 4. CLIENT REPORT MODAL ======
function ClientReportModal({ client, onClose, warehouses }: { client: Client; onClose: () => void; warehouses: Warehouse[] }) {
  const [prices, setPrices] = useState<ClientPrice[]>([])
  const [rules, setRules] = useState<ClientPricingRule[]>([])
  const [shipmentsStats, setShipmentsStats] = useState({ total: 0, amount: 0, active: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReportData() {
      const [pricesRes, rulesRes, shipmentsRes] = await Promise.all([
        supabase.from('client_prices').select('*').eq('client_id', client.id),
        supabase.from('client_pricing_rules').select('*').eq('client_id', client.id),
        supabase.from('shipments').select('status, amount').eq('client_id', client.id)
      ])

      if (pricesRes.data) setPrices(pricesRes.data as ClientPrice[])
      if (rulesRes.data) setRules(rulesRes.data as ClientPricingRule[])
      if (shipmentsRes.data) {
        const activeCount = shipmentsRes.data.filter(s => s.status !== 'delivered' && s.status !== 'returned' && s.status !== 'cancelled').length
        const totalAmount = shipmentsRes.data.reduce((sum, s) => sum + (s.amount || 0), 0)
        setShipmentsStats({ total: shipmentsRes.data.length, amount: totalAmount, active: activeCount })
      }
      setLoading(false)
    }
    fetchReportData()
  }, [client.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-black/40">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 bg-red-600 text-white">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
          <h2 className="text-lg font-extrabold text-white">
            تقرير العميل: {client.name}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 size={32} className="text-red-500 animate-spin" /></div>
          ) : (
            <>
              {/* Client Info Block */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-end items-center gap-2">
                  <span className="font-bold text-slate-700">معلومات العميل</span>
                  <Users size={18} className="text-red-600" />
                </div>
                <div className="p-4 grid grid-cols-2 gap-4 text-right">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">رقم الهاتف</div>
                    <div className="font-mono text-slate-800" dir="ltr">{client.phones[0]}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">الاسم</div>
                    <div className="font-bold text-slate-800">{client.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">تكلفة التوصيل المحلي</div>
                    <div className="font-bold text-green-600">{formatCurrency(client.delivery_price)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">العنوان</div>
                    <div className="text-sm text-slate-700">{client.governorate} - {client.district || 'أخرى'}</div>
                  </div>
                  <div></div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">علامة الشحن</div>
                    <div className="font-bold text-red-600">{client.shipping_tag || client.code}</div>
                  </div>
                </div>
              </div>

              {/* Pricing Rules Block */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-end items-center gap-2">
                  <span className="font-bold text-slate-700">قواعد التسعير</span>
                  <Store size={18} className="text-teal-600" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-3 font-bold">السعر</th>
                        <th className="p-3 font-bold">نوع التسعير</th>
                        <th className="p-3 font-bold">المستودع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prices.length === 0 ? (
                        <tr><td colSpan={3} className="p-4 text-center text-slate-500">لا توجد أسعار</td></tr>
                      ) : prices.map(p => {
                        const w = warehouses.find(x => x.id === p.warehouse_id)
                        return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-800">{p.price}</td>
                            <td className="p-3 text-green-600">{p.pricing_type === 'per_kg' ? 'لكل كغ' : 'لكل طلب'}</td>
                            <td className="p-3 text-slate-700">{w?.name}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Weight Rules Block */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-end items-center gap-2">
                  <span className="font-bold text-slate-700">قواعد الوزن</span>
                  <FileText size={18} className="text-green-600" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-3 font-bold">الوزن</th>
                        <th className="p-3 font-bold">نوع التسعير</th>
                        <th className="p-3 font-bold">المستودع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rules.length === 0 ? (
                        <tr><td colSpan={3} className="p-4 text-center text-slate-500">لا توجد قواعد وزن</td></tr>
                      ) : rules.map(r => {
                        const w = warehouses.find(x => x.id === r.warehouse_id)
                        return (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="p-3 text-slate-800">{r.min_weight} - {r.max_weight}</td>
                            <td className="p-3 text-slate-600">{r.pricing_type === 'per_kg' ? 'لكل كغ' : 'لكل طلب'}</td>
                            <td className="p-3 text-slate-700">{w?.name}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Shipments Summary Block */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden p-6 flex flex-col items-center shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xl font-bold text-slate-800">ملخص الشحنات</span>
                  <Store size={24} className="text-red-600" />
                </div>
                <div className="flex justify-around w-full max-w-md">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">{formatCurrency(shipmentsStats.amount).split(' ')[0]}</div>
                    <div className="text-sm text-slate-500">إجمالي المبالغ</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 mb-1">{shipmentsStats.total}</div>
                    <div className="text-sm text-slate-500">إجمالي الشحنات</div>
                  </div>
                </div>
                <div className="w-full mt-6 bg-slate-50 border border-slate-200 p-4 rounded-lg flex justify-between items-center text-sm">
                  <div className="bg-red-600 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center">{shipmentsStats.active}</div>
                  <span className="text-slate-700 font-bold">فعال (حسب الحالة)</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ====== 5. EDIT CLIENT MODAL ======
function EditClientModal({ client, onClose, onUpdate, warehouses }: { client: Client; onClose: () => void; onUpdate: (c: Client) => void; warehouses: Warehouse[] }) {
  const [form, setForm] = useState({
    name: client.name,
    phone1: client.phones[0] || '',
    phone2: client.phones[1] || '',
    password: client.password || '',
    shipping_tag: client.shipping_tag || '',
    pricing_type: client.pricing_type,
    warehouse_id: client.warehouse_id || '',
    governorate: client.governorate,
    district: client.district || '',
    delivery_price: String(client.delivery_price),
    address: client.address || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const updateData = {
      name: form.name,
      phones: [form.phone1, form.phone2].filter(Boolean),
      password: form.password,
      shipping_tag: form.shipping_tag,
      pricing_type: form.pricing_type,
      warehouse_id: form.warehouse_id || null,
      governorate: form.governorate,
      district: form.district || null,
      delivery_price: parseFloat(form.delivery_price) || 0,
      address: form.address || null,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from('clients').update(updateData).eq('id', client.id).select().single()
    if (data && !error) {
      await supabase.from('activity_logs').insert([{ action: 'تعديل عميل', entity_type: 'client', entity_id: client.code, details: `تم تعديل بيانات العميل ${client.name}`, user_name: 'Admin' }])
      onUpdate(data as unknown as Client)
    } else {
      alert('حدث خطأ: ' + error?.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-black/40">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 bg-blue-600 text-white">
          <button onClick={onClose} disabled={loading} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"><X size={20} /></button>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold">تعديل العميل: {client.name}</h2>
            <Edit size={20} />
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Users size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="الاسم *" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} disabled={loading} className="input-field pr-9 bg-slate-50 h-11" />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="كلمة المرور" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} disabled={loading} className="input-field pr-9 bg-slate-50 h-11" />
            </div>
            <div className="relative">
              <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="tel" placeholder="رقم الهاتف 1 *" required value={form.phone1} onChange={e => setForm(p => ({ ...p, phone1: e.target.value }))} disabled={loading} className="input-field pr-9 bg-slate-50 h-11" />
            </div>
            <div className="relative">
              <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="tel" placeholder="رقم الهاتف 2 (اختياري)" value={form.phone2} onChange={e => setForm(p => ({ ...p, phone2: e.target.value }))} disabled={loading} className="input-field pr-9 bg-slate-50 h-11" />
            </div>
            <div className="relative">
              <Tag size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="العلامة الشحنية" value={form.shipping_tag} onChange={e => setForm(p => ({ ...p, shipping_tag: e.target.value }))} disabled={loading} className="input-field pr-9 bg-slate-50 h-11" />
            </div>
            <div className="relative">
              <Store size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select value={form.warehouse_id} onChange={e => setForm(p => ({ ...p, warehouse_id: e.target.value }))} disabled={loading} className="input-field pr-9 bg-slate-50 h-11">
                <option value="">المستودع (اختياري)</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="relative">
              <MapPin size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select value={form.governorate} onChange={e => setForm(p => ({ ...p, governorate: e.target.value }))} disabled={loading} className="input-field pr-9 bg-slate-50 h-11">
                {IRAQI_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="relative">
              <Home size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="المنطقة (اختياري)" value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} disabled={loading} className="input-field pr-9 bg-slate-50 h-11" />
            </div>
            <div className="relative">
              <DollarSign size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="number" placeholder="سعر التوصيل المحلي" value={form.delivery_price} onChange={e => setForm(p => ({ ...p, delivery_price: e.target.value }))} disabled={loading} className="input-field pr-9 bg-slate-50 h-11" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-600">نوع التسعير</label>
              <select value={form.pricing_type} onChange={e => setForm(p => ({ ...p, pricing_type: e.target.value as PricingType }))} disabled={loading} className="input-field bg-slate-50 h-11">
                <option value="per_order">لكل طلب</option>
                <option value="per_kg">لكل كيلوغرام</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3 shadow-md bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Edit size={18} />} حفظ التعديلات
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="btn-ghost flex-1 justify-center py-3">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ====== MAIN PAGE ======
export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  
  // Modals state
  const [pricesModalClient, setPricesModalClient] = useState<Client | null>(null)
  const [rulesModalClient, setRulesModalClient] = useState<Client | null>(null)
  const [reportModalClient, setReportModalClient] = useState<Client | null>(null)
  const [editModalClient, setEditModalClient] = useState<Client | null>(null)

  useEffect(() => {
    async function fetchData() {
      const [clientsRes, warehousesRes] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('warehouses').select('*').order('created_at', { ascending: false })
      ])
      
      if (clientsRes.data) setClients(clientsRes.data as unknown as Client[])
      if (warehousesRes.data) setWarehouses(warehousesRes.data as unknown as Warehouse[])
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleDelete = async (id: string) => {
    if(!confirm('هل أنت متأكد من حذف هذا العميل؟ ستُحذف جميع الأسعار والقواعد المرتبطة به.')) return
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if(!error) {
      setClients(p => p.filter(c => c.id !== id))
    }
  }

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.name.includes(search) || c.code.includes(search.toUpperCase()) || c.phones.some(p => p.includes(search))
    return matchSearch
  })

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 border border-red-100">
            <Users size={20} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">العملاء</h1>
        </div>
        
        <div className="flex items-center gap-3 flex-row-reverse w-full sm:w-auto">
          <button onClick={() => setShowAddModal(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none">
            <Plus size={18} /> إضافة عميل
          </button>
          
          <select className="bg-white border border-slate-200 text-slate-600 rounded-lg px-4 py-2.5 hidden md:block outline-none focus:border-red-500">
            <option>نوع التسعير</option>
          </select>
          <select className="bg-white border border-slate-200 text-slate-600 rounded-lg px-4 py-2.5 hidden md:block outline-none focus:border-red-500">
            <option>المحافظة</option>
          </select>
          
          <div className="relative flex-1 sm:w-64">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="بحث عن عميل..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl pr-12 py-2.5 w-full focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
              <tr>
                <th className="p-4 font-bold text-center w-12">#</th>
                <th className="p-4 font-bold">الاسم</th>
                <th className="p-4 font-bold">الهاتف</th>
                <th className="p-4 font-bold">المحافظة</th>
                <th className="p-4 font-bold">المنطقة</th>
                <th className="p-4 font-bold">نوع التسعير</th>
                <th className="p-4 font-bold">سعر التوصيل المحلي</th>
                <th className="p-4 font-bold">تاريخ الإنشاء</th>
                <th className="p-4 font-bold text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="p-12 text-center"><Loader2 size={32} className="mx-auto text-red-500 animate-spin" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="p-12 text-center text-slate-500">لا يوجد عملاء مطابقين للبحث</td></tr>
              ) : filtered.map((c, i) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 text-center text-slate-500 font-mono text-sm">{i + 1}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">{c.code}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-700 font-mono tracking-wide" dir="ltr">{c.phones[0]}</div>
                    {c.phones.length > 1 && <div className="text-xs text-slate-500 font-mono mt-0.5" dir="ltr">{c.phones[1]}</div>}
                  </td>
                  <td className="p-4 text-sm text-slate-700">{c.governorate}</td>
                  <td className="p-4 text-sm text-slate-600">{c.district || 'أخرى'}</td>
                  <td className="p-4">
                    <span className="text-xs font-mono text-slate-600">{c.pricing_type}</span>
                  </td>
                  <td className="p-4 text-sm font-mono text-slate-700 font-bold">
                    {formatCurrency(c.delivery_price)}
                  </td>
                  <td className="p-4 text-xs font-mono text-slate-500">{formatDate(c.created_at)}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap opacity-90 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditModalClient(c)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                        title="تعديل">
                        <Edit size={12} /> تعديل
                      </button>
                      <button onClick={() => setReportModalClient(c)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
                        title="تقرير العميل">
                        <FileSearch size={12} /> تقرير
                      </button>
                      <button onClick={() => setRulesModalClient(c)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                        title="قواعد التسعير">
                        <FileText size={12} /> القواعد
                      </button>
                      <button onClick={() => setPricesModalClient(c)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors shadow-sm"
                        title="أسعار العميل">
                        <Store size={12} /> الأسعار
                      </button>
                      <button onClick={() => {
                        const url = `${window.location.origin}/client-stats/${c.id}`;
                        navigator.clipboard.writeText(url);
                        window.open(url, '_blank');
                        alert('تم نسخ رابط المتجر وفتحه بنجاح!');
                      }} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-600 text-white text-xs font-bold hover:bg-slate-700 transition-colors shadow-sm"
                        title="نسخ رابط المتجر وفتحه">
                        <Link size={12} /> المتجر
                      </button>
                      <button onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/client-register/${c.id}`);
                        alert(`تم نسخ رابط التسجيل للعميل ${c.name}!`);
                      }} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors shadow-sm"
                        title="نسخ رابط التسجيل">
                        <Settings size={12} /> تسجيل
                      </button>
                      <button onClick={() => handleDelete(c.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-sm"
                        title="حذف">
                        <Trash2 size={12} /> حذف
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
        <AddClientModal
          warehouses={warehouses}
          onClose={() => setShowAddModal(false)}
          onAdd={c => setClients(p => [c, ...p])}
        />
      )}

      {pricesModalClient && (
        <ManagePricesModal
          client={pricesModalClient}
          warehouses={warehouses}
          onClose={() => setPricesModalClient(null)}
        />
      )}

      {rulesModalClient && (
        <PricingRulesModal
          client={rulesModalClient}
          warehouses={warehouses}
          onClose={() => setRulesModalClient(null)}
        />
      )}

      {reportModalClient && (
        <ClientReportModal
          client={reportModalClient}
          warehouses={warehouses}
          onClose={() => setReportModalClient(null)}
        />
      )}

      {editModalClient && (
        <EditClientModal
          client={editModalClient}
          warehouses={warehouses}
          onClose={() => setEditModalClient(null)}
          onUpdate={updated => {
            setClients(p => p.map(c => c.id === updated.id ? updated : c))
            setEditModalClient(null)
          }}
        />
      )}
    </div>
  )
}
