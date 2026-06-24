'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Package, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

const ADMIN_COOKIE = 'qamar_admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function setAdminCookie(session: object) {
  const value = JSON.stringify(session)
  document.cookie = `${ADMIN_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Strict`
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // ── Demo admin credentials ──
      if (email === 'admin@qamar.com' && password === 'admin123') {
        await new Promise(r => setTimeout(r, 600))
        setAdminCookie({ authenticated: true, email, role: 'admin', name: 'المدير' })
        router.push(redirectTo)
        return
      }

      // ── Try profiles table login (username = email part before @) ──
      const username = email.includes('@') ? email.split('@')[0] : email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, username, role, is_active')
        .eq('username', username)
        .single()

      if (!profileError && profile && profile.is_active) {
        // Try supabase auth first
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (!signInError && data.user) {
          setAdminCookie({ authenticated: true, email, role: profile.role, name: profile.name, userId: data.user.id })
          router.push(redirectTo)
          return
        }
      }

      // ── Fallback: try supabase auth directly ──
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (!signInError && data.user) {
        setAdminCookie({ authenticated: true, email, role: 'user', name: data.user.email || '', userId: data.user.id })
        router.push(redirectTo)
        return
      }

      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    } catch (err) {
      setError('حدث خطأ في الاتصال بالسيرفر')
    } finally {
      setLoading(false)
    }
  }

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
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-amber-400/20" 
               style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(159,18,57,0.1))' }}>
            <svg viewBox="0 0 100 100" className="w-12 h-12" fill="none">
              <path d="M65 20 C45 20 30 35 30 55 C30 75 45 90 65 90 C50 82 40 68 40 55 C40 42 50 28 65 20Z" 
                    fill="#C9A84C" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">قمر الفيحاء</h1>
          <p className="text-amber-400/80 tracking-widest text-sm font-semibold mb-2">LOGISTICS</p>
          <p className="text-slate-400 text-sm">نظام إدارة الشحنات والتوصيل</p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl p-8 shadow-2xl border border-white/10 backdrop-blur-sm relative overflow-hidden" 
             style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-300 text-right">البريد الإلكتروني / اسم المستخدم</label>
              <input
                type="text"
                placeholder="أدخل بريدك الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 text-right focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all duration-200"
                dir="ltr"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-300 text-right">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pl-12 py-3.5 text-white placeholder-slate-500 text-right focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all duration-200"
                  dir="ltr"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm font-bold rounded-xl p-3 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-extrabold text-slate-900 text-lg mt-4 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #F4D068)' }}
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : 'تسجيل الدخول'}
            </button>
          </form>

          {/* Demo Hint */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-slate-500 mb-2">بيانات الدخول التجريبية للـ Admin:</p>
            <div className="inline-block bg-black/30 rounded-lg p-3 border border-white/5 text-slate-400 text-xs font-mono text-left">
              Email: admin@qamar.com<br/>
              Pass: admin123
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-8">
          جميع الحقوق محفوظة &copy; {new Date().getFullYear()} قمر الفيحاء
        </p>
      </div>
    </div>
  )
}

import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]"><Loader2 className="animate-spin text-amber-400" /></div>}>
      <LoginContent />
    </Suspense>
  )
}
