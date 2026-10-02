'use client'
import { useState } from 'react'
import { SECTION_LABELS, type SiteContent, type TitleText } from '@/lib/content'
import { resetContent, saveContent } from './actions'

type Setter<T> = (next: T) => void

function Card({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group rounded-xl border border-gold bg-coal">
      <summary className="font-display text-gold flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-sm [&::-webkit-details-marker]:hidden">
        {title}
        <span className="flex items-center gap-3">
          <a href="/" target="_blank" onClick={(e) => e.stopPropagation()} className="text-xs font-normal text-muted hover:text-gold-light">
            Ver no site ↗
          </a>
          <span className="text-muted transition group-open:rotate-180">▾</span>
        </span>
      </summary>
      <div className="space-y-4 px-5 pb-5">{children}</div>
    </details>
  )
}

function Text({ label, value, onChange, rows, help }: { label: string; value: string; onChange: Setter<string>; rows?: number; help?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {rows ? (
        <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="field" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="field" />
      )}
      {help && <p className="mt-1 text-xs text-muted">{help}</p>}
    </div>
  )
}

const mini = 'rounded-md border border-white/15 px-2.5 py-1 text-xs text-text/80 hover:border-gold disabled:opacity-30'

function move<T>(list: T[], i: number, d: -1 | 1): T[] {
  const j = i + d
  if (j < 0 || j >= list.length) return list
  const next = [...list]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

/** Lista editável: cada item com ↑ ↓ Remover, e botão Adicionar no fim. */
function ListEditor<T>({ items, onChange, render, blank, addLabel }: {
  items: T[]
  onChange: Setter<T[]>
  render: (item: T, set: Setter<T>, i: number) => React.ReactNode
  blank: T
  addLabel: string
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-white/10 p-3">
          {render(item, (v) => onChange(items.map((x, j) => (j === i ? v : x))), i)}
          <div className="flex flex-wrap gap-2">
            <button type="button" className={mini} disabled={i === 0} onClick={() => onChange(move(items, i, -1))}>↑</button>
            <button type="button" className={mini} disabled={i === items.length - 1} onClick={() => onChange(move(items, i, 1))}>↓</button>
            <button type="button" className={`${mini} text-red-300`} onClick={() => onChange(items.filter((_, j) => j !== i))}>Remover</button>
          </div>
        </div>
      ))}
      <button type="button" className="btn-ghost rounded-lg px-4 py-2 text-xs" onClick={() => onChange([...items, blank])}>
        + {addLabel}
      </button>
    </div>
  )
}

function TitleTextList({ items, onChange, addLabel }: { items: TitleText[]; onChange: Setter<TitleText[]>; addLabel: string }) {
  return (
    <ListEditor
      items={items}
      onChange={onChange}
      addLabel={addLabel}
      blank={{ title: '', text: '' }}
      render={(it, set) => (
        <>
          <Text label="Título" value={it.title} onChange={(title) => set({ ...it, title })} />
          <Text label="Texto" value={it.text} rows={2} onChange={(text) => set({ ...it, text })} />
        </>
      )}
    />
  )
}

