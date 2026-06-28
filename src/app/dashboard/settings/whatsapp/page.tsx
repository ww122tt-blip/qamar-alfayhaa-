'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Save, Loader2, QrCode, RefreshCw, Power, PowerOff, Shield, Database } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function WhatsAppSettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)

  // 1. Fetch data
  const fetchData = async () => {
    setLoading(true)
    let { data: setts, error } = await supabase.from('whatsapp_settings').select('*').limit(1).single()
    
    // If no row exists, let's create the default one automatically
    if (error && error.code === 'PGRST116') {
      const defaultSettings = {
        id: 1,
        api_url: 'http://138.68.133.239:8080',
        api_key: 'QamarAlFayhaa2026',
        instance_name: 'qamar_main',
        notify_new_shipment: true,
        notify_status_change: true,
        is_connected: false
      }
      const { data: newSetts, error: insertError } = await supabase.from('whatsapp_settings').insert([defaultSettings]).select().single()
      if (!insertError && newSetts) {
        setts = newSetts
      }
    }

    if (setts) {
      setSettings(setts)
    }

    const { data: lg } = await supabase.from('whatsapp_logs').select('*').order('sent_at', { ascending: false }).limit(10)
    if (lg) setLogs(lg)
    
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 2. Save Settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    if (settings?.id) {
      await supabase.from('whatsapp_settings').update({
        notify_new_shipment: settings.notify_new_shipment,
        notify_status_change: settings.notify_status_change
      }).eq('id', settings.id)
    }
    
    alert('تم حفظ الإعدادات بنجاح')
    setSaving(false)
  }

  // 3. Fetch QR Code from External Server
  const fetchQr = async () => {
    if (!settings?.api_url) {
      alert('يتم الآن تهيئة الاتصال بالخادم، يرجى المحاولة بعد قليل')
      return
    }
    setQrLoading(true)
    try {
      const url = settings.api_url.endsWith('/') ? settings.api_url.slice(0, -1) : settings.api_url
      // Evolution API endpoint to create/connect instance and get base64 QR
      const res = await fetch(`${url}/instance/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'apikey': settings.api_key || 'QamarAlFayhaa2026'
        },
        body: JSON.stringify({ 
          instanceName: settings.instance_name || 'qamar_main',
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      })
      const data = await res.json()
      if (data?.qrcode?.base64 || data?.base64) {
        setQrCode(data.qrcode?.base64 || data.base64)
      } else {
        alert('حدث خطأ أثناء جلب الباركود. هل السيرفر يعمل؟ ' + JSON.stringify(data))
      }
    } catch (err: any) {
      alert('لا يمكن الاتصال بسيرفر الواتساب الخارجي. هل السيرفر يعمل؟ ' + err.message)
    }
    setQrLoading(false)
  }

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-green-600" size={32} /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
          <MessageSquare size={24} className="text-[#25D366]" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">إعدادات ربط الواتساب</h1>
          <p className="text-sm text-slate-500 font-bold">اربط النظام بسيرفر Evolution API الخارجي</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Server Settings & Toggles */}
        <div className="lg:col-span-2 space-y-6">
          
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2">
              <MessageSquare size={18} className="text-slate-500" />
              <h2 className="font-bold text-slate-700">إعدادات الإشعارات</h2>
            </div>
            <div className="p-5 space-y-4">
              <h3 className="font-bold text-slate-700 mb-3 text-sm">متى يتم الإرسال للزبون؟</h3>
              
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input type="checkbox" 
                  checked={settings?.notify_new_shipment || false}
                  onChange={e => setSettings({...settings, notify_new_shipment: e.target.checked})}
                  className="w-5 h-5 rounded text-green-600 focus:ring-green-600 border-slate-300" />
                <div>
                  <div className="font-bold text-sm text-slate-800">عند إضافة شحنة جديدة</div>
                  <div className="text-xs text-slate-500">إرسال رسالة ترحيبية برقم التتبع</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input type="checkbox" 
                  checked={settings?.notify_status_change || false}
                  onChange={e => setSettings({...settings, notify_status_change: e.target.checked})}
                  className="w-5 h-5 rounded text-green-600 focus:ring-green-600 border-slate-300" />
                <div>
                  <div className="font-bold text-sm text-slate-800">عند تغيير حالة الشحنة</div>
                  <div className="text-xs text-slate-500">مثل: تم الاستلام، في التوصيل، تم التسليم</div>
                </div>
              </label>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-left">
              <button type="submit" disabled={saving} className="btn-primary bg-slate-800 hover:bg-slate-900 border-none px-6">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                حفظ الإعدادات
              </button>
            </div>
          </form>

          {/* Logs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
             <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-bold text-slate-700 text-sm">آخر الرسائل المرسلة</h2>
              <button onClick={fetchData} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                <RefreshCw size={12} /> تحديث
              </button>
            </div>
            <div className="p-0">
              {logs.length === 0 ? (
                <div className="text-center p-6 text-sm font-bold text-slate-400">لا توجد رسائل مرسلة بعد</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {logs.map(log => (
                    <li key={log.id} className="p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="font-mono text-sm text-slate-700" dir="ltr">{log.recipient_phone}</div>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                          log.status === 'sent' ? 'bg-green-100 text-green-700' :
                          log.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {log.status === 'sent' ? 'تم الإرسال' : log.status === 'failed' ? 'فشل' : 'قيد الإرسال'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{log.message}</p>
                      <div className="text-[10px] text-slate-400 font-mono">{formatDate(log.sent_at)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Connection & QR Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-center p-6">
            
            <div className="mb-4">
              {settings?.is_connected ? (
                <div className="w-20 h-20 mx-auto rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center text-green-500 mb-3">
                  <Shield size={32} />
                </div>
              ) : (
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-50 border-4 border-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <PowerOff size={32} />
                </div>
              )}
              
              <h2 className="text-lg font-extrabold text-slate-800">
                {settings?.is_connected ? 'الواتساب متصل ويعمل' : 'الواتساب غير متصل'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                حالة الجلسة: <span className="font-mono text-slate-700">{settings?.instance_name || 'qamar_main'}</span>
              </p>
            </div>

            {!settings?.is_connected && (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 mb-4 min-h-[200px] flex items-center justify-center flex-col relative overflow-hidden">
                {qrCode ? (
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48 mix-blend-multiply" />
                ) : (
                  <>
                    <QrCode size={48} className="text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400 font-bold px-4">اضغط على الزر لجلب الباركود من السيرفر ومسحه بجوالك</p>
                  </>
                )}
                {qrLoading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="animate-spin text-green-600" size={32} />
                  </div>
                )}
              </div>
            )}

            {!settings?.is_connected ? (
              <button onClick={fetchQr} disabled={qrLoading} className="w-full btn-primary bg-[#25D366] hover:bg-[#1DA851] border-none text-white py-3 justify-center text-sm">
                <QrCode size={16} /> جلب الباركود الآن
              </button>
            ) : (
              <button className="w-full btn-primary bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-3 justify-center text-sm font-bold">
                <Power size={16} /> فصل الرقم
              </button>
            )}

          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h3 className="font-extrabold text-amber-800 text-sm mb-2 flex items-center gap-2">
              <Shield size={16} /> ملاحظات أمنية
            </h3>
            <ul className="text-xs text-amber-700 space-y-2 list-disc list-inside font-medium leading-relaxed">
              <li>يجب أن يعمل سيرفر الـ VPS على مدار 24 ساعة.</li>
              <li>لا تقم بتسجيل الخروج من هاتفك (الأجهزة المرتبطة) وإلا سيتوقف الإرسال.</li>
              <li>تأكد من تحديث رابط الـ API إذا تغير الـ IP الخاص بالسيرفر.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
