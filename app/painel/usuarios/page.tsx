import { requireAdmin } from '@/lib/auth'
import { addAdmin, removeAdmin } from './actions'
import { PasswordForm } from './password-form'

type AdminRow = { user_id: string; email: string; created_at: string }

export default async function UsuariosPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const { supabase, user } = await requireAdmin()
  const { ok, erro } = await searchParams
  const { data } = await supabase.from('suv_admins').select('user_id,email,created_at').order('created_at', { ascending: true })
  const admins = (data ?? []) as AdminRow[]
  const hasService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const box = 'rounded-xl border border-gold bg-coal p-5'

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="font-display text-gold text-2xl">Usuários</h1>
      {ok && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">Feito ✓</p>}
      {erro && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{erro}</p>}

      <section className={box}>
        <h2 className="label !mb-3">Com acesso ao painel</h2>
        <ul className="divide-y divide-white/10">
          {admins.map((a) => (
            <li key={a.user_id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm">
                  {a.email}
                  {a.user_id === user.id && <span className="ml-2 rounded-full border border-gold px-2 py-0.5 text-[10px] uppercase text-gold-light">você</span>}
                </p>
                <p className="text-xs text-muted">desde {new Date(a.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              {a.user_id !== user.id && (
                <form action={removeAdmin}>
                  <input type="hidden" name="userId" value={a.user_id} />
                  <button className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10">Remover acesso</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className={box}>
        <h2 className="label !mb-3">Adicionar sócio/usuário</h2>
        {hasService ? (
          <form action={addAdmin} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="email">E-mail</label>
                <input id="email" name="email" type="email" required className="field" />
              </div>
              <div>
                <label className="label" htmlFor="password">Senha (mín. 6)</label>
                <input id="password" name="password" type="text" minLength={6} required className="field" autoComplete="off" />
              </div>
            </div>
            <button className="btn-gold rounded-xl px-6 py-3 text-sm font-bold uppercase tracking-widest">Adicionar</button>
          </form>
        ) : (
          <p className="text-sm text-muted">Para adicionar usuários, configure a variável SUPABASE_SERVICE_ROLE_KEY no servidor.</p>
        )}
      </section>

      <section className={box}>
        <h2 className="label !mb-3">Alterar minha senha</h2>
        <PasswordForm />
      </section>
    </div>
  )
}
