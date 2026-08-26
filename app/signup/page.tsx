'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); return }
    router.push('/dashboard')
  }

  async function handleGoogleSignup() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <div className="max-w-sm mx-auto mt-20 space-y-4">
      <h1 className="text-2xl font-bold">Đăng ký WMN</h1>
      <form onSubmit={handleSignup} className="space-y-3">
        <input type="email" placeholder="Email" required
          className="w-full border p-2 rounded"
          value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Mật khẩu" required minLength={6}
          className="w-full border p-2 rounded"
          value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button className="w-full bg-black text-white p-2 rounded">Đăng ký</button>
      </form>
      <button onClick={handleGoogleSignup}
        className="w-full border p-2 rounded flex items-center justify-center gap-2">
        Đăng ký bằng Google
      </button>
    </div>
  )
}