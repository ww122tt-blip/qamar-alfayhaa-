'use client'

import { useState, useEffect } from 'react'
import { UserCog, Plus, Search, Shield, ShieldOff, Trash2, Edit, Loader2, X, Phone, User as UserIcon } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Profile, UserRole } from '@/types'

const ROLE_LABELS: Record<string, string> = { admin: 'مدير', manager: 'مشرف', employee: 'موظف' }
const ROLE_CLASSES: Record<string, string> = { admin: 'badge-returned', manager: 'badge-pending', employee: 'badge-transit' }

function AddUserModal({ onClose, onAdd }: { onClose: () => void; onAdd: (u: Profile) => void }) {
  const [form, setForm] = useState({ name: '', username: '', role: 'employee', phone: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Inserting without auth.users link for now since we don't have full auth setup yet
    const { data, error } = await supabase.from('profiles').insert([{
      name: form.name,
      username: form.username,
      role: form.role,
      phone: form.phone,
      is_active: true
    }]).select().single()

    if (data && !error) {
      onAdd(data as Profile)
      onClose()
    } else {
      alert('حدث خطأ أثناء إضافة المستخدم. قد يكون اسم المستخدم مستخدم مسبقاً.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="glass-card w-full max-w-md animate-fade-in shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200">
              <UserIcon size={20} className="text-gold" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-800">إضافة مستخدم جديد</h2>
          </div>
          <button onClick={onClose} disabled={loading} className="btn-ghost p-2 rounded-lg hover:bg-slate-200 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-700">الاسم الكامل *</label>
            <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              disabled={loading} className="input-field bg-white shadow-sm" placeholder="مثال: أحمد محمد" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-700">اسم المستخدم (للدخول) *</label>
            <input type="text" required value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              disabled={loading} className="input-field bg-white shadow-sm font-mono text-left" dir="ltr" placeholder="ahmed_m" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-700">رقم الهاتف</label>
            <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              disabled={loading} className="input-field bg-white shadow-sm" placeholder="07XXXXXXXX" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-700">الصلاحية *</label>
            <select required value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              disabled={loading} className="input-field bg-white shadow-sm">
              <option value="employee">موظف</option>
              <option value="manager">مشرف</option>
              <option value="admin">مدير نظام</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3 shadow-md">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} إضافة
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="btn-ghost flex-1 justify-center py-3">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (data) setUsers(data as Profile[])
      setLoading(false)
    }
    fetchUsers()
  }, [])

  const filtered = users.filter(u => !search || u.name.includes(search) || u.username.includes(search))

  const handleAddUser = (user: Profile) => {
    setUsers(prev => [user, ...prev])
  }

  const handleDelete = async (id: string) => {
    if(!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if(!error) setUsers(p => p.filter(x => x.id !== id))
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="page-header">
        <div className="page-title">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200">
            <UserCog size={20} className="text-gold" />
          </div>
          <span className="text-slate-800">المستخدمين</span>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary shadow-sm">
          <Plus size={18} /> إضافة مستخدم
        </button>
      </div>

      <div className="relative w-72">
        <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="بحث عن مستخدم بالاسم..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="input-field pr-11 shadow-sm" />
      </div>

      <div className="glass-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>الاسم</th>
                <th>اسم المستخدم</th>
                <th>الصلاحية</th>
                <th>رقم الهاتف</th>
                <th>الفعالية</th>
                <th>تاريخ الإنشاء</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center"><Loader2 size={32} className="mx-auto text-gold animate-spin" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-slate-500">
                  <UserCog size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="font-semibold text-lg text-slate-500">لا يوجد مستخدمين</p>
                  <p className="text-sm">قم بإضافة مستخدمين للنظام ليظهروا هنا</p>
                </td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id}>
                  <td className="text-slate-400 font-bold">{i + 1}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #6B0F1A, #9f1239)' }}>
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-800 text-sm">{u.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-sm font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{u.username}</span>
                  </td>
                  <td>
                    <span className={`badge shadow-sm ${ROLE_CLASSES[u.role] || 'badge-transit'}`}>
                      <span className="w-2 h-2 rounded-full bg-current opacity-75" />
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="text-slate-500 font-medium">{u.phone || '—'}</td>
                  <td>
                    <span className={`badge shadow-sm ${u.is_active ? 'badge-delivered' : 'badge-returned'}`}>
                      <span className="w-2 h-2 rounded-full bg-current opacity-75" />
                      {u.is_active ? 'فعال' : 'غير فعال'}
                    </span>
                  </td>
                  <td className="text-slate-500 text-xs font-medium">{formatDate(u.created_at)}</td>
                  <td>
                    <div className="flex items-center gap-1.5 flex-wrap w-[200px]">
                      <button className="btn-action edit" title="تعديل">
                        <Edit size={14} /> <span>تعديل</span>
                      </button>
                      <button className="btn-action view" title="الصلاحيات">
                        <Shield size={14} /> <span>صلاحيات</span>
                      </button>
                      <button className="btn-action delete" title="حذف" onClick={() => handleDelete(u.id)}>
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

      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} onAdd={handleAddUser} />}
    </div>
  )
}
