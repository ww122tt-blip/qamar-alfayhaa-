'use client'

import { useState, useEffect } from 'react'
import { Settings, ArrowRight, Edit, X, Save, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface GeneralSetting {
  id: string
  key: string
  name: string
  value: string
  type: string
  description?: string | null
}

function EditSettingModal({ setting, onClose, onSave }: { setting: GeneralSetting, onClose: () => void, onSave: (id: string, val: string) => void }) {
  const [val, setVal] = useState(setting.value)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase
      .from('settings')
      .update({ value: val })
      .eq('id', setting.id)

    if (!error) {
      onSave(setting.id, val)
      onClose()
    } else {
      console.error('Failed to update setting:', error)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="glass-card w-full max-w-md animate-fade-in bg-white shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200">
              <Edit size={20} className="text-gold" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-800">تعديل الإعداد</h2>
          </div>
          <button onClick={onClose} disabled={loading} className="btn-ghost p-2 rounded-lg hover:bg-slate-200 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-700">{setting.name}</label>
            {setting.type === 'boolean' ? (
              <select value={val} onChange={e => setVal(e.target.value)} className="input-field shadow-sm bg-white font-semibold" disabled={loading}>
                <option value="true">مفعل (نعم)</option>
                <option value="false">معطل (لا)</option>
              </select>
            ) : (
              <input 
                type={setting.type === 'number' ? 'number' : 'text'} 
                required
                value={val} 
                onChange={e => setVal(e.target.value)}
                disabled={loading}
                className={`input-field shadow-sm bg-white ${setting.key.includes('token') ? 'font-mono text-left' : ''}`}
                dir={setting.key.includes('token') ? 'ltr' : 'rtl'}
              />
            )}
            {setting.description && (
              <p className="mt-2 text-xs font-medium text-slate-500 flex items-center gap-1">
                <AlertCircle size={12} /> {setting.description}
              </p>
            )}
            <p className="mt-2 text-xs font-mono text-slate-400 bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-100">
              Key: {setting.key}
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3 text-base shadow-md disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} حفظ التعديل
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<GeneralSetting[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase.from('settings').select('*').order('key')
      if (data) setSettings(data)
      if (error) console.error('Error fetching settings:', error)
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleSave = (id: string, newVal: string) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, value: newVal } : s))
  }

  const editingSetting = settings.find(s => s.id === editingId)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings" className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-gold hover:border-amber-200 transition-colors">
            <ArrowRight size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200">
              <Settings size={20} className="text-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800">الاعدادات العامة</h1>
              <p className="text-sm font-semibold text-slate-500">إدارة ثوابت النظام والتسعيرات</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 size={32} className="text-gold animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {settings.map(s => (
            <div key={s.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-extrabold text-slate-800 leading-tight flex-1">{s.name}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${s.type === 'boolean' ? 'bg-blue-50 text-blue-600 border-blue-100' : s.type === 'number' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {s.type === 'boolean' ? 'تفعيل' : s.type === 'number' ? 'رقم' : 'نص'}
                  </span>
                </div>
                
                <div className="mb-4">
                  {s.type === 'boolean' ? (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${s.value === 'true' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.value === 'true' ? 'bg-green-500' : 'bg-red-500'}`} />
                      {s.value === 'true' ? 'مفعل' : 'معطل'}
                    </span>
                  ) : (
                    <p className={`text-base font-bold text-slate-600 ${s.key.includes('token') ? 'font-mono text-sm truncate' : ''}`} dir={s.key.includes('token') ? 'ltr' : 'rtl'}>
                      {s.type === 'number' ? Number(s.value).toLocaleString('en-US') : s.value}
                    </p>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => setEditingId(s.id)}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-50 hover:bg-gold hover:text-white transition-colors border border-slate-100 hover:border-gold"
              >
                <Edit size={14} /> تعديل
              </button>
            </div>
          ))}
        </div>
      )}

      {editingSetting && (
        <EditSettingModal 
          setting={editingSetting} 
          onClose={() => setEditingId(null)} 
          onSave={handleSave} 
        />
      )}
    </div>
  )
}

