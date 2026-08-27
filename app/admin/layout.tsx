'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [admin, setAdmin] = useState<boolean | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      if (!user) { router.replace('/login'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      if (!mounted) return
      if (!profile?.is_admin) { router.replace('/dashboard'); return }
      setAdmin(true)
      setEmail(user.email ?? null)
    }
    checkAuth()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) router.replace('/login')
    })

    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [pathname, router, supabase])

  const navItems = [
    { href: '/admin', label: 'Super Admin' },
    { href: '/dashboard', label: 'Dashboard user' },
  ]

  if (admin === null) return <div className="min-h-screen flex items-center justify-center text-zinc-500">Đang tải...</div>

  const nav = (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMenuOpen(false)}
          className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
            pathname === item.href
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </>
  )

  const signOutBtn = (
    <button
      onClick={async () => {
        await supabase.auth.signOut()
        router.replace('/login')
      }}
      className="w-full text-left px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
    >
      Đăng xuất
    </button>
  )

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Desktop */}
      <div className="hidden md:flex md:min-h-screen">
        <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col fixed inset-y-0">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">WMN Admin</h1>
            <p className="text-xs text-zinc-500 truncate">{email ?? '...'}</p>
          </div>
          <nav className="flex-1 p-2 space-y-1">{nav}</nav>
          <div className="p-2 border-t border-zinc-200 dark:border-zinc-800">{signOutBtn}</div>
        </aside>
        <main className="flex-1 ml-64 p-6 overflow-auto">{children}</main>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
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
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">WMN Admin</h1>
            <span className="w-8 h-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full flex items-center justify-center text-xs font-bold">
              {(email ?? '?').charAt(0).toUpperCase()}
            </span>
          </div>
          {menuOpen && (
            <nav className="px-2 pb-3 space-y-1 border-t border-zinc-200 dark:border-zinc-800 pt-2">
              {nav}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">{signOutBtn}</div>
            </nav>
          )}
        </header>
        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}
