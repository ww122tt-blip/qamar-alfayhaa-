'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { IRAQI_GOVERNORATES, generateClientCode } from '@/lib/utils'
import { Eye, EyeOff, Loader2, Package, CheckCircle, Phone, User, Lock, MapPin, Home, Building, Tag } from 'lucide-react'

export default function PublicSignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone1: '',
    phone2: '',
    password: '',
    governorate: '',
    district: '',
    address: '',
    business_name: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 4) {
      alert('كلمة المرور يجب أن تكون 4 أحرف على الأقل')
      return
    }
    setSubmitting(true)

    const code = generateClientCode()

    // Create client record with is_active = false (pending admin approval)
    const { data, error } = await supabase.from('clients').insert([{
      name: form.name,
      code,
      phones: [form.phone1, form.phone2].filter(Boolean),
      password: form.password,
      governorate: form.governorate,
      district: form.district || null,
      address: form.address,
      pricing_type: 'per_order',
      delivery_price: 5000,
      is_active: false, // Pending approval
    }]).select().single()

    if (data && !error) {
      // Add notification for admin
      await supabase.from('notifications').insert([{
        title: 'طلب تسجيل جديد',
        content: `طلب التسجيل من: ${form.name} - ${form.phone1}`,
        type: 'system',
        entity_type: 'client',
        entity_id: code,
        is_read: false,
        is_archived: false,
      }])
      // Add activity log
      await supabase.from('activity_logs').insert([{
        action: 'طلب تسجيل جديد',
        entity_type: 'client',
        entity_id: code,
        details: `طلب تسجيل من ${form.name} - الهاتف: ${form.phone1}`,
        user_name: form.name,
      }])
      setStep('success')
    } else {
      alert('حدث خطأ أثناء التسجيل: ' + (error?.message || 'يرجى المحاولة مرة أخرى'))
    }
    setSubmitting(false)
  }

  // ── Success Screen ──
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)' }}>
        <div className="text-center text-white max-w-md animate-fade-in">
          <div className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-400"
            style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.2), transparent)' }}>
            <CheckCircle size={56} className="text-green-400" />
          </div>
          <h1 className="text-3xl font-extrabold mb-3">تم استلام طلبك! 🎉</h1>
          <p className="text-slate-400 text-lg mb-6">
            تم إرسال طلب تسجيلك بنجاح.
            <br />سيتم مراجعته والتواصل معك قريباً.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-right">
            <p className="text-xs text-slate-400 font-bold mb-3 text-center">ملخص بياناتك</p>
            <div className="space-y-2 text-sm">
              {[
                { label: 'الاسم', value: form.name },
                { label: 'الهاتف', value: form.phone1 },
                { label: 'المحافظة', value: `${form.governorate}${form.district ? ' - ' + form.district : ''}` },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">{item.value}</span>
                  <span className="text-slate-500 text-xs">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-slate-600 text-xs mt-6">قمر الفيحاء للشحنات</p>
        </div>
      </div>
    )
  }

  // ── Form ──
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-10"
      style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)' }}>
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #C9A84C, transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #9f1239, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #C9A84C, transparent)' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-amber-400/40"
            style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(159,18,57,0.15))' }}>
            <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
              <path d="M65 20 C45 20 30 35 30 55 C30 75 45 90 65 90 C50 82 40 68 40 55 C40 42 50 28 65 20Z" fill="#C9A84C" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">تسجيل حساب جديد</h1>
          <p className="text-slate-400 text-sm">قمر الفيحاء للشحنات</p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl p-8 border border-white/10 backdrop-blur-sm space-y-5"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-300 text-right">الاسم الكامل *</label>
              <div className="relative">
                <User size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" required placeholder="أدخل اسمك الكامل"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  disabled={submitting}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-11 py-3.5 text-white placeholder-slate-500 text-right focus:outline-none focus:border-amber-400/60 transition-all duration-200" />
              </div>
            </div>

            {/* Business Name (optional) */}
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-300 text-right">اسم المشروع / المتجر</label>
              <div className="relative">
                <Building size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" placeholder="اختياري"
                  value={form.business_name} onChange={e => setForm(p => ({ ...p, business_name: e.target.value }))}
                  disabled={submitting}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-11 py-3.5 text-white placeholder-slate-500 text-right focus:outline-none focus:border-amber-400/60 transition-all duration-200" />
              </div>
            </div>

            {/* Phone 1 */}
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-300 text-right">رقم الهاتف الأساسي *</label>
              <div className="relative">
                <Phone size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="tel" required placeholder="07XXXXXXXXX"
                  value={form.phone1} onChange={e => setForm(p => ({ ...p, phone1: e.target.value }))}
                  disabled={submitting} dir="ltr"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-11 py-3.5 text-white placeholder-slate-500 text-left focus:outline-none focus:border-amber-400/60 transition-all duration-200" />
              </div>
            </div>

            {/* Phone 2 */}
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-300 text-right">رقم الهاتف الثانوي</label>
              <div className="relative">
                <Phone size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="tel" placeholder="07XXXXXXXXX (اختياري)"
                  value={form.phone2} onChange={e => setForm(p => ({ ...p, phone2: e.target.value }))}
                  disabled={submitting} dir="ltr"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-11 py-3.5 text-white placeholder-slate-500 text-left focus:outline-none focus:border-amber-400/60 transition-all duration-200" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-300 text-right">كلمة المرور *</label>
              <div className="relative">
                <Lock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type={showPassword ? 'text' : 'password'} required placeholder="6 أحرف على الأقل"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  disabled={submitting} minLength={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-11 pl-12 py-3.5 text-white placeholder-slate-500 text-right focus:outline-none focus:border-amber-400/60 transition-all duration-200" />
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
                <input type="text" required placeholder="المنطقة"
                  value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))}
                  disabled={submitting}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 text-right focus:outline-none focus:border-amber-400/60 transition-all duration-200" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-slate-300 text-right">المحافظة *</label>
                <select required value={form.governorate} onChange={e => setForm(p => ({ ...p, governorate: e.target.value }))}
                  disabled={submitting}
                  className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-400/60 transition-all duration-200 appearance-none">
                  <option value="" disabled>اختر</option>
                  {IRAQI_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-300 text-right">العنوان الكامل *</label>
              <div className="relative">
                <Home size={16} className="absolute right-4 top-4 text-slate-500" />
                <textarea required rows={2} placeholder="العنوان التفصيلي"
                  value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  disabled={submitting}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-11 py-3.5 text-white placeholder-slate-500 text-right focus:outline-none focus:border-amber-400/60 transition-all duration-200 resize-none" />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={submitting}
              className="w-full py-4 rounded-2xl font-extrabold text-white text-lg mt-2 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-xl"
              style={{ background: 'linear-gradient(135deg, #f472b6, #06b6d4)', boxShadow: '0 8px 32px rgba(244,114,182,0.3)' }}>
              {submitting ? <Loader2 size={22} className="animate-spin" /> : null}
              تسجيل الحساب
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          قمر الفيحاء للشحنات — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  )
}
