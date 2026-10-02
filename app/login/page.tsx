'use client'
import { Suspense, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(params.get('erro') === 'sem-acesso' ? 'Esta conta não tem acesso ao painel.' : '')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      setError('E-mail ou senha incorretos.')
      return
    }
    router.push('/painel')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border border-gold bg-coal p-8 shadow-2xl">
      <div className="flex flex-col items-center">
        <Image src="/logo.jpg" alt="Rei do SUV" width={96} height={96} className="rounded-full" priority />
        <h1 className="font-display text-gold mt-5 text-2xl">Painel</h1>
        <div className="rule-gold mt-4 w-24" />
      </div>
      <div className="mt-7 space-y-4">
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input id="email" className="field" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="senha">Senha</label>
          <input id="senha" className="field" type="password" autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading}
          className="btn-gold w-full rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-widest disabled:opacity-60">
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </div>
    </form>
  )
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink p-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
