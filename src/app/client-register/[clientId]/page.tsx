'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { IRAQI_GOVERNORATES } from '@/lib/utils'
import { Eye, EyeOff, Loader2, Package, CheckCircle, Phone, User, Lock, MapPin, Home } from 'lucide-react'

export default function ClientRegisterPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string

  const [client, setClient] = useState<{ id: string; name: string; code: string; shipping_tag?: string } | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone1: '',
    phone2: '',
    password: '',
    governorate: '',
    district: '',
    address: '',
  })

  useEffect(() => {
    async function fetchClient() {
      const { data } = await supabase
        .from('clients')
        .select('id, name, code, shipping_tag, phones, password, is_active')
        .eq('id', clientId)
        .single()
        
      const clientData = data as any

      if (!clientData || !clientData.is_active) {
        setNotFound(true)
      } else {
        setClient(clientData)
        // Pre-fill name if available
        if (clientData.name) setForm(p => ({ ...p, name: clientData.name }))
        if (clientData.phones?.[0]) setForm(p => ({ ...p, phone1: clientData.phones[0] }))
        // Check if already has password set (registered before)
        if (clientData.password) setAlreadyRegistered(false) // Still allow re-register
      }
      setLoading(false)
    }
    fetchClient()
  }, [clientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 4) {
      alert('كلمة المرور يجب أن تكون 4 أحرف على الأقل')
      return
    }
    setSubmitting(true)

    // @ts-ignore
    const { error } = await supabase.from('clients').update({
      name: form.name,
      phones: [form.phone1, form.phone2].filter(Boolean),
      password: form.password,
      governorate: form.governorate,
      district: form.district || null,
      address: form.address || null,
      updated_at: new Date().toISOString(),
    } as any).eq('id', clientId)

    if (!error) {
      // Save auth in localStorage so portal knows who is logged in
      localStorage.setItem('client_session', JSON.stringify({
        clientId,
        phone: form.phone1,
        password: form.password,
        name: form.name,
        authenticated: true,
        ts: Date.now(),
      }))
      setDone(true)
      setTimeout(() => {
        router.push(`/client-stats/${clientId}`)
      }, 2000)
    } else {
      alert('حدث خطأ أثناء التسجيل: ' + error.message)
    }
    setSubmitting(false)
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)' }}>
        <Loader2 size={40} className="animate-spin text-white" />
      </div>
    )
  }

  // ── Not Found ──
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)' }}>
        <div className="text-center text-white">
          <Package size={64} className="mx-auto mb-4 text-slate-400" />
          <h1 className="text-2xl font-extrabold mb-2">رابط غير صالح</h1>
          <p className="text-slate-400">هذا الرابط غير موجود أو تم إلغاؤه</p>
        </div>
      </div>
    )
  }

  // ── Success ──
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)' }}>
        <div className="text-center text-white animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 border-2 border-green-500">
            <CheckCircle size={48} className="text-green-400" />
          </div>
          <h1 className="text-3xl font-extrabold mb-3">تم التسجيل بنجاح! 🎉</h1>
          <p className="text-slate-400 text-lg">جاري تحويلك لمتجرك...</p>
          <div className="mt-6 flex justify-center">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  // ── Registration Form ──
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #C9A84C, transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #9f1239, transparent)' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-amber-400/40"
            style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(159,18,57,0.15))' }}>
            <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
              <path d="M65 20 C45 20 30 35 30 55 C30 75 45 90 65 90 C50 82 40 68 40 55 C40 42 50 28 65 20Z" fill="#C9A84C" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">قمر الفيحاء للشحنات</h1>
          <p className="text-slate-400 text-sm font-medium">تسجيل حساب جديد</p>
          {client && (
            <div className="mt-3 inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 px-4 py-2 rounded-full">
              <Package size={14} className="text-amber-400" />
              <span className="text-amber-300 text-sm font-bold">{client.code}</span>
            </div>
          )}
        </div>

        {/* Form Card */}
        <div className="rounded-3xl p-8 border border-white/10 backdrop-blur-sm"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-300 text-right">الاسم الكامل *</label>
              <div className="relative">
                <User size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text" required placeholder="أدخل اسمك"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  disabled={submitting}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-11 py-3.5 text-white placeholder-slate-500 text-right focus:outline-none focus:border-amber-400/50 focus:bg-white/8 transition-all duration-200"
                />
              </div>
            </div>

            {/* Phone 1 */}
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-300 text-right">رقم الهاتف الأساسي *</label>
              <div className="relative">
                <Phone size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="tel" required placeholder="07XXXXXXXXX"
                  value={form.phone1} onChange={e => setForm(p => ({ ...p, phone1: e.target.value }))}
                  disabled={submitting} dir="ltr"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-11 py-3.5 text-white placeholder-slate-500 text-left focus:outline-none focus:border-amber-400/50 focus:bg-white/8 transition-all duration-200"
                />
              </div>
            </div>

            {/* Phone 2 */}
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-300 text-right">رقم الهاتف الثانوي</label>
              <div className="relative">
                <Phone size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="tel" placeholder="07XXXXXXXXX (اختياري)"
                  value={form.phone2} onChange={e => setForm(p => ({ ...p, phone2: e.target.value }))}
                  disabled={submitting} dir="ltr"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-11 py-3.5 text-white placeholder-slate-500 text-left focus:outline-none focus:border-amber-400/50 focus:bg-white/8 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-300 text-right">كلمة المرور *</label>
              <div className="relative">
                <Lock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'} required placeholder="4 أحرف على الأقل"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  disabled={submitting} minLength={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-11 pl-12 py-3.5 text-white placeholder-slate-500 text-right focus:outline-none focus:border-amber-400/50 focus:bg-white/8 transition-all duration-200"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Governorate + District */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold mb-2 text-slate-300 text-right">المنطقة *</label>
                <input
                  type="text" required placeholder="المنطقة"
                  value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))}
                  disabled={submitting}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 text-right focus:outline-none focus:border-amber-400/50 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-slate-300 text-right">المحافظة *</label>
                <select
                  required value={form.governorate} onChange={e => setForm(p => ({ ...p, governorate: e.target.value }))}
                  disabled={submitting}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-400/50 transition-all duration-200 appearance-none"
                  style={{ colorScheme: 'dark' }}>
                  <option value="" disabled>اختر المحافظة</option>
                  {IRAQI_GOVERNORATES.map(g => <option key={g} value={g} style={{ background: '#1a1a2e' }}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-300 text-right">العنوان الكامل *</label>
              <div className="relative">
                <Home size={16} className="absolute right-4 top-4 text-slate-500" />
                <textarea
                  required rows={2} placeholder="العنوان التفصيلي"
                  value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  disabled={submitting}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-11 py-3.5 text-white placeholder-slate-500 text-right focus:outline-none focus:border-amber-400/50 focus:bg-white/8 transition-all duration-200 resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit" disabled={submitting}
              className="w-full py-4 rounded-2xl font-extrabold text-white text-lg mt-2 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #f472b6, #06b6d4)', boxShadow: '0 8px 32px rgba(244,114,182,0.3)' }}>
              {submitting ? <Loader2 size={22} className="animate-spin" /> : null}
              تسجيل الحساب
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          قمر الفيحاء للشحنات — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  )
}
