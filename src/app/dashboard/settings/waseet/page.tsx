'use client'

import { useState, useEffect } from 'react'
import { Truck, Save, Loader2, CheckCircle, XCircle, RefreshCw, Eye, EyeOff, Zap, Shield, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function WaseetSettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [syncResult, setSyncResult] = useState<{ synced: number } | null>(null)
  const [form, setForm] = useState({ username: '', password: '', is_active: false })

  const fetchSettings = async () => {
    setLoading(true)
    const { data } = await supabase.from('waseet_settings').select('*').eq('id', 1).single()
    if (data) {
      setSettings(data)
      setForm({
        username: data.username || '',
        password: data.password || '',
        is_active: data.is_active || false,
      })
    }
    setLoading(false)
  }

  useEffect(() => { fetchSettings() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('waseet_settings').upsert({
      id: 1,
      username: form.username,
      password: form.password,
      is_active: form.is_active,
      token: null, // Reset token when credentials change
      token_updated_at: null,
    })
    
    if (error) {
      alert('خطأ في الحفظ: ' + error.message)
      console.error(error)
    } else {
      await fetchSettings()
      alert('تم حفظ إعدادات الوسيط بنجاح ✅')
    }
    setSaving(false)
  }

  const handleSyncNow = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/waseet', { method: 'GET' })
      const data = await res.json()
      setSyncResult(data)
    } catch {
      setSyncResult({ synced: 0 })
    }
    setSyncing(false)
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={36} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
          <Truck size={24} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">إعدادات الوسيط</h1>
          <p className="text-sm text-slate-500 font-medium">ربط النظام مع شركة الوسيط للتوصيل تلقائياً</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <h3 className="font-extrabold text-blue-800 text-sm mb-3 flex items-center gap-2">
          <Info size={16} /> كيف يعمل النظام؟
        </h3>
        <ul className="text-xs text-blue-700 space-y-2 list-disc list-inside font-medium leading-relaxed">
          <li>عند تغيير حالة الشحنة إلى <strong>"في مكتب الوسيط"</strong>، يتم إرسالها للوسيط تلقائياً.</li>
          <li>النظام يتحقق من حالة الشحنات عند الوسيط كل <strong>30 دقيقة</strong> تلقائياً.</li>
          <li>بعد الإرسال، <strong>لا يمكن تغيير الحالة يدوياً</strong> — الوسيط فقط من يغيّرها.</li>
          <li>عند تغيير الحالة (مثل التسليم)، يتم إرسال إشعار واتساب للعميل تلقائياً.</li>
        </ul>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
          <Shield size={18} className="text-gold" /> بيانات تسجيل الدخول
        </h2>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم المستخدم (Username)</label>
          <input
            type="text"
            value={form.username}
            onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
            placeholder="merchant_username"
            dir="ltr"
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">كلمة المرور (Password)</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
              dir="ltr"
              className="input-field w-full pl-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Activation Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="font-bold text-slate-700 text-sm">تفعيل التكامل مع الوسيط</p>
            <p className="text-xs text-slate-500 mt-0.5">تشغيل الإرسال والمزامنة التلقائية</p>
          </div>
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${form.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${form.is_active ? 'left-8' : 'left-1'}`} />
          </button>
        </div>

        {/* Token Status */}
        {settings?.token && (
          <div className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
            <CheckCircle size={14} />
            Token محفوظ — آخر تجديد: {settings.token_updated_at ? new Date(settings.token_updated_at).toLocaleString('ar') : 'غير محدد'}
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          حفظ الإعدادات
        </button>
      </form>

      {/* Manual Sync */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
          <RefreshCw size={18} className="text-blue-500" /> مزامنة يدوية
        </h2>
        <p className="text-sm text-slate-500">اضغط لمزامنة حالة الشحنات مع الوسيط الآن بدون انتظار.</p>

        {syncResult && (
          <div className={`flex items-center gap-2 text-sm font-bold px-4 py-3 rounded-xl border ${syncResult.synced > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            {syncResult.synced > 0 ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {syncResult.synced > 0 ? `تم تحديث ${syncResult.synced} شحنة بنجاح!` : 'لا توجد تحديثات جديدة.'}
          </div>
        )}

        <button
          onClick={handleSyncNow}
          disabled={syncing || !form.is_active}
          className="btn-primary w-full justify-center py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {syncing ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
          {syncing ? 'جاري المزامنة...' : 'مزامنة الآن'}
        </button>

        {!form.is_active && (
          <p className="text-xs text-center text-amber-600 font-bold">⚠️ يجب تفعيل التكامل أولاً لاستخدام المزامنة</p>
        )}
      </div>
    </div>
  )
}
