import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const navItems = [
    { href: '/dashboard', label: 'Tổng quan' },
    { href: '/dashboard/api-keys', label: 'API Keys' },
    { href: '/dashboard/notifications', label: 'Thông báo' },
    { href: '/dashboard/webhook', label: 'Webhook' },
  ]

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white">WMN</h1>
          <p className="text-xs text-zinc-500 truncate">{user.email}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 text-sm rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-zinc-200 dark:border-zinc-800">
          <form action="/auth/signout" method="post">
            <button className="w-full text-left px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
              Đăng xuất
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}
