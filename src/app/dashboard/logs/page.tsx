'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, Clock, Package, Users, Wallet, Shield, Loader2, Search, Layers } from 'lucide-react'
import { timeAgo, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface ActivityLog {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  user_name: string
  details: string | null
  created_at: string
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  shipment: Package, client: Users, shelf: Layers, cash_box: Wallet, whatsapp: Activity, default: Activity
}
const ACTION_COLORS: Record<string, string> = {
  shipment: 'bg-amber-50 border-amber-100',
  client: 'bg-blue-50 border-blue-100',
  shelf: 'bg-purple-50 border-purple-100',
  cash_box: 'bg-green-50 border-green-100',
}
const ICON_COLORS: Record<string, string> = {
  shipment: 'text-gold', client: 'text-blue-500', shelf: 'text-purple-500', cash_box: 'text-green-500',
}

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100)
    if (data) setLogs(data as ActivityLog[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const filtered = logs.filter(l => {
    if (entityFilter !== 'all' && l.entity_type !== entityFilter) return false
    if (search && !l.action.includes(search) && !(l.details || '').includes(search) && !(l.entity_id || '').includes(search)) return false
    return true
  })

  const entityTypes = ['all', ...Array.from(new Set(logs.map(l => l.entity_type)))]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="page-header">
        <div className="page-title">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200"><Activity size={20} className="text-gold" /></div>
          <span className="text-slate-800">سجل الحركات</span>
          <span className="text-sm font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md mr-2">{logs.length} حركة</span>
        </div>
        <button onClick={fetchLogs} className="btn-ghost shadow-sm">
          <Loader2 size={16} className={loading ? 'animate-spin' : ''} /> تحديث
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="بحث في السجل..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-9 text-sm w-full" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {entityTypes.map(t => (
            <button key={t} onClick={() => setEntityFilter(t)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${entityFilter === t ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              {t === 'all' ? 'الكل' : t === 'shipment' ? 'شحنات' : t === 'client' ? 'عملاء' : t === 'shelf' ? 'شلفان' : t === 'cash_box' ? 'صناديق' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-card p-16 text-center"><Loader2 size={32} className="mx-auto text-gold animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-16 text-center text-slate-400">
            <Activity size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold text-lg text-slate-500">لا توجد سجلات بعد</p>
            <p className="text-sm">سيتم تسجيل جميع العمليات في النظام هنا تلقائياً</p>
          </div>
        ) : filtered.map(log => {
          const Icon = ACTION_ICONS[log.entity_type] || Activity
          const colorClass = ACTION_COLORS[log.entity_type] || 'bg-slate-50 border-slate-100'
          const iconColor = ICON_COLORS[log.entity_type] || 'text-slate-500'
          return (
            <div key={log.id} className="bg-white rounded-2xl p-5 flex items-start gap-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm ${colorClass}`}>
                <Icon size={18} className={iconColor} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-extrabold text-sm text-slate-800">{log.action}</span>
                  {log.entity_id && (
                    <span className="font-mono font-bold text-xs text-gold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 shadow-sm">#{log.entity_id}</span>
                  )}
                  <span className="badge badge-transit text-xs shadow-sm">
                    {log.entity_type === 'shipment' ? 'شحنة' : log.entity_type === 'client' ? 'عميل' : log.entity_type === 'shelf' ? 'شلف' : log.entity_type === 'cash_box' ? 'صندوق' : 'نظام'}
                  </span>
                </div>
                {log.details && <p className="text-sm mt-1.5 font-medium text-slate-500">{log.details}</p>}
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 flex items-center gap-1.5">
                    <Shield size={12} className="text-slate-400" /> {log.user_name}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <Clock size={12} /> {timeAgo(log.created_at)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
