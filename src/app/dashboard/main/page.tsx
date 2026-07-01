'use client'

import { useState, useEffect } from 'react'
import {
  Package, Users, TrendingUp, AlertCircle, CheckCircle,
  RotateCcw, Wallet, MessageSquare, ArrowUpRight, ArrowDownRight,
  Clock, Truck, Loader2
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { formatCurrency, getStatusClass, getStatusLabel, formatDate } from '@/lib/utils'
import type { ShipmentStatus, Shipment, Client } from '@/types'
import { supabase } from '@/lib/supabase'

const PIE_COLORS = ['#9f1239', '#e11d48', '#C9A84C', '#eab308', '#22c55e', '#3b82f6']

// ====== STAT CARD ======
function StatCard({
  title, value, subtitle, icon: Icon, color, trend, trendValue
}: {
  title: string, value: string | number, subtitle?: string,
  icon: React.ElementType, color: string, trend?: 'up' | 'down' | 'neutral',
  trendValue?: string
}) {
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-xs font-bold mb-1 text-slate-500">{title}</p>
          <p className="text-2xl font-extrabold text-slate-800">{value}</p>
          {subtitle && <p className="text-xs mt-1 text-slate-400 font-medium">{subtitle}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      {trendValue && (
        <div className="flex items-center gap-1">
          {trend === 'up' ? (
            <ArrowUpRight size={14} className="text-green-500" />
          ) : trend === 'down' ? (
            <ArrowDownRight size={14} className="text-red-500" />
          ) : null}
          <span className={`text-xs font-bold ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-400'}`}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  )
}

// ====== CUSTOM TOOLTIP ======
function CustomTooltip({ active, payload, label }: {
  active?: boolean, payload?: Array<{ value: number }>, label?: string
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-4 py-3 text-sm">
        <p className="text-gold font-bold mb-1">{label}</p>
        <p className="text-slate-700 font-bold">{payload[0].value} شحنة</p>
      </div>
    )
  }
  return null
}

// ====== MAIN DASHBOARD ======
export default function MainDashboardPage() {
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [cashboxesCount, setCashboxesCount] = useState(0)
  const [totalCashboxBalance, setTotalCashboxBalance] = useState(0)
  const [warehousesCount, setWarehousesCount] = useState(0)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    let shipmentsQuery = supabase.from('shipments').select('*, client:clients(*)').order('created_at', { ascending: false })
    
    if (dateRange.from) shipmentsQuery = shipmentsQuery.gte('created_at', dateRange.from)
    if (dateRange.to) shipmentsQuery = shipmentsQuery.lte('created_at', dateRange.to + 'T23:59:59')
    
    const [shipmentsRes, clientsRes, cashboxesRes, warehousesRes, settingsRes] = await Promise.all([
      shipmentsQuery,
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('cashboxes').select('*'),
      supabase.from('warehouses').select('*', { count: 'exact', head: true }),
      supabase.from('settings').select('*')
    ])
    
    if (shipmentsRes.data) setShipments(shipmentsRes.data as unknown as Shipment[])
    if (clientsRes.data) setClients(clientsRes.data as unknown as Client[])
    if (cashboxesRes.data) {
      setCashboxesCount(cashboxesRes.data.length)
      setTotalCashboxBalance(cashboxesRes.data.reduce((sum: number, cb: any) => sum + (cb.balance || 0), 0))
    }
    if (warehousesRes.count) setWarehousesCount(warehousesRes.count)
    if (settingsRes.data) {
      const sets: Record<string, string> = {}
      settingsRes.data.forEach(s => sets[s.key] = s.value)
      setSettings(sets)
    }
    
    setLoading(false)
  }

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [])

  if (!mounted) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={32} className="text-gold animate-spin" />
      </div>
    )
  }

  // Calculate Stats
  const totalShipments = shipments.length
  const deliveredShipments = shipments.filter(s => s.status === 'delivered').length
  const pendingShipments = shipments.filter(s => ['new', 'picked_up'].includes(s.status)).length
  const outForDelivery = shipments.filter(s => s.status === 'out_for_delivery').length
  
  const totalDeliveryFees = shipments.reduce((sum, s) => sum + (s.delivery_fee || 0), 0)
  
  const totalClients = clients.length
  const activeClients = clients.filter(c => c.is_active).length

  // Calculate Governorate data
  const govMap = shipments.reduce((acc, s) => {
    acc[s.governorate] = (acc[s.governorate] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const governorateData = Object.entries(govMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  // Calculate Recent 7 Days Chart Data
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const shipmentTrend = last7Days.map(date => {
    const count = shipments.filter(s => s.created_at?.startsWith(date)).length
    const [year, month, day] = date.split('-')
    return { date: `${day}/${month}`, count }
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2 flex-wrap">
            التقارير والإحصائيات
            <span className="text-sm font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">لوحة التحكم</span>
          </h1>
        </div>

        {/* Date range + refresh */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <input type="date" value={dateRange.from}
            onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))}
            className="input-field text-xs py-2.5 px-3 w-full shadow-sm col-span-1" />
          <input type="date" value={dateRange.to}
            onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))}
            className="input-field text-xs py-2.5 px-3 w-full shadow-sm col-span-1" />
          
          <div className="col-span-2 flex gap-2 w-full">
            <button onClick={fetchData} className="btn-primary flex-1 py-2.5 text-xs gap-1.5 shadow-sm justify-center">
              <TrendingUp size={14} />
              تحديث
            </button>
            <button onClick={() => setDateRange({from:'', to:''})} className="btn-ghost flex-1 py-2.5 text-xs gap-1.5 bg-white shadow-sm hover:bg-slate-50 justify-center">
              إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 size={32} className="text-gold animate-spin" />
        </div>
      ) : (
        <>
          {/* Shipment Stats */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package size={18} className="text-slate-800" />
              <h2 className="text-base font-extrabold text-slate-800">إحصائيات الشحنات</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="إجمالي الشحنات" value={totalShipments} icon={Package} color="#C9A84C" />
              <StatCard title="في التوصيل" value={outForDelivery} icon={Truck} color="#3b82f6" />
              <StatCard title="جديدة (غير مستلمة)" value={pendingShipments} icon={Clock} color="#eab308" />
              <StatCard title="مسلمة" value={deliveredShipments} icon={CheckCircle} color="#22c55e" />
            </div>
          </div>

          {/* Financial Stats */}
          <div>
            <div className="flex items-center gap-2 mb-4 mt-2">
              <Wallet size={18} className="text-slate-800" />
              <h2 className="text-base font-extrabold text-slate-800">المالية المتوقعة</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="إجمالي المبالغ للشحنات (د.ع)" value={formatCurrency(totalDeliveryFees)} icon={Wallet} color="#0f172a"
                subtitle="إجمالي رسوم التوصيل" />
              <StatCard title="أرصدة الصناديق الحالية (د.ع)" value={formatCurrency(totalCashboxBalance)} icon={Wallet} color="#C9A84C"
                subtitle={`موزعة على ${cashboxesCount} صندوق`} />
            </div>
          </div>

          {/* Users Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-2">
            <div className="lg:col-span-4">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-slate-800" />
                <h2 className="text-sm font-extrabold text-slate-800">العملاء والعمليات</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="إجمالي العملاء" value={totalClients} icon={Users} color="#0f172a" />
                <StatCard title="عملاء نشطون" value={activeClients} icon={CheckCircle} color="#3b82f6" />
                <StatCard title="المستودعات" value={warehousesCount} icon={Package} color="#eab308" />
                <StatCard title="حالة الربط التقني" value={settings['waseet_api_key'] ? 'متصل' : 'غير متصل'} icon={AlertCircle} color={settings['waseet_api_key'] ? '#22c55e' : '#f43f5e'} subtitle="نظام وسيط" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">

            {/* Line Chart */}
            <div className="glass-card p-6 lg:col-span-2">
              <h3 className="text-base font-extrabold mb-6 text-slate-800">
                الشحنات خلال الأسبوع الأخير
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={shipmentTrend} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="count" stroke="#9f1239" strokeWidth={3}
                    dot={{ fill: '#ffffff', stroke: '#9f1239', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#6B0F1A', stroke: '#ffffff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="glass-card p-6">
              <h3 className="text-base font-extrabold mb-2 text-slate-800">
                الشحنات حسب المحافظة
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={governorateData.length ? governorateData : [{name: 'لا توجد بيانات', value: 1}]} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                    dataKey="value" paddingAngle={2} stroke="none">
                    {(governorateData.length ? governorateData : [{name: 'لا توجد بيانات', value: 1}]).map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} شحنة`, name]}
                    contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {governorateData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-xs font-semibold text-slate-500 truncate">{item.name}</span>
                    <span className="text-xs font-bold text-slate-800 mr-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Shipments Table */}
          <div className="glass-card overflow-hidden mt-6">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-extrabold text-slate-800">
                آخر 5 شحنات
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الرقم</th>
                    <th>العميل</th>
                    <th>المستلم</th>
                    <th>المحافظة</th>
                    <th>الحالة</th>
                    <th>المبلغ</th>
                    <th>التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.slice(0, 5).map(s => (
                    <tr key={s.id}>
                      <td>
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          #{s.number || s.code}
                        </span>
                      </td>
                      <td className="font-bold text-slate-800">{s.client?.name}</td>
                      <td className="font-medium text-slate-600">{s.recipient_name}</td>
                      <td className="text-slate-500 font-medium">{s.governorate}</td>
                      <td>
                        <span className={`badge ${getStatusClass(s.status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {getStatusLabel(s.status)}
                        </span>
                      </td>
                      <td className={`font-bold ${(s.delivery_fee || 0) > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                        {(s.delivery_fee || 0) > 0 ? formatCurrency(s.delivery_fee || 0) : '—'}
                      </td>
                      <td className="text-slate-400 text-xs font-medium">{formatDate(s.created_at)}</td>
                    </tr>
                  ))}
                  {shipments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 font-bold">لا توجد شحنات بعد</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
