import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'تسجيل حساب - قمر الفيحاء للشحنات',
  description: 'سجّل حسابك في قمر الفيحاء للشحنات لمتابعة طلباتك',
  robots: 'noindex,nofollow',
}

export default function ClientRegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif' }}>
      {children}
    </div>
  )
}
