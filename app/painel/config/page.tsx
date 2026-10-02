import { requireAdmin } from '@/lib/auth'
import { rowToConfig } from '@/lib/vehicles'
import type { ConfigRow } from '@/lib/types'
import { saveConfig } from './actions'

function Field({ name, label, value, help, area }: { name: string; label: string; value: string; help?: string; area?: boolean }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      {area ? (
        <textarea id={name} name={name} rows={3} defaultValue={value} className="field" />
      ) : (
        <input id={name} name={name} defaultValue={value} className="field" />
      )}
      {help && <p className="mt-1 text-xs text-muted">{help}</p>}
    </div>
  )
}

export default async function ConfigPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const { supabase } = await requireAdmin()
  const { ok, erro } = await searchParams
  const { data } = await supabase.from('suv_config').select('*').eq('id', 1).maybeSingle()
  const c = rowToConfig(data as ConfigRow | null)

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-gold mb-6 text-2xl">Configurações</h1>
      {ok && <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">Salvo ✓</p>}
      {erro && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{erro}</p>}
      <form action={saveConfig} className="space-y-5 rounded-xl border border-gold bg-coal p-5">
        <Field name="whatsapp" label="WhatsApp" value={c.whatsapp} help="Com DDD, ex.: 11 95396-5259" />
        <Field name="instagram" label="Instagram" value={c.instagram} help="@usuario ou link" />
        <Field name="tiktok" label="TikTok" value={c.tiktok} help="@usuario ou link" />
        <Field name="city" label="Cidade" value={c.city} />
        <Field name="addressNote" label="Observação de endereço" value={c.addressNote} />
        <Field name="hours" label="Horário" value={c.hours} />
        <button className="btn-gold w-full rounded-xl px-6 py-3 text-sm font-bold uppercase tracking-widest sm:w-auto">Salvar</button>
      </form>
    </div>
  )
}
