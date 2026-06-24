'use client'

import { Wallet, ArrowRight, Save } from 'lucide-react'
import Link from 'next/link'

export default function PaymentSettingsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings" className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-gold hover:border-amber-200 transition-colors">
            <ArrowRight size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200">
              <Wallet size={20} className="text-gold" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800">اعدادات الدفع</h1>
          </div>
        </div>
        <button className="btn-primary shadow-sm">
          <Save size={18} /> حفظ التغييرات
        </button>
      </div>

      <div className="glass-card p-6">
        <div className="max-w-2xl space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-700">بوابة الدفع الافتراضية</label>
            <select className="input-field shadow-sm bg-slate-50">
              <option>كاش (نقدي)</option>
              <option>زين كاش</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