export function ContentEditor({ initial }: { initial: SiteContent }) {
  const [c, setC] = useState<SiteContent>(initial)
  const upd = <K extends keyof SiteContent>(key: K, patch: Partial<SiteContent[K]>) =>
    setC((prev) => ({ ...prev, [key]: { ...(prev[key] as object), ...patch } }))

  return (
    <>
      <div className="mb-5 rounded-xl border border-gold bg-coal p-4 text-sm text-text/80">
        <strong className="text-gold-light">Dicas:</strong> Enter = quebra de linha · *texto entre asteriscos* = destaque dourado · {'{carro}'} = nome do carro (mensagens de WhatsApp)
      </div>

      <form action={saveContent} className="space-y-4 pb-28 md:pb-6">
        <input type="hidden" name="content" value={JSON.stringify(c)} />

        <Card title="Blocos da página" open>
          <p className="text-xs text-muted">A capa (topo) sempre aparece primeiro. Use ↑ ↓ para mudar a ordem e desmarque para esconder um bloco.</p>
          <div className="space-y-2">
            {c.sections.map((s, i) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 p-3">
                <span className="text-sm text-text/90">{SECTION_LABELS[s.id]}</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={s.visible}
                      onChange={(e) => setC({ ...c, sections: c.sections.map((x, j) => (j === i ? { ...x, visible: e.target.checked } : x)) })}
                    />
                    Visível
                  </label>
                  <button type="button" className={mini} disabled={i === 0} onClick={() => setC({ ...c, sections: move(c.sections, i, -1) })}>↑</button>
                  <button type="button" className={mini} disabled={i === c.sections.length - 1} onClick={() => setC({ ...c, sections: move(c.sections, i, 1) })}>↓</button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Capa (topo do site)" open>
          <Text label="Chamada pequena (acima do título)" value={c.hero.eyebrow} onChange={(v) => upd('hero', { eyebrow: v })} />
          <Text label="Título — linha de cima" rows={2} value={c.hero.titleTop} onChange={(v) => upd('hero', { titleTop: v })} />
          <Text label="Título — linha de baixo (dourada)" rows={2} value={c.hero.titleBottom} onChange={(v) => upd('hero', { titleBottom: v })} />
          <Text label="Subtítulo" rows={3} value={c.hero.subtitle} onChange={(v) => upd('hero', { subtitle: v })} />
          <Text label="Botão principal" value={c.hero.ctaPrimary} onChange={(v) => upd('hero', { ctaPrimary: v })} />
          <Text label="Botão secundário" value={c.hero.ctaSecondary} onChange={(v) => upd('hero', { ctaSecondary: v })} />
          <p className="label">Itens de prova (pequenos, abaixo dos botões)</p>
          <TitleTextList items={c.hero.proof} onChange={(proof) => upd('hero', { proof })} addLabel="Adicionar item" />
        </Card>

        <Card title="Faixa de modelos">
          <ListEditor
            items={c.marquee}
            onChange={(marquee) => setC({ ...c, marquee })}
            blank=""
            addLabel="Adicionar texto"
            render={(it, set) => <Text label="Texto" value={it} onChange={set} />}
          />
        </Card>

        <Card title="Manifesto">
          <Text label="Chamada pequena" value={c.manifesto.eyebrow} onChange={(v) => upd('manifesto', { eyebrow: v })} />
          <Text label="Título" rows={3} value={c.manifesto.title} onChange={(v) => upd('manifesto', { title: v })} />
          <Text label="Texto" rows={4} value={c.manifesto.body} onChange={(v) => upd('manifesto', { body: v })} />
        </Card>

        <Card title="Estoque">
          <Text label="Chamada pequena" value={c.inventory.eyebrow} onChange={(v) => upd('inventory', { eyebrow: v })} />
          <Text label="Título" rows={2} value={c.inventory.title} onChange={(v) => upd('inventory', { title: v })} />
          <Text label="Subtítulo" rows={2} value={c.inventory.subtitle} onChange={(v) => upd('inventory', { subtitle: v })} />
          <Text label="Botão do carro" value={c.inventory.cta} onChange={(v) => upd('inventory', { cta: v })} />
          <Text label="Botão do carro vendido" value={c.inventory.ctaSold} onChange={(v) => upd('inventory', { ctaSold: v })} />
          <Text label="Mensagem quando não há carros" rows={3} value={c.inventory.empty} onChange={(v) => upd('inventory', { empty: v })} />
          <Text label="Botão quando não há carros" value={c.inventory.emptyCta} onChange={(v) => upd('inventory', { emptyCta: v })} />
        </Card>

        <Card title="O Padrão Rei">
          <Text label="Chamada pequena" value={c.pillars.eyebrow} onChange={(v) => upd('pillars', { eyebrow: v })} />
          <Text label="Título" rows={2} value={c.pillars.title} onChange={(v) => upd('pillars', { title: v })} />
          <Text label="Subtítulo" rows={3} value={c.pillars.subtitle} onChange={(v) => upd('pillars', { subtitle: v })} />
          <p className="label">Itens</p>
          <TitleTextList items={c.pillars.items} onChange={(items) => upd('pillars', { items })} addLabel="Adicionar item" />
        </Card>

        <Card title="Como funciona">
          <Text label="Chamada pequena" value={c.steps.eyebrow} onChange={(v) => upd('steps', { eyebrow: v })} />
          <Text label="Título" rows={2} value={c.steps.title} onChange={(v) => upd('steps', { title: v })} />
          <p className="label">Passos</p>
          <TitleTextList items={c.steps.items} onChange={(items) => upd('steps', { items })} addLabel="Adicionar passo" />
        </Card>

        <Card title="Visita">
          <Text label="Chamada pequena" value={c.visit.eyebrow} onChange={(v) => upd('visit', { eyebrow: v })} />
          <Text label="Título" rows={3} value={c.visit.title} onChange={(v) => upd('visit', { title: v })} />
          <Text label="Texto" rows={4} value={c.visit.body} onChange={(v) => upd('visit', { body: v })} />
          <Text label="Botão" value={c.visit.cta} onChange={(v) => upd('visit', { cta: v })} />
        </Card>

        <Card title="Perguntas frequentes">
          <Text label="Chamada pequena" value={c.faq.eyebrow} onChange={(v) => upd('faq', { eyebrow: v })} />
          <Text label="Título" rows={2} value={c.faq.title} onChange={(v) => upd('faq', { title: v })} />
          <Text label="Subtítulo" rows={3} value={c.faq.subtitle} onChange={(v) => upd('faq', { subtitle: v })} />
          <p className="label">Perguntas</p>
          <ListEditor
            items={c.faq.items}
            onChange={(items) => upd('faq', { items })}
            addLabel="Adicionar pergunta"
            blank={{ q: '', a: '' }}
            render={(it, set) => (
              <>
                <Text label="Pergunta" value={it.q} onChange={(q) => set({ ...it, q })} />
                <Text label="Resposta" rows={3} value={it.a} onChange={(a) => set({ ...it, a })} />
              </>
            )}
          />
        </Card>

        <Card title="Chamada final">
          <Text label="Título" rows={2} value={c.finalCta.title} onChange={(v) => upd('finalCta', { title: v })} />
          <Text label="Subtítulo" rows={2} value={c.finalCta.subtitle} onChange={(v) => upd('finalCta', { subtitle: v })} />
          <Text label="Botão" value={c.finalCta.cta} onChange={(v) => upd('finalCta', { cta: v })} />
        </Card>

        <Card title="Página do carro">
          <Text label="Selo (carro disponível)" value={c.vehiclePage.badge} onChange={(v) => upd('vehiclePage', { badge: v })} />
          <Text label="Título dos destaques" value={c.vehiclePage.highlightsTitle} onChange={(v) => upd('vehiclePage', { highlightsTitle: v })} />
          <Text label="Título da descrição" value={c.vehiclePage.aboutTitle} onChange={(v) => upd('vehiclePage', { aboutTitle: v })} />
          <Text label="Botão" value={c.vehiclePage.cta} onChange={(v) => upd('vehiclePage', { cta: v })} />
          <Text label="Botão (carro vendido)" value={c.vehiclePage.ctaSold} onChange={(v) => upd('vehiclePage', { ctaSold: v })} />
          <Text label="Observação abaixo do botão" rows={2} value={c.vehiclePage.note} onChange={(v) => upd('vehiclePage', { note: v })} />
          <Text label="Título do quadro de pilares" value={c.vehiclePage.pillarsTitle} onChange={(v) => upd('vehiclePage', { pillarsTitle: v })} />
          <Text label="Título de outros carros" rows={2} value={c.vehiclePage.othersTitle} onChange={(v) => upd('vehiclePage', { othersTitle: v })} />
        </Card>

        <Card title="Mensagens do WhatsApp">
          <Text label="Mensagem geral" rows={3} value={c.whatsapp.general} onChange={(v) => upd('whatsapp', { general: v })} />
          <Text label="Mensagem de visita" rows={3} value={c.whatsapp.visit} onChange={(v) => upd('whatsapp', { visit: v })} />
          <Text label="Mensagem de um carro" rows={3} value={c.whatsapp.vehicle} onChange={(v) => upd('whatsapp', { vehicle: v })} help="Use {carro} para o nome do carro." />
          <Text label="Mensagem de carro vendido" rows={3} value={c.whatsapp.sold} onChange={(v) => upd('whatsapp', { sold: v })} help="Use {carro} para o nome do carro." />
        </Card>

        <Card title="Google / compartilhamento">
          <Text label="Título (aba do navegador e Google)" value={c.seo.title} onChange={(v) => upd('seo', { title: v })} />
          <Text label="Descrição" rows={3} value={c.seo.description} onChange={(v) => upd('seo', { description: v })} />
        </Card>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gold bg-coal/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
          <button type="submit" className="btn-gold w-full rounded-xl px-6 py-3.5 text-sm font-bold uppercase tracking-widest md:w-auto">
            Salvar textos
          </button>
        </div>
      </form>

      <form
        action={resetContent}
        className="mt-6 pb-24 md:pb-0"
        onSubmit={(e) => {
          if (!confirm('Restaurar todos os textos para o padrão? Isso apaga as suas edições.')) e.preventDefault()
        }}
      >
        <button type="submit" className="btn-ghost rounded-lg px-4 py-2 text-xs">
          Restaurar textos padrão
        </button>
      </form>
    </>
  )
}
