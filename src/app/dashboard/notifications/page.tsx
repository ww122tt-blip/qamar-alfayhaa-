'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, CheckCheck, Archive, MessageSquare, Package, Clock, Search, Loader2 } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface DBNotification {
  id: string
  title: string
  content: string
  type: string
  entity_type?: string
  entity_id?: string
  is_read: boolean
  is_archived: boolean
  created_at: string
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'shipment') return <Package size={16} className="text-gold" />
  if (type === 'whatsapp') return <MessageSquare size={16} className="text-green-500" />
  return <Bell size={16} className="text-blue-500" />
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<DBNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'whatsapp'>('all')
  const [search, setSearch] = useState('')

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100)
    if (data) setNotifications(data as DBNotification[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const filtered = notifications.filter(n => {
    if (filter === 'unread' && n.is_read) return false
    if (filter === 'whatsapp' && n.type !== 'whatsapp') return false
    if (search && !n.title.includes(search) && !n.content.includes(search)) return false
    if (n.is_archived) return false
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read && !n.is_archived).length

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    setNotifications(p => p.map(n => ({ ...n, is_read: true })))
  }

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const archive = async (id: string) => {
    await supabase.from('notifications').update({ is_archived: true }).eq('id', id)
    setNotifications(p => p.map(n => n.id === id ? { ...n, is_archived: true } : n))
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="page-header">
        <div className="page-title">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center relative bg-white shadow-sm border border-slate-200">
            <Bell size={20} className="text-gold" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white bg-red-500 shadow-sm border-2 border-white">{unreadCount}</span>
            )}
          </div>
          <span className="text-slate-800">الاشعارات</span>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-xs py-2 shadow-sm" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck size={14} /> تعيين الكل كمقروء
          </button>
          <button onClick={fetchNotifications} className="btn-ghost text-xs py-2 shadow-sm">
            <Loader2 size={14} className={loading ? 'animate-spin' : ''} /> تحديث
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {[
          { key: 'all', label: 'الكل', count: notifications.filter(n => !n.is_archived).length },
          { key: 'unread', label: 'غير مقروء', count: unreadCount },
          { key: 'whatsapp', label: 'واتساب', count: notifications.filter(n => n.type === 'whatsapp').length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key as typeof filter)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 shadow-sm ${filter === tab.key ? 'bg-slate-800 text-white' : 'btn-ghost text-slate-500 hover:text-slate-800'}`}>
            {tab.label}
            <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${filter === tab.key ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>
          </button>
        ))}
        <div className="relative mr-auto shadow-sm">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-9 text-sm py-2.5 w-56" />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-card p-16 text-center"><Loader2 size={32} className="mx-auto text-gold animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-16 text-center text-slate-400 shadow-sm">
            <Bell size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold text-lg text-slate-500">لا توجد إشعارات</p>
            <p className="text-sm mt-1">ستظهر الإشعارات هنا عند حدوث أي نشاط في النظام</p>
          </div>
        ) : filtered.map(n => (
          <div key={n.id} onClick={() => markRead(n.id)}
            className={`bg-white rounded-2xl p-5 cursor-pointer transition-all duration-300 border shadow-sm ${!n.is_read ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 hover:border-slate-300 hover:shadow-md'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm border ${n.type === 'whatsapp' ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                <NotifIcon type={n.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap mb-1">
                  <span className="text-sm font-extrabold text-slate-800">{n.title}</span>
                  {!n.is_read && <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" />}
                  <span className="badge badge-transit text-xs shadow-sm">{n.type === 'shipment' ? 'شحنة' : n.type === 'whatsapp' ? 'واتساب' : 'نظام'}</span>
                  {n.entity_id && (
                    <span className="text-xs font-mono font-bold text-gold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 shadow-sm">#{n.entity_id}</span>
                  )}
                </div>
                <p className="text-sm mt-1 font-medium text-slate-500">{n.content}</p>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mt-2"><Clock size={12} />{timeAgo(n.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-sm ${!n.is_read ? 'badge-pending' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  {n.is_read ? 'مقروء' : 'غير مقروء'}
                </span>
                <button onClick={e => { e.stopPropagation(); archive(n.id) }} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600" title="أرشفة">
                  <Archive size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
