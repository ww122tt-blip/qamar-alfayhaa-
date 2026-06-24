'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Package, Users, BarChart3, Settings, ArrowLeft } from 'lucide-react'

export default function DashboardWelcomePage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.push('/dashboard/main'), 300)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8 bg-white shadow-xl border border-amber-100"
        style={{ boxShadow: '0 10px 40px -10px rgba(201,168,76,0.3)' }}>
        <svg viewBox="0 0 100 100" className="w-14 h-14" fill="none">
          <path d="M65 20 C45 20 30 35 30 55 C30 75 45 90 65 90 C50 82 40 68 40 55 C40 42 50 28 65 20Z" fill="#C9A84C" />
        </svg>
      </div>
      <h1 className="text-4xl font-extrabold mb-3 text-slate-800">
        مرحباً بك في
      </h1>
      <h2 className="text-3xl font-extrabold mb-5 text-gold">
        قمر الفيحاء للشحنات
      </h2>
      <p className="text-base mb-10 max-w-md font-medium text-slate-500">
        منصة متكاملة لإدارة الشحنات والعملاء والمدفوعات بكفاءة وسرعة فائقة
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        {[
          { icon: Package, label: 'تتبع متقدم', desc: 'لوجستي' },
          { icon: Users, label: 'إدارة العملاء', desc: 'قاعدة بيانات' },
          { icon: BarChart3, label: 'تقارير متقدمة', desc: 'مالي' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-white rounded-2xl p-5 text-center w-40 border border-slate-200 shadow-sm">
            <Icon size={24} className="mx-auto mb-3 text-gold" />
            <p className="text-sm font-bold text-slate-800 mb-1">{label}</p>
            <p className="text-xs font-semibold text-slate-400">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
