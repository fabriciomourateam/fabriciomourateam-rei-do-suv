'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function PasswordForm() {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pw.length < 6) return setMsg({ ok: false, text: 'A senha precisa ter pelo menos 6 caracteres.' })
    if (pw !== confirm) return setMsg({ ok: false, text: 'As senhas não conferem.' })
    setLoading(true)
    const { error } = await createClient().auth.updateUser({ password: pw })
    setLoading(false)
    if (error) return setMsg({ ok: false, text: error.message })
    setPw('')
    setConfirm('')
    setMsg({ ok: true, text: 'Senha alterada ✓' })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="newpw">Nova senha</label>
          <input id="newpw" type="password" autoComplete="new-password" className="field" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="confpw">Confirmar senha</label>
          <input id="confpw" type="password" autoComplete="new-password" className="field" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>}
      <button disabled={loading} className="btn-gold rounded-xl px-6 py-3 text-sm font-bold uppercase tracking-widest disabled:opacity-60">
        {loading ? 'Salvando…' : 'Alterar senha'}
      </button>
    </form>
  )
}
