'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Package, Layers, Wallet, Warehouse,
  UserCog, Bell, Settings, Activity, LogOut, Menu, X,
  Moon, ChevronLeft, UserPlus, ScanLine
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingRegistrations, setPendingRegistrations] = useState(0)

  useEffect(() => {
    async function fetchUnread() {
      const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false).eq('is_archived', false)
      setUnreadCount(count || 0)
    }
    fetchUnread()
    // Fetch pending registrations count
    async function fetchPending() {
      const { count } = await supabase.from('clients').select('*', { count: 'exact', head: true }).eq('is_active', false)
      setPendingRegistrations(count || 0)
    }
    fetchPending()
    // Subscribe to real-time changes
    const channel = supabase.channel('notifications-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchUnread())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchPending())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const navItems = [
    { href: '/dashboard', label: 'شاشة الترحيب', icon: Moon },
    { href: '/dashboard/main', label: 'الرئيسية', icon: LayoutDashboard },
    { href: '/dashboard/clients', label: 'العملاء', icon: Users },
    { href: '/dashboard/registrations', label: 'طلبات التسجيل', icon: UserPlus, badge: pendingRegistrations },
    { href: '/dashboard/shipments', label: 'الشحنات', icon: Package },
    { href: '/dashboard/scanner', label: 'القارئ الآلي', icon: ScanLine },
    { href: '/dashboard/shelves', label: 'الشلفان', icon: Layers },
    { href: '/dashboard/cashboxes', label: 'الصناديق', icon: Wallet },
    { href: '/dashboard/warehouses', label: 'المستودعات', icon: Warehouse },
    { href: '/dashboard/users', label: 'المستخدمين', icon: UserCog },
    { href: '/dashboard/notifications', label: 'الاشعارات', icon: Bell, badge: unreadCount },
    { href: '/dashboard/settings', label: 'الاعدادات', icon: Settings },
    { href: '/dashboard/logs', label: 'سجل الحركات', icon: Activity },
  ]

  // ── Client-side second layer: check cookie exists ──
  const [authChecked, setAuthChecked] = useState(false)
  useEffect(() => {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('qamar_admin_session='))
    if (!cookie) {
      window.location.replace('/')
    } else {
      setAuthChecked(true)
    }
  }, [])

  if (!authChecked) return null

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 modal-overlay lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed top-0 right-0 z-50 h-full flex flex-col transition-all duration-300
          ${collapsed ? 'w-16' : 'w-64'}
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          {!collapsed && (
            <div className="flex items-center gap-3">
              {/* Mini moon logo */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-white shadow-sm border border-gold">
                <svg viewBox="0 0 100 100" className="w-5 h-5" fill="none">
                  <path d="M65 20 C45 20 30 35 30 55 C30 75 45 90 65 90 C50 82 40 68 40 55 C40 42 50 28 65 20Z"
                    fill="#C9A84C" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-sm leading-tight text-slate-900">قمر الفيحاء</p>
                <p className="text-xs text-gold tracking-widest font-semibold">LOGISTICS</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm border border-gold">
              <svg viewBox="0 0 100 100" className="w-4 h-4" fill="none">
                <path d="M65 20 C45 20 30 35 30 55 C30 75 45 90 65 90 C50 82 40 68 40 55 C40 42 50 28 65 20Z"
                  fill="#C9A84C" />
              </svg>
            </div>
          )}
          <button
            onClick={() => { setCollapsed(!collapsed); setSidebarOpen(false) }}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md transition-colors duration-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <ChevronLeft size={16} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Admin Profile */}
        {!collapsed && (
          <div className="p-4 border-b border-slate-50 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #6B0F1A, #9f1239)' }}>
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-slate-800">ADMIN</p>
                <p className="text-xs text-slate-500 font-medium">مدير النظام</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item relative ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white bg-red-500 shadow-sm">
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-100">
          <button
            className={`sidebar-item w-full text-red-500 hover:text-red-600 hover:bg-red-50 ${collapsed ? 'justify-center px-2' : ''}`}
            onClick={() => {
              // Clear admin session cookie
              document.cookie = 'qamar_admin_session=; path=/; max-age=0; SameSite=Strict'
              window.location.href = '/'
            }}
          >
            <LogOut size={18} />
            {!collapsed && <span className="font-bold">تسجيل خروج</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:mr-16' : 'lg:mr-64'}`}>

        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">

          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <Menu size={18} />
          </button>

          {/* Page title - filled by each page */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gold" />
            <span className="text-sm font-semibold text-slate-500">نظام إدارة الشحنات المتكامل</span>
          </div>

          {/* Right section: notifications + profile */}
          <div className="flex items-center gap-3">
            {/* Notifications bell */}
            <Link href="/dashboard/notifications" className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors duration-200 border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800">
              <Bell size={17} />
              {unreadCount > 0 && <span className="notif-dot">{unreadCount}</span>}
            </Link>

            {/* Profile avatar */}
            <div className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #6B0F1A, #9f1239)' }}>
                AD
              </div>
              <span className="hidden sm:block text-sm font-bold text-slate-800">ADMIN</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 animate-fade-in w-full overflow-x-hidden max-w-[100vw]">
          {children}
        </main>
      </div>
    </div>
  )
}
