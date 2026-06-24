'use client'

import { Settings, Globe, CreditCard, Layers, MessageSquare, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

const settingsSections = [
  {
    id: 'general',
    title: 'الاعدادات العامة',
    description: 'اضغط للدخول',
    icon: Settings,
    color: '#C9A84C',
    href: '/dashboard/settings/general',
  },
  {
    id: 'shipping',
    title: 'حالات الشحن',
    description: 'اضغط للدخول',
    icon: Layers,
    color: '#ef4444',
    href: '/dashboard/settings/shipping-statuses',
  },
  {
    id: 'pricing',
    title: 'أنواع التسعير',
    description: 'اضغط للدخول',
    icon: CreditCard,
    color: '#22c55e',
    href: '/dashboard/settings/pricing',
  },
  {
    id: 'payment',
    title: 'طرق الدفع',
    description: 'اضغط للدخول',
    icon: Globe,
    color: '#3b82f6',
    href: '/dashboard/settings/payment',
  },
  {
    id: 'whatsapp',
    title: 'ربط واتساب',
    description: 'اضغط للدخول',
    icon: MessageSquare,
    color: '#16a34a',
    href: '/dashboard/settings/whatsapp',
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="page-header">
        <div className="page-title">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200">
            <Settings size={20} className="text-gold" />
          </div>
          <span className="text-slate-800">الاعدادات</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {settingsSections.map(s => {
          const Icon = s.icon
          return (
            <Link key={s.id} href={s.href}
              className="bg-white rounded-2xl p-6 flex items-center justify-between group cursor-pointer transition-all duration-300 hover:scale-[1.02] border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                  <Icon size={22} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-800">{s.title}</p>
                  <p className="text-xs mt-1 text-slate-400 font-medium group-hover:text-gold transition-colors">{s.description}</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-amber-50 transition-colors">
                <ChevronLeft size={16} className="text-slate-400 group-hover:text-gold transition-colors group-hover:-translate-x-0.5 duration-300" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
