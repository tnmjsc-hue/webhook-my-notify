'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PLANS } from '@/lib/plans'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [plan, setPlan] = useState<string>('free')
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      if (!user) {
        router.replace('/login')
        return
      }
      setEmail(user.email ?? null)
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, is_admin')
        .eq('id', user.id)
        .single()
      if (!mounted) return
      if (profile) {
        setPlan(profile.plan ?? 'free')
        setIsAdmin(!!profile.is_admin)
      }
    }
    checkAuth()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace('/login')
        return
      }
      if (mounted) setEmail(session.user.email ?? null)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [pathname, router, supabase])

  const navItems = [
    { href: '/dashboard', label: 'Tổng quan' },
    { href: '/dashboard/api-keys', label: 'API Keys' },
    { href: '/dashboard/notifications', label: 'Thông báo' },
    { href: '/dashboard/webhook', label: 'Webhook' },
    { href: '/dashboard/upgrade', label: 'Nâng cấp' },
    ...(isAdmin ? [{ href: '/admin', label: 'Super Admin' }] : []),
  ]

  const isActive = (href: string) => pathname === href

  const nav = (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMenuOpen(false)}
          className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
            isActive(item.href)
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </>
  )

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex-col fixed inset-y-0">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">WMN</h1>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {plan}
            </span>
          </div>
          <p className="text-xs text-zinc-500 truncate mt-1">{email ?? '...'}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">{nav}</nav>
        <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
          <Link
            href="/dashboard/upgrade"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2 text-sm rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-90 transition-opacity"
          >
            Nâng cấp gói
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.replace('/login')
            }}
            className="w-full text-left px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 -m-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Menu"
            >
              <svg className="w-6 h-6 text-zinc-700 dark:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">WMN</h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {plan}
              </span>
              <span className="w-8 h-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full flex items-center justify-center text-xs font-bold">
                {(email ?? '?').charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          {menuOpen && (
            <nav className="px-2 pb-3 space-y-1 border-t border-zinc-200 dark:border-zinc-800 pt-2">
              {nav}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.replace('/login')
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            </nav>
          )}
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
