import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'تسجيل حساب جديد - قمر الفيحاء للشحنات',
  description: 'سجّل حسابك في منصة قمر الفيحاء للشحنات لمتابعة طلباتك وشحناتك',
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif' }}>
      {children}
    </div>
  )
}
