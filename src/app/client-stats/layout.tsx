import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'بوابة العميل - قمر الفيحاء للشحنات',
  description: 'تتبع شحناتك مع قمر الفيحاء',
  robots: 'noindex,nofollow',
}

/**
 * ISOLATED LAYOUT — Client Portal
 * No navigation, no sidebar, no links to the admin dashboard.
 * The client is completely sandboxed in their own pages.
 */
export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    // Just render children — no wrapper nav or links to admin system
    <>{children}</>
  )
}
